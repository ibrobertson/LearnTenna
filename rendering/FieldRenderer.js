class FieldRenderer {
    constructor(scene3D) {
        this.scene3D = scene3D;
        this.currentCurve = null;
        this.voltageCurve = null;
        this.eFields = [];
        this.hFields = [];
    }

    update(model) {
        this.clear();
        
        try {
            this.createCurrentVoltageCurves(model);
            this.createElectromagneticFields(model);
        } catch (error) {
            console.error('Error updating fields:', error);
        }
    }

    createCurrentVoltageCurves(model) {
        const wireLength = model.length;
        const numPoints = CONFIG.RENDERING.CURVE_POINTS;
        
        const positions = [];
        for (let i = 0; i < numPoints; i++) {
            const x = (i / (numPoints - 1)) * wireLength - wireLength/2;
            positions.push(x);
        }
        
        const distributions = model.getSpatialDistributions(positions);
        
        this.currentCurve = this.createCurve(
            positions.map(x => new THREE.Vector3(x, 0, 0)),
            distributions.current,
            0x00aaff
        );
        
        this.voltageCurve = this.createCurve(
            positions.map(x => new THREE.Vector3(x, 0, 0)),
            distributions.voltage,
            0xff6b35
        );
    }

    createCurve(points, amplitudes, color) {
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        geometry.setAttribute('amplitude', new THREE.Float32BufferAttribute(amplitudes, 1));
        const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.8 });
        const curve = new THREE.Line(geometry, material);
        curve.userData.amplitudes = amplitudes;
        this.scene3D.scene.add(curve);
        return curve;
    }

    createElectromagneticFields(model) {
        const wireLength = model.length;
        this.createEFields(wireLength);
        this.createHFields(wireLength);
    }

    createEFields(wireLength) {
        for (let i = 0; i < 4; i++) {
            const height = 1 + i * 0.8;
            
            const fieldAbove = this.createEFieldLine(wireLength, height);
            this.eFields.push(fieldAbove);
            
            const fieldBelow = this.createEFieldLine(wireLength, -height);
            this.eFields.push(fieldBelow);
        }
    }

    createEFieldLine(wireLength, height) {
        const points = [];
        const curvePattern = [];
        
        for (let t = 0; t <= 1; t += 0.1) {
            const x = (t - 0.5) * wireLength;
            const y = 0;
            points.push(new THREE.Vector3(x, y, 0));
            curvePattern.push(height * Math.sin(Math.PI * t));
        }
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ 
            color: 0xff3366, 
            transparent: true, 
            opacity: CONFIG.RENDERING.FIELD_OPACITY
        });
        const field = new THREE.Line(geometry, material);
        
        field.userData = {
            fieldType: 'eField',
            baseOpacity: CONFIG.RENDERING.FIELD_OPACITY,
            maxHeight: height,
            curvePattern: curvePattern
        };
        
        this.scene3D.scene.add(field);
        return field;
    }

    createHFields(wireLength) {
        for (let i = 0; i < 7; i++) {
            const x = (i / 6 - 0.5) * wireLength * 0.9;
            const baseRadius = 0.5 + i * 0.1;
            
            const geometry = new THREE.RingGeometry(baseRadius, baseRadius + 0.3, CONFIG.RENDERING.RING_SEGMENTS);
            const material = new THREE.MeshBasicMaterial({ 
                color: 0x00aaff, 
                transparent: true, 
                opacity: 0.4, 
                side: THREE.DoubleSide 
            });
            const field = new THREE.Mesh(geometry, material);
            
            field.position.set(x, 0, 0);
            field.rotation.y = Math.PI / 2;
            
            field.userData = {
                fieldType: 'hField',
                baseOpacity: 0.4,
                baseRadius: baseRadius,
                maxRadius: baseRadius + 1.0 + i * 0.2,
                positionFactor: Math.abs(i / 6 - 0.5) * 2
            };
            
            this.hFields.push(field);
            this.scene3D.scene.add(field);
        }
    }

    clear() {
        if (this.currentCurve && this.scene3D.scene) { 
            this.scene3D.scene.remove(this.currentCurve); 
            this.currentCurve = null; 
        }
        if (this.voltageCurve && this.scene3D.scene) { 
            this.scene3D.scene.remove(this.voltageCurve); 
            this.voltageCurve = null; 
        }
        
        this.eFields.forEach(field => this.scene3D.scene.remove(field));
        this.eFields = [];
        
        this.hFields.forEach(field => this.scene3D.scene.remove(field));
        this.hFields = [];
    }

    setVisibility(visibility) {
        if (this.currentCurve) this.currentCurve.visible = visibility.current;
        if (this.voltageCurve) this.voltageCurve.visible = visibility.voltage;
        this.eFields.forEach(field => field.visible = visibility.fields);
        this.hFields.forEach(field => field.visible = visibility.advancedFields);
    }

    getAllFields() {
        return [...this.eFields, ...this.hFields];
    }

    getCurves() {
        return {
            current: this.currentCurve,
            voltage: this.voltageCurve
        };
    }
}

