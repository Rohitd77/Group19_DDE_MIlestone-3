@echo off
echo ============================================
echo CADBridgeAI - Automated Setup and Launch
echo ============================================
echo.

REM Check Python installation
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from python.org
    pause
    exit /b 1
)

echo [1/6] Python found!
python --version
echo.

REM Create virtual environment
echo [2/6] Creating virtual environment...
if not exist venv (
    python -m venv venv
    echo Virtual environment created.
) else (
    echo Virtual environment already exists.
)
echo.

REM Activate virtual environment and install dependencies
echo [3/6] Installing dependencies...
call venv\Scripts\activate.bat
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt
echo Dependencies installed.
echo.

REM Generate sample STL file
echo [4/6] Generating sample STL file...
if not exist sample_cube.stl (
    python generate_sample_stl.py
) else (
    echo Sample file already exists.
)
echo.

REM Check API key
echo [5/6] Checking API configuration...
if defined ANTHROPIC_API_KEY (
    echo AI features ENABLED - API key found
) else (
    echo AI features DISABLED - No API key set
    echo Set ANTHROPIC_API_KEY environment variable to enable AI
    echo The app will work with geometric classification only
)
echo.

REM Run the application
echo [6/6] Starting CADBridgeAI server...
echo.
echo ============================================
echo   Application running on http://localhost:5000
echo   Press Ctrl+C to stop the server
echo   
echo   Quick Test:
echo   1. Open http://localhost:5000
echo   2. Upload sample_cube.stl
echo   3. Follow the 5-step workflow
echo ============================================
echo.

python app.py

pause

