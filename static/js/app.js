// CADBridgeAI JavaScript Application (FINAL – API aligned)

let currentJobId = null;
let currentMapping = null;

// DOM Elements
const fileInput = document.getElementById('file-input');
const dropZone = document.getElementById('drop-zone');
const uploadStatus = document.getElementById('upload-status');
const loadingOverlay = document.getElementById('loading-overlay');
const loadingText = document.getElementById('loading-text');

// Section navigation
const sections = {
    upload: document.getElementById('upload-section'),
    analysis: document.getElementById('analysis-section'),
    detection: document.getElementById('detection-section'),
    classification: document.getElementById('classification-section'),
    results: document.getElementById('results-section')
};

// Init
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});

function setupEventListeners() {
    fileInput.addEventListener('change', handleFileSelect);

    dropZone.addEventListener('dragover', e => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', handleDrop);

    document.getElementById('start-detection').addEventListener('click', startDetection);
    document.getElementById('start-classification').addEventListener('click', startClassification);
    if (document.getElementById('save-mapping')) {
        document.getElementById('save-mapping').addEventListener('click', saveMapping);
    }
    document.getElementById('generate-step').addEventListener('click', generateSTEP);
    document.getElementById('download-step').addEventListener('click', () => downloadFile('step'));
    document.getElementById('download-mapping').addEventListener('click', () => downloadFile('mapping'));
    document.getElementById('download-report').addEventListener('click', () => downloadFile('report'));
}

function handleDrop(e) {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
    }
}

function handleFileSelect(e) {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
}

// =======================
// Upload
// =======================

async function handleFile(file) {
    if (!file.name.toLowerCase().endsWith('.stl')) {
        showStatus('error', 'Please select a valid STL file');
        return;
    }

    showLoading('Uploading file...');

    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('units', document.getElementById('units').value);
        formData.append('tolerance', document.getElementById('tolerance').value);

        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Upload failed');
        }

        currentJobId = data.job_id;
        console.log('File uploaded successfully, job_id:', currentJobId);
        showStatus('success', `File uploaded: ${data.filename}`);

        console.log('Starting analysis...');
        await analyzeFile();

    } catch (error) {
        showStatus('error', error.message);
    } finally {
        hideLoading();
    }
}

// =======================
// Analyze
// =======================

async function analyzeFile() {
    console.log('analyzeFile started for job:', currentJobId);
    showLoading('Analyzing STL mesh...');

    try {
        console.log('Fetching analysis from /analyze/' + currentJobId);
        const response = await fetch(`/analyze/${currentJobId}`);
        const data = await response.json();
        console.log('Analysis response:', data);

        if (!data.success || !data.analysis) {
            throw new Error(data.error || 'Analysis data missing');
        }

        displayAnalysis(data.analysis);
        navigateToSection('analysis');
        console.log('Navigated to analysis section');

    } catch (error) {
        console.error('Analysis error:', error);
        showStatus('error', 'Analysis failed: ' + error.message);
    } finally {
        hideLoading();
    }
}

function displayAnalysis(analysis) {
    console.log('displayAnalysis called with:', analysis);
    console.log('Current Job ID:', currentJobId);
    
    document.getElementById('num-triangles').textContent = analysis.num_triangles.toLocaleString();
    document.getElementById('num-vertices').textContent = analysis.num_vertices.toLocaleString();
    document.getElementById('volume').textContent = analysis.volume.toFixed(2) + ' mm³';
    document.getElementById('surface-area').textContent = analysis.surface_area.toFixed(2) + ' mm²';

    const dims = analysis.bounding_box.dimensions;
    document.getElementById('bbox-dims').innerHTML = `
        <p>Width: ${dims[0].toFixed(2)} mm</p>
        <p>Height: ${dims[1].toFixed(2)} mm</p>
        <p>Depth: ${dims[2].toFixed(2)} mm</p>
    `;

    console.log('About to navigate to analysis section...');
    navigateToSection('analysis');
    console.log('Section navigated, waiting for render...');
    
    // Wait for section to be visible and rendered
    setTimeout(() => {
        console.log('Now initializing viewers...');
        initViewers();
        console.log('Viewers initialized, waiting before loading STL...');
        setTimeout(() => {
            console.log('Now loading STL for job:', currentJobId);
            loadSTLIntoViewer(currentJobId);
        }, 300);
    }, 100);
}

// =======================
// Detect
// =======================

