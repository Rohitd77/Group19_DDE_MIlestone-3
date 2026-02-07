# 🚀 Quick Start Guide - CADBridgeAI

## For Graders/Evaluators

### ⚡ Fastest Way to Run (30 seconds)

1. **Open Terminal** in the `cadbridgeai` folder

2. **Create virtual environment** (first time only):
   ```bash
   python -m venv venv
   ```

3. **Activate environment**:
   
   **Windows:**
   ```bash
   venv\Scripts\activate
   ```
   
   **Linux/Mac:**
   ```bash
   source venv/bin/activate
   ```

4. **Install dependencies** (first time only):
   ```bash
   pip install -r requirements.txt
   ```

5. **Run the application**:
   ```bash
   python app.py
   ```

6. **Open browser** to:
   ```
   http://localhost:5000
   ```

### 🎯 Testing the Application

#### Option 1: With Your Own STL File
- Upload any STL file through the web interface
- Follow the 5-step workflow

#### Option 2: Generate Test File
```bash
python generate_sample_stl.py
```
This creates `sample_cube.stl` - upload this through the web interface.

### 🔑 Optional: Enable AI (For Best Results)

**Without API Key**: Works fine, uses rule-based classification

**With API Key** (for AI classification):

Windows:
```bash
set ANTHROPIC_API_KEY=your-key-here
python app.py
```

Linux/Mac:
```bash
export ANTHROPIC_API_KEY=your-key-here
python app.py
```

**API Key can be provided separately if needed for grading.**

### ✅ Verification Checklist

- [ ] Application starts on port 5000
- [ ] Can access web interface
- [ ] Can upload STL file
- [ ] Mesh analysis shows statistics
- [ ] Region detection completes
- [ ] AI/rule-based classification works
- [ ] Can edit surface mappings
- [ ] STEP file generates
- [ ] Can download all files
- [ ] Validation report displays

### 📊 Expected Workflow Time

- Upload + Analysis: ~5 seconds
- Region Detection: ~2-3 seconds
- AI Classification: ~5-10 seconds (or instant with rule-based)
- STEP Generation: ~2 seconds
- **Total**: < 30 seconds per conversion

### 🐛 If Something Goes Wrong

1. **Port already in use?**
   - Edit `app.py`, change port 5000 to 5001 in last line

2. **Module not found?**
   - Run: `pip install -r requirements.txt`

3. **Upload fails?**
   - Check STL file is valid binary or ASCII format
   - Try the sample cube: `python generate_sample_stl.py`

4. **Can't see interface?**
   - Clear browser cache
   - Try different browser (Chrome/Firefox)

### 💡 Key Features to Test

1. **Upload**: Drag & drop or click to upload
2. **Analysis**: View mesh statistics and bounding box
3. **Detection**: See regions detected from normals
4. **Classification**: AI suggests surface types with confidence
5. **Editing**: Click any region to manually override type
6. **Mapping**: Save and review the mapping JSON
7. **Conversion**: Generate ISO-10303 STEP file
8. **Download**: Get STEP, mapping, and validation report

### 📞 Support

For issues during grading, check:
- Full README.md for detailed troubleshooting
- Console output for error messages
- Browser developer console (F12) for client-side errors

---

**Ready to grade?** Just run `python app.py` and open http://localhost:5000 ! 🎉
