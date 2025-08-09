'use strict';

// Import modular physics components
import { PHYSICS_CONSTANTS, PHYSICS_LIMITS, MATCHING_NETWORKS } from '../physics/constants.js';
import { PhysicsUtils } from '../physics/physicsutils.js';
import { ImpedanceCalculator } from '../physics/impedancecalculator.js';
import { MatchingNetworks } from '../physics/matchingnetworks.js';
import { AntennaModel } from '../models/antennamodel.js';
import { NodesCalculator } from '../physics/nodescalculator.js';
import { Scene3D } from '../rendering/Scene3D.js';
import { CameraController } from '../rendering/CameraController.js';
import { AntennaRenderer } from '../rendering/AntennaRenderer.js';
import { NodesRenderer } from '../rendering/NodesRenderer.js';
import { FieldRenderer } from '../rendering/FieldRenderer.js';
import { PerformanceMonitor } from '../rendering/PerformanceMonitor.js';
import { ThreeDRenderer } from '../rendering/ThreeDRenderer.js';

// =====================================================================
// CONFIGURATION & CONSTANTS
// =====================================================================

const CONFIG = {
    PHYSICS: PHYSICS_CONSTANTS,
    LIMITS: PHYSICS_LIMITS,
    MATCHING_NETWORKS: MATCHING_NETWORKS,
    RENDERING: {
        FIELD_OPACITY: 0.6,
        AXIS_OPACITY: 0.3,
        RING_SEGMENTS: 32,
        CURVE_POINTS: 50,
        AXIS_LENGTH: 15,
        LABEL_DISTANCE: 16
    },
    NODES: {
        NODE_SIZE: 0.25,
        ANTINODE_SIZE: 0.35,
        MIN_AMPLITUDE_THRESHOLD: 0.1,
        POSITION_TOLERANCE: 0.05
    }
};

// =====================================================================
// UTILITY FUNCTIONS
// =====================================================================

const Utils = {
    clamp: PhysicsUtils.clamp
};

// =====================================================================
// ENHANCED ANTENNA PHYSICS ENGINE (Using Modular Components)
// =====================================================================


// =====================================================================
// NODES/ANTINODES CALCULATOR (Enhanced with Resonance Guidance)
// =====================================================================


// =====================================================================
// 3D RENDERER CLASSES (imported above)
// =====================================================================

// UI CONTROLLER AND DISPLAY MANAGER
// =====================================================================

class UIController {
    constructor() {
        this.visibility = {
            antenna: true,
            current: true,
            voltage: true,
            fields: true,
            advancedFields: true,
            nodes: true,
            debug: false
        };
        this.time = 0;
        this.isPlaying = false;
    }
    