async function startDetection() {
    showLoading('Detecting geometric regions...');

    try {
        const response = await fetch(`/detect/${currentJobId}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Detection failed');
        }

        displayRegions(data.regions || data);
        navigateToSection('detection');

    } catch (error) {
        showStatus('error', error.message);
    } finally {
        hideLoading();
    }
}

function displayRegions(regions) {
    const container = document.getElementById('regions-container');
    container.innerHTML = '';

    if (!regions || regions.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #94a3b8;">No regions detected yet. Feature is under development.</p>';
        return;
    }

    regions.forEach(region => {
        const card = document.createElement('div');
        card.className = 'region-card';
        card.innerHTML = `
            <h4>Region ${region.region_id}</h4>
            <p>Triangles: ${region.num_triangles || 'N/A'}</p>
            <p>Normal: [${region.normal ? region.normal.map(n => n.toFixed(2)).join(', ') : 'N/A'}]</p>
        `;
        container.appendChild(card);
    });
}

// =======================
// Classify
// =======================

async function startClassification() {
    showLoading('Classifying regions...');

    try {
        const response = await fetch(`/classify/${currentJobId}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Classification failed');
        }

        currentMapping = data.mapping || data;
        displayMapping(currentMapping);
        navigateToSection('classification');

    } catch (error) {
        showStatus('error', error.message);
    } finally {
        hideLoading();
    }
}

function displayMapping(mapping) {
    const container = document.getElementById('mapping-list');
    container.innerHTML = '';

    if (!mapping || !mapping.regions || mapping.regions.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #94a3b8;">No classification data available. Feature is under development.</p>';
        return;
    }

    // Show AI description if available
    if (mapping.summary && mapping.summary.ai_description) {
        const aiBox = document.createElement('div');
        aiBox.style.cssText = 'background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 20px; border-radius: 12px; margin-bottom: 20px; color: white;';
        aiBox.innerHTML = `
            <h4 style="margin: 0 0 10px 0; display: flex; align-items: center;">
                <span style="font-size: 24px; margin-right: 10px;">🤖</span>
                AI Analysis
                <span style="margin-left: 10px; font-size: 12px; background: rgba(255,255,255,0.2); padding: 3px 8px; border-radius: 4px;">Powered by Claude</span>
            </h4>
            <p style="margin: 0; line-height: 1.6; opacity: 0.95;">${mapping.summary.ai_description}</p>
        `;
        container.appendChild(aiBox);
    }

    // Show summary
    if (mapping.summary) {
        const summary = document.createElement('div');
        summary.style.cssText = 'background: #334155; padding: 15px; border-radius: 8px; margin-bottom: 15px;';
        summary.innerHTML = `
            <strong>Summary:</strong> 
            ${mapping.summary.total_regions} regions detected | 
            ${mapping.summary.planar_surfaces} planar | 
            ${mapping.summary.freeform_surfaces} freeform
        `;
        container.appendChild(summary);
    }

    // Show individual regions
    mapping.regions.forEach(region => {
        const item = document.createElement('div');
        item.className = 'mapping-item';
        item.innerHTML = `
            <strong>Region ${region.region_id}</strong>
            <p>Surface: ${region.surface_type || 'Unknown'}</p>
            <p>Confidence: ${region.confidence ? (region.confidence * 100).toFixed(0) : 'N/A'}%</p>
        `;
        container.appendChild(item);
    });
}

// =======================
// Save Mapping
// =======================

async function saveMapping() {
    if (!currentMapping) {
        showStatus('error', 'No mapping data to save');
        return;
    }
    
    const mappingJson = JSON.stringify(currentMapping, null, 2);
    const blob = new Blob([mappingJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentJobId}_manual_mapping.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showStatus('success', 'Mapping saved successfully');
}

// =======================
// Convert
// =======================

async function generateSTEP() {
    showLoading('Generating STEP file...');

    try {
        const response = await fetch(`/convert/${currentJobId}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Conversion failed');
        }

        window.generatedFiles = data;
        navigateToSection('results');
        
        // Initialize comparison viewers for results page
        console.log('Initializing comparison viewers...');
        setTimeout(() => {
            initComparisonViewers(currentJobId);
        }, 200);

    } catch (error) {
        showStatus('error', error.message);
    } finally {
        hideLoading();
    }
}

// =======================
// Utilities
// =======================

function downloadFile(type) {
    if (!window.generatedFiles) return;
    const filename = window.generatedFiles[`${type}_file`];
    if (filename) {
        window.location.href = `/download/${filename}`;
    }
}

function navigateToSection(sectionName) {
    Object.values(sections).forEach(s => s.classList.remove('active'));
    if (sections[sectionName]) sections[sectionName].classList.add('active');
}

function showLoading(message) {
    loadingText.textContent = message;
    loadingOverlay.classList.add('active');
}

function hideLoading() {
    loadingOverlay.classList.remove('active');
}

function showStatus(type, message) {
    uploadStatus.className = `status-message ${type}`;
    uploadStatus.textContent = message;
    uploadStatus.style.display = 'block';
    setTimeout(() => uploadStatus.style.display = 'none', 5000);
}
