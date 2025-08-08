// ui/display.js
import { NodesCalculator } from '../physics/nodescalculator.js';
import { PhysicsUtils } from '../physics/physicsutils.js';
import { Utils } from '../utils/helpers.js';

export class DisplayManager {
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
        this._updateElement('currentLength', `${Utils.formatNumber(model.length, 1)}m`);
        this._updateElement('currentFreq', `${Utils.formatNumber(model.frequency, 2)} MHz`);
        this._updateElement('currentWavelength', `${Utils.formatNumber(model.wavelength, 1)}m`);
        this._updateElement('currentElectricalLength', `${Utils.formatNumber(model.electricalLength, 3)}Î»`);
        this._updateElement('currentWireDia', `${Utils.formatNumber(model.wireDiameter, 1)}mm`);
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
        const swrDisplayValue = `${Utils.formatNumber(swrCapped, 1)}:1`;
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
                additionalInfo.textContent = `Closest: ${closestInfo.name} (${closestInfo.difference > 0 ? '+' : ''}${Utils.formatNumber(closestInfo.difference, 1)}m)`;
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
            phaseAngleElement.textContent = `${phaseDegrees}Â°`;
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
            ['Wavelength', `${Utils.formatNumber(model.wavelength, 2)}m`],
            ['Electrical Length', `${Utils.formatNumber(model.electricalLength, 4)}Î»`],
            ['Wave Number (k)', `${Utils.formatNumber(model.waveNumber, 4)} rad`],
            ['Wire Radius', `${Utils.formatNumber(model.wireDiameter/2, 2)}mm`],
            ['Length/Radius Ratio', `${Utils.formatNumber(model.lengthToRadiusRatio, 0)}`],
            ['Feed Position', `${Utils.formatNumber(model.feedPosition * 100, 1)}%`],
            ['Antenna Type', model.getAntennaType()],
            ['Calculated R', `${Utils.formatNumber(impedance.resistance, 2)}Î©`],
            ['Calculated X', `${impedance.reactance >= 0 ? '+' : ''}${Utils.formatNumber(impedance.reactance, 2)}Î©`],
            ['Z Magnitude', `${Utils.formatNumber(PhysicsUtils.calculateImpedanceMagnitude(impedance.resistance, impedance.reactance), 1)}Î©`],
            ['I-V Phase Angle', `${Utils.formatNumber(phaseAngle * 180 / Math.PI, 1)}Â°`],
            ['Resonance Status', detailedInfo.guidance.status],
            ['Tuning Guidance', detailedInfo.guidance.guidance],
            ['Closest Resonant', `${detailedInfo.closestResonant.name} (${Utils.formatNumber(detailedInfo.closestResonant.difference, 2)}m off)`],
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
