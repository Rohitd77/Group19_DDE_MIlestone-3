# CADBridgeAI - Grading Instructions

## � Important Note for Graders

**API Key:** This application uses Anthropic Claude AI for enhanced surface classification. The app works perfectly **without** an API key (using geometric classification), but for full AI features, please use your university-provided Anthropic API key as mentioned in the submission guidelines (up to 10 requests will be used during testing).

---

## 🚀 Quick Start (Fool-Proof)

### **Option 1: Automated Setup (Recommended)**

1. **Set API Key** (Optional - use university-provided key for full AI features):
   ```cmd
   set ANTHROPIC_API_KEY=your_university_api_key_here
   ```

2. **Run the application**:
   ```cmd
   setup_and_run.bat
   ```

3. **Open your browser** to: **http://localhost:5000**

That's it! The batch file handles everything automatically.

### **Option 2: Manual Setup**

If the batch file doesn't work:

```cmd
# 1. Create virtual environment
python -m venv venv

# 2. Activate virtual environment
venv\Scripts\activate.bat

# 3. Install dependencies
pip install -r requirements.txt

# 4. Set API key (optional)
set ANTHROPIC_API_KEY=your_api_key_here

# 5. Run application
python app.py
```

Then open **http://localhost:5000** in your browser.

---

## 📋 System Requirements

✅ **Tested on Lenovo ThinkPad P14s specs:**
- Windows 10/11
- Python 3.8 or higher
- 16GB RAM (app uses ~200MB)
- Modern web browser (Chrome, Edge, Firefox)
- No GPU required (Three.js uses CPU rendering for basic models)

---

## 🧪 Testing the Application

### **Step-by-Step Test:**

1. **Upload STL File**
   - Click "Choose File" or drag & drop
   - Use `sample_cube.stl` (auto-generated) or any STL file
   - You should see: Upload success message

2. **View Analysis** (Step 2)
   - 3D model appears with interactive viewer
   - Statistics show: triangles, vertices, volume, surface area
   - You can rotate (drag) and zoom (scroll)

3. **Detect Regions** (Step 3)
   - Click "Detect Geometric Regions →"
   - Regions appear with triangle counts and normals
   - Progress completes in 1-3 seconds

4. **AI Classification** (Step 4)
   - Click "Classify with AI →"
   - Surfaces classified as Planar/Freeform
   - Confidence scores displayed
   - **With API Key**: Enhanced AI descriptions
   - **Without API Key**: Geometric classification (still works!)

5. **Generate STEP** (Step 5)
   - Click "Generate STEP File →"
   - Side-by-side comparison viewers appear
   - Download buttons become active
   - Files saved in `outputs/` folder

---

## 📁 Expected Output Files

After running a complete workflow:

```
outputs/
  ├── <job_id>.step           # Generated STEP file (ISO 10303-21 format)
  ├── <job_id>_mapping.json   # Surface classification mapping
  └── <job_id>_report.json    # Conversion statistics report
```

---

## 🔑 API Key Configuration

### **With University-Provided Anthropic API Key:**

**Windows (Command Prompt):**
```cmd
set ANTHROPIC_API_KEY=sk-ant-xxxxx
python app.py
```

**Windows (PowerShell):**
```powershell
$env:ANTHROPIC_API_KEY="sk-ant-xxxxx"
python app.py
```

**Permanent (add to system environment variables):**
1. Search "Environment Variables" in Windows
2. Add new system variable: `ANTHROPIC_API_KEY`
3. Value: `sk-ant-xxxxx`
4. Restart terminal

### **Behavior:**
- **With API Key**: Enhanced AI-powered surface descriptions and recommendations
- **Without API Key**: Geometric-based classification (fully functional)

The app shows API status at: **http://localhost:5000/status**

---

## ✅ Verification Checklist

- [ ] Server starts without errors
- [ ] Can access http://localhost:5000
- [ ] Can upload STL file
- [ ] 3D viewer shows model
- [ ] Region detection completes
- [ ] Classification shows results
- [ ] STEP file generates
- [ ] Files downloadable

---

## 🐛 Troubleshooting

### **Port 5000 already in use:**
```python
# In app.py, change line 193:
app.run(host="0.0.0.0", port=5001, debug=True)  # Use port 5001
```

### **Dependencies fail to install:**
```cmd
pip install --upgrade pip
pip install -r requirements.txt
```

### **3D viewer not showing:**
- Hard refresh browser: `Ctrl + Shift + R`
- Check browser console (F12) for errors
- Visit test page: http://localhost:5000/test

### **Import errors:**
```cmd
# Ensure virtual environment is activated
venv\Scripts\activate.bat
# Reinstall dependencies
pip install -r requirements.txt
```

---

## 💡 Features Demonstrated

1. **STL File Processing**: Upload, parse, and analyze binary/ASCII STL files
2. **3D Visualization**: Interactive Three.js viewer with rotation, zoom, wireframe
3. **Mesh Analysis**: Compute volume, surface area, bounding boxes
4. **Region Detection**: Segment mesh by surface normals (geometric algorithm)
5. **AI Classification**: Classify surfaces using geometric rules + optional LLM enhancement
6. **STEP Generation**: Export to ISO 10303-21 STEP format
7. **Data Persistence**: Save regions, mappings, and reports as JSON
8. **REST API**: Clean Flask backend with proper error handling
9. **Responsive UI**: Modern gradient design with loading states
10. **Comparison View**: Side-by-side STL (mesh) vs STEP (surfaces)

---

## 📊 Expected Performance

- **Upload**: < 1 second (typical STL < 10MB)
- **Analysis**: < 2 seconds
- **Detection**: 1-5 seconds (depends on mesh complexity)
- **Classification**: 2-10 seconds (with API key: +2-5s for LLM call)
- **STEP Generation**: 1-3 seconds

**Memory Usage**: ~200-500MB (depending on STL size)

---

## 📝 Notes for Graders

- The application works **completely offline** (without API key) using geometric algorithms
- API key enables **enhanced AI descriptions** via Anthropic Claude
- All core functionality (detection, classification, STEP export) works without internet
- Sample STL file (`sample_cube.stl`) is auto-generated for testing
- The app has **comprehensive error handling** and user-friendly messages
- **Console logging** available (F12 in browser) for debugging

---

## 🎯 Grading Criteria Addressed

### **Functionality:**
✅ Complete STL to STEP conversion pipeline  
✅ Geometric region detection  
✅ Surface classification (geometric + optional AI)  
✅ STEP file generation (ISO 10303-21 compliant)  
✅ File upload/download  
✅ Data persistence  

### **User Experience:**
✅ Modern, intuitive UI with step-by-step workflow  
✅ Interactive 3D visualization  
✅ Real-time progress indicators  
✅ Clear error messages  
✅ Drag-and-drop file upload  
✅ Responsive design  
✅ Loading states and status messages  

---

## 📞 Support

If you encounter any issues during grading:
1. Check `setup_and_run.bat` output for errors
2. Visit http://localhost:5000/test for diagnostics
3. Check browser console (F12 → Console tab)
4. Ensure Python 3.8+ is installed: `python --version`
