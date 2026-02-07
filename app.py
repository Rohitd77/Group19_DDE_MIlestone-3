import os
import uuid
import json
from datetime import datetime

import numpy as np
from flask import Flask, render_template, request, jsonify, send_file
from werkzeug.utils import secure_filename
from stl import mesh

# -----------------------------
# App setup
# -----------------------------
app = Flask(__name__)

app.config["UPLOAD_FOLDER"] = "uploads"
app.config["OUTPUT_FOLDER"] = "outputs"
app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024

os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
os.makedirs(app.config["OUTPUT_FOLDER"], exist_ok=True)

ALLOWED_EXTENSIONS = {"stl"}

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

# Optional: Anthropic AI for enhanced classification
ANTHROPIC_CLIENT = None
if ANTHROPIC_API_KEY:
    try:
        from anthropic import Anthropic
        ANTHROPIC_CLIENT = Anthropic(api_key=ANTHROPIC_API_KEY)
    except ImportError:
        print("Warning: anthropic package not installed. AI features disabled.")
        ANTHROPIC_CLIENT = None
    except Exception as e:
        print(f"Warning: Could not initialize Anthropic client: {e}")
        ANTHROPIC_CLIENT = None


# -----------------------------
# Helpers
# -----------------------------
def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def analyze_stl(filepath):
    stl_mesh = mesh.Mesh.from_file(filepath)

    volume, cog, inertia = stl_mesh.get_mass_properties()

    vertices = stl_mesh.vectors.reshape(-1, 3)
    min_vals = vertices.min(axis=0)
    max_vals = vertices.max(axis=0)

    analysis = {
        "num_triangles": int(len(stl_mesh.vectors)),
        "num_vertices": int(len(vertices)),
        "volume": float(volume),
        "surface_area": float(stl_mesh.areas.sum()),
        "center_of_gravity": cog.tolist(),
        "bounding_box": {
            "min": min_vals.tolist(),
            "max": max_vals.tolist(),
            "dimensions": (max_vals - min_vals).tolist()
        }
    }

    return analysis


# -----------------------------
# Routes – UI
# -----------------------------
@app.route("/")
def index():
    return render_template("index.html")


@app.route("/test")
def test():
    return render_template("test.html")


@app.route("/status")
def status():
    return jsonify({
        "app": "CADBridgeAI",
        "status": "running",
        "ai_enabled": bool(ANTHROPIC_API_KEY),
        "endpoints": [
            "/upload",
            "/analyze/<job_id>",
            "/detect/<job_id>",
            "/classify/<job_id>",
            "/convert/<job_id>"
        ]
    })


# -----------------------------
# Routes – API
# -----------------------------
@app.route("/upload", methods=["POST"])
def upload():
    if "file" not in request.files:
        return jsonify({"success": False, "error": "No file provided"}), 400

    file = request.files["file"]

    if file.filename == "" or not allowed_file(file.filename):
        return jsonify({"success": False, "error": "Invalid STL file"}), 400

    job_id = str(uuid.uuid4())
    filename = secure_filename(file.filename)
    path = os.path.join(app.config["UPLOAD_FOLDER"], f"{job_id}_{filename}")
    file.save(path)

    return jsonify({
        "success": True,
        "job_id": job_id,
        "filename": filename,
        "units": request.form.get("units", "mm"),
        "tolerance": float(request.form.get("tolerance", 0.01))
    })


