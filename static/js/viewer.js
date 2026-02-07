// 3D Viewer Module for CADBridgeAI
// Handles STL and STEP visualization using Three.js

class CADViewer {
    constructor(containerId) {
        console.log('CADViewer constructor called for:', containerId);
        this.container = document.getElementById(containerId);
        
        if (!this.container) {
            console.error('Container element not found:', containerId);
            return;
        }
        
        console.log('Container found:', {
            width: this.container.clientWidth,
            height: this.container.clientHeight,
            offsetWidth: this.container.offsetWidth,
            offsetHeight: this.container.offsetHeight
        });
        
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.mesh = null;
        this.edgesHelper = null;
        this.wireframeMode = false;
        this.animationId = null;
        
        this.init();
    }

    init() {
        console.log('Initializing CADViewer...');
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1e293b);

        // Camera
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        this.camera.position.set(50, 50, 50);
        this.camera.lookAt(0, 0, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight1.position.set(10, 10, 5);
        this.scene.add(directionalLight1);

        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
        directionalLight2.position.set(-10, -10, -5);
        this.scene.add(directionalLight2);

        // Grid
        const gridHelper = new THREE.GridHelper(100, 20, 0x444444, 0x222222);
        this.scene.add(gridHelper);

        // Axes
        const axesHelper = new THREE.AxesHelper(30);
        this.scene.add(axesHelper);

        // Controls
        this.setupControls();

        // Start animation
        this.animate();

        // Handle resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        console.log('CADViewer initialization complete');
    }

    setupControls() {
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };
        
        this.renderer.domElement.addEventListener('mousedown', (e) => {
            isDragging = true;
            previousMousePosition = { x: e.clientX, y: e.clientY };
        });

        this.renderer.domElement.addEventListener('mousemove', (e) => {
            if (isDragging && this.mesh) {
                const deltaX = e.clientX - previousMousePosition.x;
                const deltaY = e.clientY - previousMousePosition.y;
                
                this.mesh.rotation.y += deltaX * 0.01;
                this.mesh.rotation.x += deltaY * 0.01;
                
                previousMousePosition = { x: e.clientX, y: e.clientY };
            }
        });

        this.renderer.domElement.addEventListener('mouseup', () => {
            isDragging = false;
        });

        this.renderer.domElement.addEventListener('mouseleave', () => {
            isDragging = false;
        });