    setupControls(model, callbacks) {
        try {
            const controls = [
                { prop: 'length', slider: 'lengthSlider', input: 'lengthInput', callbacks: ['updateAntenna', 'updateFields', 'updateDisplay'] },
                { prop: 'frequency', slider: 'freqSlider', input: 'freqInput', callbacks: ['updateFields', 'updateDisplay'] },
                { prop: 'feedPosition', slider: 'feedSlider', input: 'feedInput', transform: v => v/100, callbacks: ['updateAntenna', 'updateFields', 'updateDisplay'] },
                { prop: 'wireDiameter', slider: 'wireSlider', input: 'wireInput', callbacks: ['updateDisplay'] }
            ];
            
            controls.forEach(config => {
                const slider = document.getElementById(config.slider);
                const input = document.getElementById(config.input);
                
                if (!slider || !input) {
                    console.warn(`Control elements not found: ${config.slider}, ${config.input}`);
                    return;
                }
                
                const updateValue = (value) => {
                    const transformedValue = config.transform ? config.transform(value) : value;
                    model[config.prop] = transformedValue;
                    config.callbacks.forEach(callback => {
                        if (callbacks[callback]) {
                            callbacks[callback]();
                        }
                    });
                };
                
                slider.addEventListener('input', (e) => {
                    const value = parseFloat(e.target.value);
                    input.value = value;
                    updateValue(value);
                });
                
                input.addEventListener('input', (e) => {
                    const value = parseFloat(e.target.value);
                    if (value >= parseFloat(input.min) && value <= parseFloat(input.max)) {
                        slider.value = value;
                        updateValue(value);
                    }
                });
            });
            
            const matchingNetworkIds = Object.keys(CONFIG.MATCHING_NETWORKS);
            const checkboxes = matchingNetworkIds.map(id => document.getElementById(id)).filter(Boolean);
            
            checkboxes.forEach((checkbox, index) => {
                const id = matchingNetworkIds[index];
                checkbox.addEventListener('change', (e) => {
                    if (e.target.checked) {
                        checkboxes.forEach((cb, i) => {
                            if (i !== index) cb.checked = false;
                        });
                        model.matchingNetwork = id;
                    } else {
                        model.matchingNetwork = null;
                    }
                    if (callbacks.updateDisplay) {
                        callbacks.updateDisplay();
                    }
                });
            });
            
            const playBtn = document.getElementById('playBtn');
            const pauseBtn = document.getElementById('pauseBtn');
            const resetBtn = document.getElementById('resetBtn');
            
            if (playBtn) {
                playBtn.addEventListener('click', () => {
                    this.isPlaying = true;
                    playBtn.disabled = true;
                    if (pauseBtn) pauseBtn.disabled = false;
                });
            }
            
            if (pauseBtn) {
                pauseBtn.addEventListener('click', () => {
                    this.isPlaying = false;
                    if (playBtn) playBtn.disabled = false;
                    pauseBtn.disabled = true;
                });
            }
            
            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    this.isPlaying = false;
                    this.time = 0;
                    if (playBtn) playBtn.disabled = false;
                    if (pauseBtn) pauseBtn.disabled = true;
                    const timeDisplay = document.getElementById('timeDisplay');
                    if (timeDisplay) timeDisplay.textContent = 'Time: 0°';
                    
                    const phaseDisplay = document.getElementById('phaseAngle');
                    if (phaseDisplay && callbacks.model) {
                        const impedance = callbacks.model.calculateImpedance();
                        const phaseAngle = PhysicsUtils.calculatePhaseAngle(impedance.resistance, impedance.reactance);
                        const phaseDegrees = Math.round(phaseAngle * 180 / Math.PI);
                        phaseDisplay.textContent = `${phaseDegrees}°`;
                    }
                    
                    if (callbacks.resetAnimation) {
                        callbacks.resetAnimation();
                    }
                });
            }
            
            const visibilityControls = [
                { id: 'showAntenna', prop: 'antenna' },
                { id: 'showCurrent', prop: 'current' },
                { id: 'showVoltage', prop: 'voltage' },
                { id: 'showFields', prop: 'fields' },
                { id: 'showAdvancedFields', prop: 'advancedFields' },
                { id: 'showNodes', prop: 'nodes' },
                { id: 'showDebug', prop: 'debug' }
            ];
            
            visibilityControls.forEach(({ id, prop }) => {
                const checkbox = document.getElementById(id);
                if (checkbox) {
                    checkbox.addEventListener('change', (e) => {
                        this.visibility[prop] = e.target.checked;
                        if (callbacks.updateVisibility) {
                            callbacks.updateVisibility();
                        }
                    });
                }
            });
        } catch (error) {
            console.error('Error setting up controls:', error);
        }
    }
    
    updateAnimation(model) {
        if (this.isPlaying) {
            this.time += 0.05;
            const degrees = Math.round((this.time * 180 / Math.PI) % 360);
            const timeDisplay = document.getElementById('timeDisplay');
            if (timeDisplay) {
                timeDisplay.textContent = `Time: ${degrees}°`;
            }
            
            const phaseDisplay = document.getElementById('phaseAngle');
            if (phaseDisplay && model) {
                const impedance = model.calculateImpedance();
                const phaseAngle = PhysicsUtils.calculatePhaseAngle(impedance.resistance, impedance.reactance);
                const phaseDegrees = Math.round(phaseAngle * 180 / Math.PI);
                phaseDisplay.textContent = `${phaseDegrees}°`;
            }
        }
        return { time: this.time, isPlaying: this.isPlaying };
    }
}

class DisplayManager {
    constructor() {
        this.elements = new Map();
        this._cacheElements();
        this.nodesCalculator = new NodesCalculator();
    }
    