class AnimationController {
    constructor(fieldRenderer, nodesRenderer) {
        this.fieldRenderer = fieldRenderer;
        this.nodesRenderer = nodesRenderer;
        this.advancedFieldsEnabled = true;
    }

    updateAnimation(time, isPlaying, model) {
        if (!isPlaying) return;
        
        const impedance = model ? model.calculateImpedance() : { resistance: 73, reactance: 0 };
        const phaseAngle = model ? model.physics.calculatePhaseRelationship(impedance).phaseAngle : 0;
        
        const curves = this.fieldRenderer.getCurves();
        if (curves.current && curves.current.userData.amplitudes) {
            this.updateCurve(curves.current, time, 0);
        }
        if (curves.voltage && curves.voltage.userData.amplitudes) {
            this.updateCurve(curves.voltage, time, phaseAngle);
        }
        
        if (this.nodesRenderer) {
            this.nodesRenderer.animateNodes(time);
        }
        
        if (this.advancedFieldsEnabled) {
            this.updateAdvancedFieldAnimation(time, phaseAngle, model);
        } else {
            this.updateSimpleFieldAnimation(time, phaseAngle, model);
        }
    }

    updateCurve(curve, time, phaseShift) {
        if (!curve || !curve.geometry || !curve.geometry.attributes.position) return;
        
        const positions = curve.geometry.attributes.position.array;
        const amplitudes = curve.userData.amplitudes;
        
        if (amplitudes) {
            for (let i = 0; i < amplitudes.length; i++) {
                const amplitude = amplitudes[i];
                const animatedY = Math.sin(time + phaseShift) * amplitude;
                if (i * 3 + 1 < positions.length) {
                    positions[i * 3 + 1] = animatedY;
                }
            }
            curve.geometry.attributes.position.needsUpdate = true;
        }
    }

    updateAdvancedFieldAnimation(time, phaseAngle, model) {
        const k = model ? model.waveNumber : 1;
        const allFields = this.fieldRenderer.getAllFields();
        
        allFields.forEach(field => {
            if (!field.material || field.material.opacity === undefined) return;
            
            const isEField = field.userData.fieldType === 'eField';
            
            if (isEField && field.userData.curvePattern) {
                this.animateEField(field, time, phaseAngle);
            } else if (!isEField && field.userData.maxRadius) {
                this.animateHField(field, time, k);
            }
        });
    }

    animateEField(field, time, phaseAngle) {
        const eFieldPhase = time + phaseAngle;
        const fieldStrength = Math.abs(Math.sin(eFieldPhase));
        const positions = field.geometry.attributes.position.array;
        const curvePattern = field.userData.curvePattern;
        
        for (let i = 0; i < curvePattern.length && i * 3 + 1 < positions.length; i++) {
            positions[i * 3 + 1] = curvePattern[i] * fieldStrength;
        }
        
        field.geometry.attributes.position.needsUpdate = true;
        field.material.opacity = Math.max(0.2, fieldStrength * field.userData.baseOpacity);
    }

