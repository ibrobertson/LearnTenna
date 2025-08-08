// ui/controls.js
import { MATCHING_NETWORKS } from '../physics/constants.js';
import { PhysicsUtils } from '../physics/physicsutils.js';
import { UI_CONFIG } from '../config/constants.js';

export class UIController {
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
            this.setupParameterControls(model, callbacks);
            this.setupMatchingNetworkControls(model, callbacks);
            this.setupAnimationControls(callbacks);
            this.setupVisibilityControls(callbacks);
        } catch (error) {
            console.error('Error setting up controls:', error);
        }
    }

    setupParameterControls(model, callbacks) {
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
    }

    setupMatchingNetworkControls(model, callbacks) {
        const matchingNetworkIds = Object.keys(MATCHING_NETWORKS);
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
    }

    setupAnimationControls(callbacks) {
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
                if (timeDisplay) timeDisplay.textContent = 'Time: 0Â°';
                
                const phaseDisplay = document.getElementById('phaseAngle');
                if (phaseDisplay && callbacks.model) {
                    const impedance = callbacks.model.calculateImpedance();
                    const phaseAngle = PhysicsUtils.calculatePhaseAngle(impedance.resistance, impedance.reactance);
                    const phaseDegrees = Math.round(phaseAngle * 180 / Math.PI);
                    phaseDisplay.textContent = `${phaseDegrees}Â°`;
                }
                
                if (callbacks.resetAnimation) {
                    callbacks.resetAnimation();
                }
            });
        }
    }

    setupVisibilityControls(callbacks) {
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
    }
    
    updateAnimation(model) {
        if (this.isPlaying) {
            this.time += UI_CONFIG.ANIMATION_STEP;
            const degrees = Math.round((this.time * 180 / Math.PI) % 360);
            const timeDisplay = document.getElementById('timeDisplay');
            if (timeDisplay) {
                timeDisplay.textContent = `Time: ${degrees}Â°`;
            }
            
            const phaseDisplay = document.getElementById('phaseAngle');
            if (phaseDisplay && model) {
                const impedance = model.calculateImpedance();
                const phaseAngle = PhysicsUtils.calculatePhaseAngle(impedance.resistance, impedance.reactance);
                const phaseDegrees = Math.round(phaseAngle * 180 / Math.PI);
                phaseDisplay.textContent = `${phaseDegrees}Â°`;
            }
        }
        return { time: this.time, isPlaying: this.isPlaying };
    }
}
