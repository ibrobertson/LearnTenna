class CameraController {
    constructor(scene3D) {
        this.scene3D = scene3D;
        this.spherical = { radius: 25, theta: 0, phi: Math.PI / 3 };
        this.isDragging = false;
        this.lastMouse = { x: 0, y: 0 };
        
        this.setupControls();
    }

    setupControls() {
        if (!this.scene3D.renderer || !this.scene3D.renderer.domElement) return;
        
        this.scene3D.renderer.domElement.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.scene3D.renderer.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.scene3D.renderer.domElement.addEventListener('mouseup', () => this.onMouseUp());
        this.scene3D.renderer.domElement.addEventListener('wheel', (e) => this.onWheel(e));
    }

    onMouseDown(e) {
        this.isDragging = true;
        this.lastMouse = { x: e.clientX, y: e.clientY };
    }

    onMouseMove(e) {
        if (!this.isDragging) return;
        const delta = { x: e.clientX - this.lastMouse.x, y: e.clientY - this.lastMouse.y };
        this.spherical.theta += delta.x * 0.01;
        this.spherical.phi = Utils.clamp(this.spherical.phi + delta.y * 0.01, 0.1, Math.PI - 0.1);
        this.updateCamera();
        this.lastMouse = { x: e.clientX, y: e.clientY };
    }

    onMouseUp() {
        this.isDragging = false;
    }

    onWheel(e) {
        e.preventDefault();
        this.spherical.radius = Utils.clamp(this.spherical.radius * (1 + e.deltaY * 0.001), 5, 50);
        this.updateCamera();
    }

    updateCamera() {
        if (!this.scene3D.camera) return;
        this.scene3D.camera.position.x = this.spherical.radius * Math.sin(this.spherical.phi) * Math.sin(this.spherical.theta);
        this.scene3D.camera.position.y = this.spherical.radius * Math.cos(this.spherical.phi);
        this.scene3D.camera.position.z = this.spherical.radius * Math.sin(this.spherical.phi) * Math.cos(this.spherical.theta);
        this.scene3D.camera.lookAt(0, 0, 0);
    }
}