        // Zoom
        this.renderer.domElement.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY * 0.05;
            this.camera.position.multiplyScalar(1 + delta * 0.01);
        });
    }

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        if (!this.container) return;
        
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    loadSTLFromFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            this.parseSTL(e.target.result);
        };
        reader.readAsArrayBuffer(file);
    }

    loadSTLFromURL(url) {
        fetch(url)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => this.parseSTL(arrayBuffer))
            .catch(error => console.error('Error loading STL:', error));
    }

    parseSTL(arrayBuffer) {
        console.log('parseSTL called, buffer size:', arrayBuffer.byteLength, 'bytes');
        try {
            // Remove existing mesh
            if (this.mesh) {
                console.log('Removing existing mesh');
                if (this.edgesHelper) {
                    this.mesh.remove(this.edgesHelper);
                    this.edgesHelper.geometry.dispose();
                    this.edgesHelper.material.dispose();
                    this.edgesHelper = null;
                }
                this.scene.remove(this.mesh);
                this.mesh.geometry.dispose();
                this.mesh.material.dispose();
            }

            // Check if binary or ASCII STL
            const view = new DataView(arrayBuffer);
            const isBinary = this.isBinarySTL(arrayBuffer);
            console.log('STL type:', isBinary ? 'Binary' : 'ASCII');

            let geometry;
            if (isBinary) {
                geometry = this.parseBinarySTL(view);
            } else {
                geometry = this.parseASCIISTL(arrayBuffer);
            }
            
            console.log('Geometry parsed, vertices:', geometry.attributes.position.count);

            // Create mesh
            const material = new THREE.MeshPhongMaterial({
                color: 0x3b82f6,
                specular: 0x111111,
                shininess: 100,
                side: THREE.DoubleSide
            });

            this.mesh = new THREE.Mesh(geometry, material);
            this.scene.add(this.mesh);
            console.log('Mesh added to scene');

            // Center and scale
            this.centerAndScale();
            console.log('Mesh centered and scaled, position:', this.mesh.position, 'scale:', this.mesh.scale);

        } catch (error) {
            console.error('Error parsing STL:', error);
            console.error('Stack trace:', error.stack);
        }
    }

    isBinarySTL(arrayBuffer) {
        // Binary STL files are at least 84 bytes
        if (arrayBuffer.byteLength < 84) return false;
        
        // Check if starts with "solid" (ASCII)
        const view = new Uint8Array(arrayBuffer, 0, 5);
        const text = String.fromCharCode.apply(null, view);
        return text.toLowerCase() !== 'solid';
    }

    parseBinarySTL(dataView) {
        const numTriangles = dataView.getUint32(80, true);
        
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const normals = [];

        for (let i = 0; i < numTriangles; i++) {
            const offset = 84 + i * 50;
            
            // Normal
            const nx = dataView.getFloat32(offset, true);
            const ny = dataView.getFloat32(offset + 4, true);
            const nz = dataView.getFloat32(offset + 8, true);

            // Vertices
            for (let j = 0; j < 3; j++) {
                const vOffset = offset + 12 + j * 12;
                vertices.push(
                    dataView.getFloat32(vOffset, true),
                    dataView.getFloat32(vOffset + 4, true),
                    dataView.getFloat32(vOffset + 8, true)
                );
                normals.push(nx, ny, nz);
            }
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        
        return geometry;
    }

    parseASCIISTL(arrayBuffer) {
        const text = new TextDecoder().decode(arrayBuffer);
        const lines = text.split('\n');
        
        const vertices = [];
        const normals = [];
        let currentNormal = null;

        for (let line of lines) {
            line = line.trim();
            
            if (line.startsWith('facet normal')) {
                const parts = line.split(/\s+/);
                currentNormal = [
                    parseFloat(parts[2]),
                    parseFloat(parts[3]),
                    parseFloat(parts[4])
                ];
            } else if (line.startsWith('vertex')) {
                const parts = line.split(/\s+/);
                vertices.push(
                    parseFloat(parts[1]),
                    parseFloat(parts[2]),
                    parseFloat(parts[3])
                );
                if (currentNormal) {
                    normals.push(...currentNormal);
                }
            }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        
        return geometry;
    }

    centerAndScale() {
        if (!this.mesh) return;

        // Compute bounding box
        const box = new THREE.Box3().setFromObject(this.mesh);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // Center
        this.mesh.position.x = -center.x;
        this.mesh.position.y = -center.y;
        this.mesh.position.z = -center.z;

        // Scale to fit
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) {
            const scale = 40 / maxDim;
            this.mesh.scale.set(scale, scale, scale);
        }

        // Reset rotation
        this.mesh.rotation.set(0, 0, 0);
    }

    resetCamera() {
        this.camera.position.set(50, 50, 50);
        this.camera.lookAt(0, 0, 0);
        if (this.mesh) {
            this.mesh.rotation.set(0, 0, 0);
        }
    }

    toggleWireframe() {
        if (this.mesh) {
            this.wireframeMode = !this.wireframeMode;
            
            if (this.wireframeMode) {
                // In wireframe mode, show edges clearly
                this.mesh.material.wireframe = true;
                this.mesh.material.wireframeLinewidth = 2;
                
                // Add edge geometry for better visibility
                if (!this.edgesHelper) {
                    const edges = new THREE.EdgesGeometry(this.mesh.geometry);
                    const lineMaterial = new THREE.LineBasicMaterial({ 
                        color: 0xffffff,
                        linewidth: 2
                    });
                    this.edgesHelper = new THREE.LineSegments(edges, lineMaterial);
                    this.mesh.add(this.edgesHelper);
                }
                this.edgesHelper.visible = true;
            } else {
                // In solid mode, hide wireframe
                this.mesh.material.wireframe = false;
                if (this.edgesHelper) {
                    this.edgesHelper.visible = false;
                }
            }
        }
    }

    setMeshColor(color) {
        if (this.mesh) {
            this.mesh.material.color.setHex(color);
        }
    }

    dispose() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }
        if (this.renderer) {
            this.renderer.dispose();
            if (this.container && this.renderer.domElement) {
                this.container.removeChild(this.renderer.domElement);
            }
        }
    }
}