    animateHField(field, time, k) {
        const position = field.position.x;
        const distanceFromCenter = Math.abs(position);
        
        const propagationDelay = k * distanceFromCenter;
        const totalPhase = time - propagationDelay;
        
        const positionFactor = field.userData.positionFactor || 0;
        const currentDistribution = Math.cos(positionFactor * Math.PI / 2);
        
        const fieldValue = Math.sin(totalPhase) * currentDistribution;
        const fieldStrength = Math.max(0.1, Math.abs(fieldValue));
        
        const baseRadius = field.userData.baseRadius;
        const maxRadius = field.userData.maxRadius;
        const currentOuterRadius = baseRadius + (maxRadius - baseRadius) * fieldStrength;
        
        if (field.geometry) {
            field.geometry.dispose();
        }
        field.geometry = new THREE.RingGeometry(baseRadius, currentOuterRadius, CONFIG.RENDERING.RING_SEGMENTS);
        
        field.material.opacity = Math.max(0.1, Math.min(0.7, fieldStrength * field.userData.baseOpacity));
    }

    updateSimpleFieldAnimation(time, phaseAngle, model) {
        const allFields = this.fieldRenderer.getAllFields();
        
        allFields.forEach(field => {
            if (!field.material || field.material.opacity === undefined) return;
            
            const isEField = field.userData.fieldType === 'eField';
            
            if (isEField) {
                const eFieldPhase = time + phaseAngle;
                field.material.opacity = field.userData.baseOpacity * (0.4 + Math.abs(Math.sin(eFieldPhase)) * 0.4);
            } else {
                const position = field.position.x;
                const distanceFromCenter = Math.abs(position);
                const propagationDelay = (model ? model.waveNumber : 1) * distanceFromCenter;
                const delayedTime = time - propagationDelay;
                
                let fieldStrength = 0.4 + Math.abs(Math.sin(delayedTime)) * 0.4;
                
                if (field.userData.positionFactor !== undefined) {
                    const currentDistribution = Math.cos(field.userData.positionFactor * Math.PI / 2);
                    fieldStrength *= currentDistribution;
                    
                    if (field.userData.baseRadius) {
                        const baseRadius = field.userData.baseRadius;
                        const maxRadius = field.userData.maxRadius;
                        const currentOuterRadius = baseRadius + (maxRadius - baseRadius) * fieldStrength;
                        
                        if (field.geometry) {
                            field.geometry.dispose();
                        }
                        field.geometry = new THREE.RingGeometry(baseRadius, currentOuterRadius, CONFIG.RENDERING.RING_SEGMENTS);
                    }
                }
                
                field.material.opacity = field.userData.baseOpacity * fieldStrength;
            }
        });
    }

    resetAnimation(model) {
        const impedance = model ? model.calculateImpedance() : { resistance: 73, reactance: 0 };
        const phaseAngle = model ? model.physics.calculatePhaseRelationship(impedance).phaseAngle : 0;
        
        const curves = this.fieldRenderer.getCurves();
        if (curves.current && curves.current.userData.amplitudes) {
            this.updateCurve(curves.current, 0, 0);
        }
        if (curves.voltage && curves.voltage.userData.amplitudes) {
            this.updateCurve(curves.voltage, 0, phaseAngle);
        }
        
        const allFields = this.fieldRenderer.getAllFields();
        allFields.forEach(field => {
            if (field.material && field.material.opacity !== undefined) {
                field.material.opacity = field.userData.baseOpacity * 0.2;
                
                if (field.userData.fieldType === 'hField' && field.userData.baseRadius) {
                    if (field.geometry) {
                        field.geometry.dispose();
                    }
                    const baseRadius = field.userData.baseRadius;
                    field.geometry = new THREE.RingGeometry(baseRadius, baseRadius + 0.05, CONFIG.RENDERING.RING_SEGMENTS);
                }
            }
        });
    }

    setAdvancedFieldsEnabled(enabled) {
        this.advancedFieldsEnabled = enabled;
    }
}