    _cacheElements() {
        const ids = [
            'currentLength', 'currentFreq', 'currentWavelength', 
            'currentElectricalLength', 'currentWireDia', 'feedPositionDisplay',
            'antennaImpedanceDisplay', 'impedanceDisplay', 'matchingTypeDisplay',
            'swrDisplay', 'qualityDisplay', 'antennaType', 'debugContent',
            'harmonicNumber', 'currentNodesCount', 'currentAntinodesCount',
            'voltageNodesCount', 'voltageAntinodesCount', 'resonantStatus'
        ];
        
        ids.forEach(id => {
            const element = document.getElementById(id);
            if (element) this.elements.set(id, element);
        });
    }
    
    _updateElement(id, value) {
        const element = this.elements.get(id);
        if (element && element.textContent !== value) {
            element.textContent = value;
        }
    }
    
    updateAll(model) {
        try {
            this.updateBasicParameters(model);
            this.updateFeedPosition(model);
            this.updateImpedanceAnalysis(model);
            this.updateResonanceAnalysis(model);
            this.updateDebugInfo(model);
            this.updatePhaseDisplay(model);
        } catch (error) {
            console.error('Error updating display:', error);
        }
    }
    
    updateBasicParameters(model) {
        this._updateElement('currentLength', `${model.length.toFixed(1)}m`);
        this._updateElement('currentFreq', `${model.frequency.toFixed(2)} MHz`);
        this._updateElement('currentWavelength', `${model.wavelength.toFixed(1)}m`);
        this._updateElement('currentElectricalLength', `${model.electricalLength.toFixed(3)}λ`);
        this._updateElement('currentWireDia', `${model.wireDiameter.toFixed(1)}mm`);
    }
    
    updateFeedPosition(model) {
        const percentage = Math.round(model.feedPosition * 100);
        const descriptions = {
            0: 'Left End Fed (0%)',
            50: 'Center Fed (50%)',
            100: 'Right End Fed (100%)'
        };
        
        const description = descriptions[percentage] || `Off-Center Fed (${percentage}%)`;
        this._updateElement('feedPositionDisplay', description);
    }
    
    updateImpedanceAnalysis(model) {
        const antennaImpedance = model.calculateImpedance();
        const matchingResult = model.applyMatching(antennaImpedance);
        const systemImpedance = matchingResult.impedance;
        
        this._updateElement('antennaImpedanceDisplay', 
            PhysicsUtils.formatImpedance(antennaImpedance.resistance, antennaImpedance.reactance));
        this._updateElement('impedanceDisplay', 
            PhysicsUtils.formatImpedance(systemImpedance.resistance, systemImpedance.reactance));
        this._updateElement('matchingTypeDisplay', matchingResult.matchingType);
        
        const swr = PhysicsUtils.calculateSWR(systemImpedance.resistance, systemImpedance.reactance);
        const swrCapped = PhysicsUtils.clamp(swr, 1.0, 999);
        const swrDisplayValue = `${swrCapped.toFixed(1)}:1`;
        this._updateElement('swrDisplay', swrDisplayValue);
        
        const displayedSWR = parseFloat(swrDisplayValue.split(':')[0]);
        const quality = this._getMatchQuality(displayedSWR);
        const qualityElement = this.elements.get('qualityDisplay');
        if (qualityElement) {
            qualityElement.textContent = quality.text;
            qualityElement.style.color = quality.color;
        }
        
        this._updateElement('antennaType', model.getAntennaType());
    }

