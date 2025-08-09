import { NodesCalculator } from '../physics/nodescalculator.js';
import { NODES_CONFIG } from '../config/rendering.js';

export class NodesRenderer {
    constructor(scene3D) {
        this.scene3D = scene3D;
        this.nodeMarkers = [];
        this.calculator = new NodesCalculator();
    }

    update(model) {
        this.clear();
        
        try {
            const nodesData = this.calculator.calculateNodesAndAntinodes(model);
            this.createNodeMarkers(nodesData);
        } catch (error) {
            console.error('Error updating nodes:', error);
        }
    }

    createNodeMarkers(nodesData) {
        nodesData.current.nodes.forEach((position, index) => {
            this.createMarker(position, CONFIG.NODES.NODE_SIZE, 0xff0000, 'current-node');
        });

        nodesData.current.antinodes.forEach((position, index) => {
            this.createMarker(position, CONFIG.NODES.ANTINODE_SIZE, 0xff6600, 'current-antinode');
        });

        nodesData.voltage.nodes.forEach((position, index) => {
            this.createMarker(position, CONFIG.NODES.NODE_SIZE, 0x0066ff, 'voltage-node');
        });

        nodesData.voltage.antinodes.forEach((position, index) => {
            this.createMarker(position, CONFIG.NODES.ANTINODE_SIZE, 0x00aaff, 'voltage-antinode');
        });
    }

    createMarker(position, size, color, type) {
        const geometry = new THREE.SphereGeometry(size, 16, 16);
        const material = new THREE.MeshLambertMaterial({ 
            color: color,
            transparent: true,
            opacity: 0.9
        });
        
        const marker = new THREE.Mesh(geometry, material);
        marker.position.set(position, 0, 0);
        
        if (type.includes('antinode')) {
            const glowGeometry = new THREE.SphereGeometry(size * 1.4, 12, 12);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.3
            });
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            glow.position.set(position, 0, 0);
            this.scene3D.scene.add(glow);
            this.nodeMarkers.push(glow);
        }
        
        marker.userData = { type: type, position: position };
        this.scene3D.scene.add(marker);
        this.nodeMarkers.push(marker);
    }

    animateNodes(time) {
        this.nodeMarkers.forEach(marker => {
            if (marker.userData && marker.userData.type) {
                const isAntinode = marker.userData.type.includes('antinode');
                
                if (isAntinode) {
                    const pulse = 0.8 + 0.2 * Math.sin(time * 2);
                    marker.material.opacity = pulse;
                    marker.scale.setScalar(0.9 + 0.1 * Math.sin(time * 3));
                } else {
                    marker.material.opacity = 0.6 + 0.2 * Math.sin(time * 0.5);
                }
            }
        });
    }

    clear() {
        this.nodeMarkers.forEach(marker => {
            if (this.scene3D.scene) {
                this.scene3D.scene.remove(marker);
            }
        });
        this.nodeMarkers = [];
    }

    setVisibility(visible) {
        this.nodeMarkers.forEach((marker, index) => {
            marker.visible = visible;
        });
    }

    getNodesInfo(model) {
        return this.calculator.calculateNodesAndAntinodes(model);
    }
}

