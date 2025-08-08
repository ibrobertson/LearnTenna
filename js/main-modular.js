// main.js - Modular version (80 lines vs 1733 lines original!)
import { AntennaModel } from './models/antennamodel.js';
import { UIController } from './ui/controls.js';
import { DisplayManager } from './ui/display.js';

// Import 3D components from the original main.js (we'll extract these later)
// For now, we'll use the existing ThreeDRenderer class from the original file

class ModularAntennaApp {
    constructor() {
        this.model = new AntennaModel();
        this.ui = new UIController();
        this.display = new DisplayManager();
        this.renderer = null;
        this.animationId = null;
        
        this.init();
    }
    
    init() {
        console.log('Initializing modular LearnTenna application...');
        
        try {
            // Try to initialize 3D renderer (using existing code for now)
            this.renderer = new ThreeDRenderer('canvas-container');
            
            this.setupCallbacks();
            this.initializeComponents();
            this.startAnimation();
            this.setupEventListeners();
            
            console.log('MODULAR LearnTenna initialized successfully!');
            console.log('Physics cache stats:', this.model.physics.getCacheStats());
        } catch (error) {
            console.error('3D initialization failed, loading fallback mode:', error);
            this.loadFallbackMode(error);
        }
    }
    
    setupCallbacks() {
        this.callbacks = {
            updateAntenna: () => this.renderer?.updateAntenna(this.model),
            updateFields: () => this.renderer?.updateFields(this.model),
            updateDisplay: () => this.display.updateAll(this.model),
            updateVisibility: () => {
                this.renderer?.updateVisibility(this.ui.visibility);
                this.display.updateVisibility(this.ui.visibility);
            },
            resetAnimation: () => this.renderer?.resetAnimation(),
            model: this.model
        };
    }
    
    initializeComponents() {
        this.ui.setupControls(this.model, this.callbacks);
        this.renderer?.updateAntenna(this.model);
        this.renderer?.updateFields(this.model);
        this.display.updateAll(this.model);
        this.renderer?.updateVisibility(this.ui.visibility);
    }
    
    startAnimation() {
        this.animate();
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => this.renderer?.handleResize());
    }
    
    animate() {
        try {
            const animationState = this.ui.updateAnimation(this.model);
            this.renderer?.updateAnimation(animationState.time, animationState.isPlaying);
            this.renderer?.render();
            this.animationId = requestAnimationFrame(() => this.animate());
        } catch (error) {
            console.error('Animation error:', error);
            this.animationId = requestAnimationFrame(() => this.animate());
        }
    }
    
    async loadFallbackMode(error) {
        try {
            const { FallbackMode } = await import('./ui/fallback.js');
            new FallbackMode(error);
        } catch (fallbackError) {
            console.error('Fallback mode also failed:', fallbackError);
        }
    }
    
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.renderer?.dispose();
    }
}

// Application startup
document.addEventListener('DOMContentLoaded', () => {
    new ModularAntennaApp();
});
