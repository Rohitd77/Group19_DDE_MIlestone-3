#!/bin/bash

echo "============================================"
echo "CADBridgeAI - Automated Setup and Test"
echo "============================================"
echo ""

# Check Python installation
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is not installed"
    echo "Please install Python 3.8+ from python.org"
    exit 1
fi

echo "[1/5] Python found!"
python3 --version
echo ""

# Create virtual environment
echo "[2/5] Creating virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "Virtual environment created."
else
    echo "Virtual environment already exists."
fi
echo ""

# Activate virtual environment and install dependencies
echo "[3/5] Installing dependencies..."
source venv/bin/activate
pip install -r requirements.txt
echo ""

# Generate sample STL file
echo "[4/5] Generating sample STL file..."
python generate_sample_stl.py
echo ""

# Run the application
echo "[5/5] Starting CADBridgeAI..."
echo ""
echo "============================================"
echo "Application starting on http://localhost:5000"
echo "Press Ctrl+C to stop the server"
echo "============================================"
echo ""

python app.py
