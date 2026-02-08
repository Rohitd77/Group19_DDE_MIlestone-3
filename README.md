# CADBridgeAI - AI-Driven STL to STEP Converter

**Data-Driven Engineering Project | WiSe 2025/26 | Group 19**

An intelligent web application that converts mesh-based STL files into feature-aware STEP CAD models using AI-powered geometry detection and classification.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [System Requirements](#system-requirements)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [Usage Guide](#usage-guide)
- [API Key Setup](#api-key-setup)
- [Project Structure](#project-structure)
- [Technical Details](#technical-details)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

CADBridgeAI addresses the gap between mesh-based STL files and parametric CAD models. Unlike traditional "black-box" converters, our tool:

- Uses **AI to detect** geometric primitives (planes, cylinders, cones, spheres)
- Provides **explainable mapping** between mesh regions and CAD surfaces
- Offers **human-in-the-loop** validation and editing
- Generates **detailed validation reports**

## ✨ Features

1. **STL Upload & Analysis**
   - Drag-and-drop file upload
   - Mesh validation and statistics
   - Bounding box calculation
   - Volume and surface area analysis

2. **AI-Based Geometry Detection**
   - Automatic region segmentation
   - Surface normal clustering
   - Primitive type classification

3. **Interactive Mapping Editor**
   - Review AI-detected surfaces
   - Edit surface types manually
   - Confidence scores for each region
   - Detailed rationale for classifications

4. **STEP File Generation**
   - ISO-10303 STEP format output
   - Analytic surface representation
   - Validation reporting

5. **Professional UI/UX**
   - Modern, responsive design
   - Step-by-step workflow
   - Real-time progress tracking
   - Comprehensive feedback

## 💻 System Requirements

### Minimum Requirements
- **OS**: Windows 10/11, Linux (Ubuntu 20.04+), macOS 10.15+
- **RAM**: 8 GB (16 GB recommended)
- **Storage**: 500 MB free space
- **Python**: 3.8 or higher
- **Browser**: Chrome, Firefox, or Edge (latest versions)

### Tested Configuration
- Lenovo ThinkPad P14s
- 16 GB RAM
- NVIDIA T550 GPU with 4 GB VRAM
- Ubuntu 22.04 / Windows 11

## 🚀 Installation

### Step 1: Clone or Extract the Project

If you have the ZIP file:
```bash
unzip cadbridgeai.zip
cd cadbridgeai
```

Or if using Git:
```bash
git clone <repository-url>
cd cadbridgeai
```

### Step 2: Create Python Virtual Environment

**On Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**On Linux/Mac:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

This will install:
- Flask (web framework)
- numpy (numerical computations)
- numpy-stl (STL file processing)
- anthropic (AI API client)
- werkzeug (utilities)

### Step 4: Verify Installation

```bash
python -c "import flask, numpy, stl, anthropic; print('All dependencies installed successfully!')"
```

## 🎮 Running the Application

### With AI Classification (Recommended)

To enable AI-powered geometry classification:

1. **Edit `.env` file** and add your API key:
```
API_KEY=your-api-key-here
FLASK_HOST=127.0.0.1
FLASK_PORT=5000
FLASK_DEBUG=False
```

   **Alternative:** Set environment variable directly (temporary):
   ```bash
   set API_KEY=your-key    # Windows
   export API_KEY=your-key  # Linux/Mac
   ```

2. **Run the application:**
```bash
python app.py
```

Then open your browser to:
```
http://localhost:5000
```

### Without AI (Optional)

If you don't have an API key, the application also works **without one** using rule-based classification. Simply skip the `.env` setup and run:

```bash
python app.py
```

### The application will start on:
```
http://127.0.0.1:5000
```

You should see output like:
```
 * Running on http://127.0.0.1:5000
 * Debug mode: on
```

## 📖 Usage Guide

### Step-by-Step Workflow

#### 1. Upload STL File
- Click "Choose File" or drag & drop an STL file
- Configure units (mm/cm/in) and tolerance
- File is automatically uploaded and validated

#### 2. View Mesh Analysis
- Review mesh statistics (triangles, vertices, volume)
- Check bounding box dimensions
- Verify surface area calculations
- Click "Detect Geometric Regions →"

#### 3. Geometry Detection
- System segments mesh into regions
- Groups triangles by surface normals
- Displays detected regions with statistics
- Click "Classify with AI →"

#### 4. AI Classification & Mapping
- AI analyzes each region
- Suggests surface types (plane/cylinder/cone/sphere/freeform)
- Provides confidence scores
- Shows detailed rationale
- **Click any region to edit** surface type manually
- Click "Save Mapping" to save changes
- Click "Generate STEP File →" when satisfied

#### 5. Download Results
- View validation report with coverage statistics
- Download STEP file
- Download mapping JSON
- Download validation report
- Start new conversion if needed

### Sample STL Files

For testing, you can use:
- Simple geometric shapes (cube, cylinder, sphere)
- CAD models from online repositories
- 3D printed part designs
- Mechanical components

Recommended file size: < 10 MB, < 1M triangles for optimal performance

## 🔑 API Key Setup

### Getting an AI API Key

**For Graders:** Your university/instructor will provide the API key.

**For Others:** Contact your organization for an API key.

### Cost Estimation

- Average cost per conversion: ~$0.01-0.05
- 10 test runs: ~$0.10-0.50 total
- We limit requests to minimize costs

### Setting the API Key

**Method 1: Using .env file (Recommended)**

Edit `.env` and add your key:
```
API_KEY=your-api-key-here
```

**Method 2: Environment Variable (Temporary)**
```bash
export API_KEY=your-key  # Linux/Mac
set API_KEY=your-key     # Windows
```

**⚠️ Security Note**: Never commit `.env` or API keys to version control! The `.env` file is already in `.gitignore`.

## 📁 Project Structure

```
cadbridgeai/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── README.md             # This file
├── templates/
│   └── index.html        # Main HTML template
├── static/
│   ├── css/
│   │   └── styles.css    # Application styles
│   └── js/
│       └── app.js        # Client-side JavaScript
├── uploads/              # Temporary upload storage (created automatically)
└── outputs/              # Generated files (created automatically)
```

## 🔧 Technical Details

### Architecture

**Frontend**:
- Pure HTML5, CSS3, JavaScript (no frameworks)
- Responsive design with CSS Grid/Flexbox
- Asynchronous API calls with Fetch API

**Backend**:
- Flask web framework
- RESTful API endpoints
- Numpy for geometry processing
- numpy-stl for STL parsing

**AI Integration**:
- AI-powered classification
- Fallback to rule-based classification
- JSON-based surface mapping

### Key Algorithms

1. **Mesh Analysis**: Computes volume, surface area, bounding box using numpy-stl
2. **Region Segmentation**: Clusters triangles by surface normal similarity
3. **AI Classification**: AI analysis of geometric features
4. **STEP Generation**: Creates ISO-10303 formatted output

### API Endpoints

- `POST /upload` - Upload STL file
- `GET /analyze/<job_id>` - Analyze mesh geometry
- `GET /detect/<job_id>` - Detect geometric regions
- `GET /classify/<job_id>` - AI classification
- `POST /update-mapping/<job_id>` - Update surface mapping
- `GET /convert/<job_id>` - Generate STEP file
- `GET /download/<filename>` - Download results

## 🐛 Troubleshooting

### Application Won't Start

**Error: `ModuleNotFoundError: No module named 'flask'`**
```bash
pip install -r requirements.txt
```

**Error: `Address already in use`**
```bash
# Change port in app.py (last line):
app.run(debug=True, host='0.0.0.0', port=5001)
```

### File Upload Issues

**Error: "Invalid file type"**
- Ensure file has `.stl` extension
- Check file is a valid binary or ASCII STL

**Error: "File too large"**
- Maximum size is 50 MB
- Simplify mesh or reduce triangle count

### AI Classification Not Working

**No API key error**
- Set `API_KEY` environment variable
- Application falls back to rule-based classification

**API rate limit error**
- Wait a few minutes between requests
- Most API services have reasonable rate limits

### STEP File Issues

**File is empty or invalid**
- Check that mapping was generated successfully
- Verify STL file was properly analyzed
- Review validation report for errors

### Browser Compatibility

- Clear browser cache and cookies
- Try Chrome/Firefox latest version
- Disable browser extensions that might interfere

### Performance Issues

**Slow processing**
- Large files (>100K triangles) take longer
- Ensure adequate RAM available
- Close other applications

**Out of memory errors**
- Reduce STL file size
- Increase system RAM
- Process smaller batches

## 📊 Testing Checklist

Before grading, verify:

- [ ] Virtual environment activated
- [ ] All dependencies installed
- [ ] Application starts without errors
- [ ] Can upload STL file
- [ ] Mesh analysis completes
- [ ] Region detection works
- [ ] AI classification runs (with or without API key)
- [ ] Can edit surface mappings
- [ ] STEP file generates
- [ ] Can download all output files
- [ ] Validation report displays correctly

## 👥 Authors

**Group 19**
- Jahana Jabbar (4106234)
- Rohit Chandrakant Deshpande (4106190)

## 📄 License

This project was developed as part of the Data-Driven Engineering course at the university.

## 🙏 Acknowledgments

- Course instructors and TAs
- numpy-stl library contributors
- Flask framework team

---

**Last Updated**: February 2025
**Version**: 1.0.0
**Course**: Data-Driven Engineering WiSe 2025/26