    updateResonanceAnalysis(model) {
        const detailedInfo = this.nodesCalculator.getDetailedResonanceInfo(model);
        
        this._updateElement('harmonicNumber', this.nodesCalculator.getHarmonicName(detailedInfo.harmonic));
        this._updateElement('currentNodesCount', detailedInfo.current.nodes.length.toString());
        this._updateElement('currentAntinodesCount', detailedInfo.current.antinodes.length.toString());
        this._updateElement('voltageNodesCount', detailedInfo.voltage.nodes.length.toString());
        this._updateElement('voltageAntinodesCount', detailedInfo.voltage.antinodes.length.toString());
        
        const resonantElement = this.elements.get('resonantStatus');
        if (resonantElement) {
            const guidance = detailedInfo.guidance;
            
            resonantElement.innerHTML = `
                <div style="font-weight: bold; color: ${guidance.color};">${guidance.status}</div>
                <div style="font-size: 11px; color: #ccc; margin-top: 3px;">${guidance.guidance}</div>
            `;
            
            if (guidance.status !== 'Resonant') {
                const closestInfo = detailedInfo.closestResonant;
                const additionalInfo = document.createElement('div');
                additionalInfo.style.fontSize = '10px';
                additionalInfo.style.color = '#aaa';
                additionalInfo.style.marginTop = '2px';
                additionalInfo.textContent = `Closest: ${closestInfo.name} (${closestInfo.difference > 0 ? '+' : ''}${closestInfo.difference.toFixed(1)}m)`;
                resonantElement.appendChild(additionalInfo);
            }
        }
    }

    updatePhaseDisplay(model) {
        const phaseAngleElement = document.getElementById('phaseAngle');
        if (phaseAngleElement) {
            const impedance = model.calculateImpedance();
            const phaseAngle = PhysicsUtils.calculatePhaseAngle(impedance.resistance, impedance.reactance);
            const phaseDegrees = Math.round(phaseAngle * 180 / Math.PI);
            phaseAngleElement.textContent = `${phaseDegrees}°`;
        }
    }
    
    _getMatchQuality(swr) {
        if (swr <= 1.2) return { text: "Excellent", color: '#00ff00' };
        if (swr <= 1.5) return { text: "Very Good", color: '#88ff00' };
        if (swr <= 2.0) return { text: "Good", color: '#ffaa00' };
        if (swr <= 2.5) return { text: "Acceptable", color: '#ffaa00' };
        if (swr <= 3.0) return { text: "Fair - Tuner Helpful", color: '#ff6600' };
        if (swr <= 5.0) return { text: "Poor - Tuner Needed", color: '#ff6600' };
        if (swr <= 10.0) return { text: "Bad - Matching Required", color: '#ff3366' };
        return { text: "Very Poor - Major Mismatch", color: '#ff3366' };
    }
    
    updateDebugInfo(model) {
        const debugContent = this.elements.get('debugContent');
        if (!debugContent) return;
        
        const impedance = model.calculateImpedance();
        const phaseAngle = PhysicsUtils.calculatePhaseAngle(impedance.resistance, impedance.reactance);
        const cacheStats = model.physics.getCacheStats();
        const detailedInfo = this.nodesCalculator.getDetailedResonanceInfo(model);
        
        const debugData = [
            ['Wavelength', `${model.wavelength.toFixed(2)}m`],
            ['Electrical Length', `${model.electricalLength.toFixed(4)}λ`],
            ['Wave Number (k)', `${model.waveNumber.toFixed(4)} rad`],
            ['Wire Radius', `${(model.wireDiameter/2).toFixed(2)}mm`],
            ['Length/Radius Ratio', `${model.lengthToRadiusRatio.toFixed(0)}`],
            ['Feed Position', `${(model.feedPosition * 100).toFixed(1)}%`],
            ['Antenna Type', model.getAntennaType()],
            ['Calculated R', `${impedance.resistance.toFixed(2)}Ω`],
            ['Calculated X', `${impedance.reactance >= 0 ? '+' : ''}${impedance.reactance.toFixed(2)}Ω`],
            ['Z Magnitude', `${PhysicsUtils.calculateImpedanceMagnitude(impedance.resistance, impedance.reactance).toFixed(1)}Ω`],
            ['I-V Phase Angle', `${(phaseAngle * 180 / Math.PI).toFixed(1)}°`],
            ['Resonance Status', detailedInfo.guidance.status],
            ['Tuning Guidance', detailedInfo.guidance.guidance],
            ['Closest Resonant', `${detailedInfo.closestResonant.name} (${detailedInfo.closestResonant.difference.toFixed(2)}m off)`],
            ['Harmonic Number', `${detailedInfo.harmonic}`],
            ['Physics Cache (Z)', `${cacheStats.impedanceCacheSize} entries`],
            ['Physics Cache (Dist)', `${cacheStats.distributionCacheSize} entries`]
        ];
        
        debugContent.innerHTML = debugData
            .map(([label, value]) => `<div>${label}: <span class="debug-value">${value}</span></div>`)
            .join('');
    }
    