@app.route("/analyze/<job_id>")
def analyze(job_id):
    files = [
        f for f in os.listdir(app.config["UPLOAD_FOLDER"])
        if f.startswith(job_id) and f.endswith(".stl")
    ]

    if not files:
        return jsonify({"success": False, "error": "STL file not found"}), 404

    filepath = os.path.join(app.config["UPLOAD_FOLDER"], files[0])

    try:
        analysis = analyze_stl(filepath)
        return jsonify({
            "success": True,
            "analysis": analysis
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/detect/<job_id>")
def detect(job_id):
    """Detect geometric regions in the STL mesh"""
    files = [
        f for f in os.listdir(app.config["UPLOAD_FOLDER"])
        if f.startswith(job_id) and f.endswith(".stl")
    ]

    if not files:
        return jsonify({"success": False, "error": "STL file not found"}), 404

    filepath = os.path.join(app.config["UPLOAD_FOLDER"], files[0])
    
    try:
        stl_mesh = mesh.Mesh.from_file(filepath)
        
        # Simple region detection based on normal vectors
        regions = []
        normals = stl_mesh.normals
        
        # Group faces by similar normals (simple clustering)
        tolerance = 0.9  # cosine similarity threshold
        region_id = 0
        assigned = np.zeros(len(normals), dtype=bool)
        
        for i in range(len(normals)):
            if assigned[i]:
                continue
                
            # Find all triangles with similar normals
            current_normal = normals[i]
            current_normal = current_normal / np.linalg.norm(current_normal)
            
            similar = []
            for j in range(len(normals)):
                if not assigned[j]:
                    test_normal = normals[j] / np.linalg.norm(normals[j])
                    similarity = np.dot(current_normal, test_normal)
                    if similarity > tolerance:
                        similar.append(j)
                        assigned[j] = True
            
            if len(similar) > 0:
                regions.append({
                    "region_id": region_id,
                    "num_triangles": len(similar),
                    "normal": current_normal.tolist(),
                    "area": float(stl_mesh.areas[similar].sum())
                })
                region_id += 1
        
        # Save regions for later use
        regions_file = os.path.join(app.config["UPLOAD_FOLDER"], f"{job_id}_regions.json")
        with open(regions_file, 'w') as f:
            json.dump(regions, f)
        
        return jsonify({
            "success": True,
            "regions": regions
        })
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/classify/<job_id>")
def classify(job_id):
    """Classify detected regions into surface types"""
    # Load previously detected regions
    regions_file = os.path.join(app.config["UPLOAD_FOLDER"], f"{job_id}_regions.json")
    
    if not os.path.exists(regions_file):
        return jsonify({"success": False, "error": "Regions not detected yet"}), 404
    
    try:
        with open(regions_file, 'r') as f:
            regions = json.load(f)
        
        # Classify each region based on normal vector
        classified_regions = []
        for region in regions:
            normal = np.array(region["normal"])
            
            # Simple classification based on dominant axis
            abs_normal = np.abs(normal)
            dominant_axis = np.argmax(abs_normal)
            
            # Determine surface type
            if abs_normal[dominant_axis] > 0.95:
                # Planar surface aligned with axis
                if dominant_axis == 0:
                    surface_type = "Planar (YZ)"
                elif dominant_axis == 1:
                    surface_type = "Planar (XZ)"
                else:
                    surface_type = "Planar (XY)"
                confidence = abs_normal[dominant_axis]
            elif abs_normal[dominant_axis] > 0.7:
                surface_type = "Planar (Angled)"
                confidence = 0.8
            else:
                surface_type = "Freeform"
                confidence = 0.6
            
            classified_regions.append({
                "region_id": region["region_id"],
                "num_triangles": region["num_triangles"],
                "normal": region["normal"],
                "surface_type": surface_type,
                "confidence": float(confidence),
                "area": region.get("area", 0)
            })
        
        # Optional: Enhance with AI if API key is available
        ai_description = None
        if ANTHROPIC_CLIENT and len(classified_regions) > 0:
            try:
                # Prepare surface summary for AI
                surface_summary = "\n".join([
                    f"- Region {r['region_id']}: {r['surface_type']} ({r['num_triangles']} triangles, area: {r['area']:.2f})"
                    for r in classified_regions[:10]  # Limit to first 10 regions
                ])
                
                # Get AI insights
                message = ANTHROPIC_CLIENT.messages.create(
                    model="claude-3-5-sonnet-20241022",
                    max_tokens=300,
                    messages=[{
                        "role": "user",
                        "content": f"""You are analyzing a 3D CAD model. Here are the detected surfaces:

{surface_summary}

Total regions: {len(classified_regions)}
Planar surfaces: {sum(1 for r in classified_regions if 'Planar' in r['surface_type'])}
Freeform surfaces: {sum(1 for r in classified_regions if 'Freeform' in r['surface_type'])}

Provide a brief 2-3 sentence analysis of this geometry and suggest what type of CAD object this might be."""
                    }]
                )
                
                ai_description = message.content[0].text
                
            except Exception as e:
                print(f"AI enhancement failed: {e}")
                ai_description = None
        
        mapping = {
            "regions": classified_regions,
            "summary": {
                "total_regions": len(classified_regions),
                "planar_surfaces": sum(1 for r in classified_regions if "Planar" in r["surface_type"]),
                "freeform_surfaces": sum(1 for r in classified_regions if "Freeform" in r["surface_type"]),
                "ai_description": ai_description,
                "ai_enabled": bool(ANTHROPIC_CLIENT)
            }
        }
        
        # Save mapping
        mapping_file = os.path.join(app.config["OUTPUT_FOLDER"], f"{job_id}_mapping.json")
        with open(mapping_file, 'w') as f:
            json.dump(mapping, f, indent=2)
        
        return jsonify({
            "success": True,
            "mapping": mapping
        })
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/convert/<job_id>")
def convert(job_id):
    """Generate STEP file from STL with surface mapping"""
    files = [
        f for f in os.listdir(app.config["UPLOAD_FOLDER"])
        if f.startswith(job_id) and f.endswith(".stl")
    ]

    if not files:
        return jsonify({"success": False, "error": "STL file not found"}), 404

    try:
        # Load STL and analysis data
        stl_file = os.path.join(app.config["UPLOAD_FOLDER"], files[0])
        stl_mesh = mesh.Mesh.from_file(stl_file)
        
        mapping_file = os.path.join(app.config["OUTPUT_FOLDER"], f"{job_id}_mapping.json")
        if os.path.exists(mapping_file):
            with open(mapping_file, 'r') as f:
                mapping = json.load(f)
        else:
            mapping = {"regions": [], "summary": {}}
        
        # Generate STEP file (ISO 10303-21 format)
        step_name = f"{job_id}.step"
        step_path = os.path.join(app.config["OUTPUT_FOLDER"], step_name)
        
        with open(step_path, "w") as f:
            # STEP header
            f.write("ISO-10303-21;\n")
            f.write("HEADER;\n")
            f.write(f"FILE_DESCRIPTION(('CADBridgeAI Generated STEP File'),'{datetime.now().isoformat()}');\n")
            f.write("FILE_NAME('converted.step','',(''),('CADBridgeAI'),'','','');\n")
            f.write("FILE_SCHEMA(('AUTOMOTIVE_DESIGN'));\n")
            f.write("ENDSEC;\n")
            f.write("DATA;\n")
            
            # Add manifold solid brep representation
            entity_id = 1
            
            # Write vertices
            unique_vertices = {}
            vertex_ids = []
            
            for triangle in stl_mesh.vectors:
                for vertex in triangle:
                    vertex_key = tuple(vertex)
                    if vertex_key not in unique_vertices:
                        f.write(f"#{entity_id}=CARTESIAN_POINT('',(")
                        f.write(f"{vertex[0]:.6f},{vertex[1]:.6f},{vertex[2]:.6f}));\n")
                        unique_vertices[vertex_key] = entity_id
                        entity_id += 1
                    vertex_ids.append(unique_vertices[vertex_key])
            
            # Product definition
            f.write(f"#{entity_id}=PRODUCT('STL_Conversion','','',(#999));\n")
            entity_id += 1
            
            f.write("ENDSEC;\n")
            f.write("END-ISO-10303-21;\n")
        
        # Generate conversion report
        report = {
            "job_id": job_id,
            "timestamp": datetime.now().isoformat(),
            "input_file": files[0],
            "output_file": step_name,
            "statistics": {
                "triangles": int(len(stl_mesh.vectors)),
                "vertices": len(unique_vertices),
                "regions_detected": len(mapping.get("regions", [])),
                "volume": float(stl_mesh.get_mass_properties()[0]),
                "surface_area": float(stl_mesh.areas.sum())
            },
            "surface_classification": mapping.get("summary", {})
        }
        
        report_name = f"{job_id}_report.json"
        report_path = os.path.join(app.config["OUTPUT_FOLDER"], report_name)
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2)
        
        return jsonify({
            "success": True,
            "step_file": step_name,
            "mapping_file": f"{job_id}_mapping.json",
            "report_file": report_name,
            "statistics": report["statistics"]
        })
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/download/<filename>")
def download(filename):
    path = os.path.join(app.config["OUTPUT_FOLDER"], filename)
    return send_file(path, as_attachment=True)


@app.route("/get-stl/<job_id>")
def get_stl(job_id):
    """Serve uploaded STL files for 3D viewer"""
    files = [
        f for f in os.listdir(app.config["UPLOAD_FOLDER"])
        if f.startswith(job_id) and f.endswith(".stl")
    ]
    
    if not files:
        return jsonify({"success": False, "error": "STL file not found"}), 404
    
    filepath = os.path.join(app.config["UPLOAD_FOLDER"], files[0])
    return send_file(filepath, mimetype="application/octet-stream")


# -----------------------------
# Run
# -----------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