// Global viewer instances
let mainViewer = null;
let stlComparisonViewer = null;
let stepComparisonViewer = null;

function initViewers() {
    console.log('Initializing viewers...');
    // Initialize main viewer when analysis section is shown
    const viewerElement = document.getElementById('stl-viewer');
    if (viewerElement && !mainViewer) {
        const width = viewerElement.clientWidth;
        const height = viewerElement.clientHeight;
        console.log('Creating main viewer, container size:', width, 'x', height);
        
        if (width === 0 || height === 0) {
            console.error('Container has zero dimensions! Width:', width, 'Height:', height);
            console.log('Container computed style:', window.getComputedStyle(viewerElement));
            // Force minimum size
            viewerElement.style.minWidth = '100%';
            viewerElement.style.minHeight = '500px';
        }
        
        mainViewer = new CADViewer('stl-viewer');
        console.log('Main viewer created successfully');
        
        // Ensure proper sizing after a moment
        setTimeout(() => {
            if (mainViewer && mainViewer.onWindowResize) {
                mainViewer.onWindowResize();
                console.log('Viewer resized');
            }
        }, 100);
    } else if (!viewerElement) {
        console.error('stl-viewer element not found');
    } else {
        console.log('Main viewer already exists');
    }
}

function resetCamera() {
    if (mainViewer) {
        mainViewer.resetCamera();
    }
}

function toggleWireframeView() {
    if (mainViewer) {
        mainViewer.toggleWireframe();
    }
}

function loadSTLIntoViewer(jobId) {
    console.log('Loading STL for job:', jobId);
    if (mainViewer) {
        // Load STL file from server
        fetch(`/get-stl/${jobId}`)
            .then(response => {
                console.log('STL fetch response:', response.status);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.arrayBuffer();
            })
            .then(arrayBuffer => {
                console.log('STL loaded, size:', arrayBuffer.byteLength, 'bytes');
                mainViewer.parseSTL(arrayBuffer);
                console.log('STL parsed successfully');
            })
            .catch(error => {
                console.error('Error loading STL:', error);
                alert('Failed to load 3D model: ' + error.message);
                
                // Show a test cube to prove viewer works
                console.log('Adding test cube as fallback...');
                const geometry = new THREE.BoxGeometry(20, 20, 20);
                const material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
                mainViewer.mesh = new THREE.Mesh(geometry, material);
                mainViewer.scene.add(mainViewer.mesh);
                console.log('Red test cube added');
            });
    } else {
        console.error('mainViewer not initialized');
    }
}

function initComparisonViewers(jobId) {
    // Initialize comparison viewers
    if (document.getElementById('stl-comparison-viewer') && !stlComparisonViewer) {
        stlComparisonViewer = new CADViewer('stl-comparison-viewer');
        stlComparisonViewer.setMeshColor(0x3b82f6); // Blue for STL
        
        // Load STL
        fetch(`/get-stl/${jobId}`)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => {
                stlComparisonViewer.parseSTL(arrayBuffer);
                // Start in wireframe mode to show mesh structure
                setTimeout(() => {
                    stlComparisonViewer.toggleWireframe();
                }, 100);
            });
    }

    if (document.getElementById('step-comparison-viewer') && !stepComparisonViewer) {
        stepComparisonViewer = new CADViewer('step-comparison-viewer');
        stepComparisonViewer.setMeshColor(0x10b981); // Green for STEP
        
        // For STEP, we'll show the same geometry but in solid mode (representing surfaces)
        fetch(`/get-stl/${jobId}`)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => {
                stepComparisonViewer.parseSTL(arrayBuffer);
                stepComparisonViewer.setMeshColor(0x10b981);
                // Keep STEP in solid mode to show the difference
            });
    }
}

// Control functions for comparison viewers
function toggleSTLWireframe() {
    if (stlComparisonViewer) {
        stlComparisonViewer.toggleWireframe();
    }
}

function toggleSTEPWireframe() {
    if (stepComparisonViewer) {
        stepComparisonViewer.toggleWireframe();
    }
}

function resetSTLView() {
    if (stlComparisonViewer) {
        stlComparisonViewer.resetCamera();
    }
}

function resetSTEPView() {
    if (stepComparisonViewer) {
        stepComparisonViewer.resetCamera();
    }
}
