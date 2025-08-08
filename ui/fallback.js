// ui/fallback.js
import { AntennaModel } from '../models/antennamodel.js';
import { DisplayManager } from './display.js';
import { UIController } from './controls.js';

export class FallbackMode {
    constructor(error) {
        this.model = new AntennaModel();
        this.display = new DisplayManager();
        this.ui = new UIController();
        
        this.init(error);
    }
    
    init(error) {
        console.error('3D visualization failed, initializing fallback mode:', error);
        
        // Display error message in canvas area
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
            const callbacks = {
                updateAntenna: () => console.log('3D disabled - antenna update skipped'),
                updateFields: () => console.log('3D disabled - fields update skipped'),
                updateDisplay: () => this.display.updateAll(this.model),
                updateVisibility: () => this.display.updateVisibility(this.ui.visibility),
                resetAnimation: () => console.log('3D disabled - animation reset skipped'),
                model: this.model
            };
            
            this.ui.setupControls(this.model, callbacks);
            this.display.updateAll(this.model);
            
            console.log('Fallback mode initialized - calculations working without 3D');
        } catch (fallbackError) {
            console.error('Even fallback mode failed:', fallbackError);
            this.showCriticalError(fallbackError);
        }
    }
    
    showCriticalError(error) {
        const container = document.querySelector('.container');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 50px; color: #ff6666;">
                    <h2>Critical Error</h2>
                    <p>The antenna visualization failed to initialize completely.</p>
                    <p>Please refresh the page and try again.</p>
                    <p>Error: ${error.message}</p>
                </div>
            `;
        }
    }
}
