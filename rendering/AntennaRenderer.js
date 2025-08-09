export class AntennaRenderer {
    constructor(scene3D) {
        this.scene3D = scene3D;
        this.antenna = null;
        this.feedPoint = null;
    }

    update(model) {
        this.clear();
        
        try {
            const wireLength = model.length;
            
            const geometry = new THREE.CylinderGeometry(0.05, 0.05, wireLength, 16);
            const material = new THREE.MeshLambertMaterial({ color: 0xffff00 });
            this.antenna = new THREE.Mesh(geometry, material);
            this.antenna.rotation.z = Math.PI / 2;
            this.scene3D.scene.add(this.antenna);
            
            const feedX = (model.feedPosition - 0.5) * wireLength;
            const feedGeometry = new THREE.SphereGeometry(0.3, 16, 16);
            const feedMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
            this.feedPoint = new THREE.Mesh(feedGeometry, feedMaterial);
            this.feedPoint.position.set(feedX, 0, 0);
            this.scene3D.scene.add(this.feedPoint);
        } catch (error) {
            console.error('Error updating antenna:', error);
        }
    }

    clear() {
        if (this.antenna && this.scene3D.scene) { 
            this.scene3D.scene.remove(this.antenna); 
            this.antenna = null; 
        }
        if (this.feedPoint && this.scene3D.scene) { 
            this.scene3D.scene.remove(this.feedPoint); 
            this.feedPoint = null; 
        }
    }

    setVisibility(visible) {
        if (this.antenna) this.antenna.visible = visible;
        if (this.feedPoint) this.feedPoint.visible = visible;
    }
}