    updateVisibility(visibility) {
        const debugPanel = document.getElementById('debugPanel');
        if (debugPanel) {
            debugPanel.style.display = visibility.debug ? 'block' : 'none';
        }
    }
}

class AntennaVisualizationApp {
    constructor() {
        this.model = new AntennaModel();
        this.renderer = new ThreeDRenderer('canvas-container');
        this.ui = new UIController();
        this.display = new DisplayManager();
        this.animationId = null;
        
        this.init();
    }
    
    init() {
        try {
            const callbacks = {
                updateAntenna: () => this.renderer.updateAntenna(this.model),
                updateFields: () => this.renderer.updateFields(this.model),
                updateDisplay: () => this.display.updateAll(this.model),
                updateVisibility: () => {
                    this.renderer.updateVisibility(this.ui.visibility);
                    this.display.updateVisibility(this.ui.visibility);
                },
                resetAnimation: () => this.renderer.resetAnimation(),
                model: this.model
            };
            
            this.ui.setupControls(this.model, callbacks);
            this.renderer.updateAntenna(this.model);
            this.renderer.updateFields(this.model);
            this.display.updateAll(this.model);
            
            this.renderer.updateVisibility(this.ui.visibility);
            
            this.animate();
            
            window.addEventListener('resize', () => this.renderer.handleResize());
            
            console.log('Enhanced antenna visualization with modular physics initialized');
            console.log('Physics engine stats:', this.model.physics.getCacheStats());
        } catch (error) {
            console.error('Initialization failed:', error);
            const container = document.querySelector('.container');
            if (container) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 50px; color: #ff6666;">
                        <h2>Initialization Error</h2>
                        <p>The antenna visualization failed to initialize.</p>
                        <p>Please refresh the page and try again.</p>
                        <p>Error: ${error.message}</p>
                    </div>
                `;
            }
        }
    }
    
    animate() {
        try {
            const animationState = this.ui.updateAnimation(this.model);
            this.renderer.updateAnimation(animationState.time, animationState.isPlaying);
            this.renderer.render();
            this.animationId = requestAnimationFrame(() => this.animate());
        } catch (error) {
            console.error('Animation error:', error);
            this.animationId = requestAnimationFrame(() => this.animate());
        }
    }
    
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        if (this.renderer) {
            this.renderer.dispose();
        }
    }
}

// =====================================================================
// APPLICATION STARTUP
// =====================================================================

document.addEventListener('DOMContentLoaded', () => {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!gl) {
            throw new Error('WebGL is not supported in this browser');
        }
        
        if (typeof THREE === 'undefined') {
            throw new Error('Three.js library failed to load');
        }
        
        new AntennaVisualizationApp();
    } catch (error) {
        console.error('Application startup failed:', error);
        
        const container = document.querySelector('.container');
        if (container) {
            const canvasContainer = document.getElementById('canvas-container');
            if (canvasContainer) {
                canvasContainer.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #ff6666; text-align: center; flex-direction: column;">
                        <h3>3D Visualization Unavailable</h3>
                        <p>Error: ${error.message}</p>
                        <p>The controls and calculations still work below.</p>
                    </div>
                `;
            }
            
            try {
                const model = new AntennaModel();
                const display = new DisplayManager();
                const ui = new UIController();
                
                const callbacks = {
                    updateAntenna: () => console.log('3D disabled - antenna update skipped'),
                    updateFields: () => console.log('3D disabled - fields update skipped'),
                    updateDisplay: () => display.updateAll(model),
                    updateVisibility: () => display.updateVisibility(ui.visibility),
                    resetAnimation: () => console.log('3D disabled - animation reset skipped'),
                    model: model
                };
                
                ui.setupControls(model, callbacks);
                display.updateAll(model);
                
                console.log('Fallback mode initialized - calculations working without 3D');
            } catch (fallbackError) {
                console.error('Even fallback mode failed:', fallbackError);
            }
        }
    }
});