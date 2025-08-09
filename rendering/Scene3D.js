import { RENDERING_CONFIG } from '../config/rendering.js';

export class Scene3D {
    constructor(container) {
        this.container = container;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.axes = [];
        
        this.init();
    }

    init() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        
        this.camera = new THREE.PerspectiveCamera(
            75, 
            this.container.clientWidth / this.container.clientHeight, 
            0.1, 
            1000
        );
        this.camera.position.set(15, 10, 15);
        this.camera.lookAt(0, 0, 0);
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.container.appendChild(this.renderer.domElement);
        
        this.setupLighting();
        this.addCoordinateAxes();
    }

    setupLighting() {
        this.scene.add(new THREE.AmbientLight(0x404040, 0.6));
        const light = new THREE.DirectionalLight(0xffffff, 0.8);
        light.position.set(10, 10, 5);
        this.scene.add(light);
    }

    addCoordinateAxes() {
        const axisLength = RENDERING_CONFIG.AXIS_LENGTH;
        const axisOpacity = RENDERING_CONFIG.AXIS_OPACITY;
        
        const axes = [
            { color: 0xff0000, direction: [axisLength, 0, 0] },
            { color: 0x00ff00, direction: [0, axisLength, 0] },
            { color: 0x0000ff, direction: [0, 0, axisLength] }
        ];

        axes.forEach(axis => {
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(...axis.direction)
            ]);
            const material = new THREE.LineBasicMaterial({ 
                color: axis.color, 
                transparent: true, 
                opacity: axisOpacity 
            });
            const line = new THREE.Line(geometry, material);
            this.scene.add(line);
            this.axes.push(line);
        });

        this.addAxisLabels();
    }

    addAxisLabels() {
        const labelDistance = RENDERING_CONFIG.LABEL_DISTANCE;
        const labelOpacity = 0.4;
        const labelGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        
        const labels = [
            { color: 0xff0000, position: [labelDistance, 0, 0] },
            { color: 0x00ff00, position: [0, labelDistance, 0] },
            { color: 0x0000ff, position: [0, 0, labelDistance] }
        ];

        labels.forEach(label => {
            const material = new THREE.MeshBasicMaterial({ 
                color: label.color, 
                transparent: true, 
                opacity: labelOpacity 
            });
            const mesh = new THREE.Mesh(labelGeometry, material);
            mesh.position.set(...label.position);
            this.scene.add(mesh);
            this.axes.push(mesh);
        });
    }

    handleResize() {
        if (!this.camera || !this.renderer || !this.container) return;
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }

    render() {
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    dispose() {
        if (this.renderer) {
            this.renderer.dispose();
        }
    }
}

