export const PhysicsUtils = {
    clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
    log10: Math.log10 || ((x) => Math.log(x) / Math.LN10),
    
    formatImpedance: (resistance, reactance) => {
        const R = Math.round(resistance);
        const X = Math.round(reactance);
        return Math.abs(X) < 1 ? `${R} Ω` : `${R} ${X >= 0 ? '+' : ''}j${X} Ω`;
    },
    
    calculateSWR: (resistance, reactance, z0 = 50) => {
        const numeratorReal = resistance - z0;
        const numeratorImag = reactance;
        const denominatorReal = resistance + z0;
        const denominatorImag = reactance;
        
        const numeratorMag = Math.sqrt(numeratorReal * numeratorReal + numeratorImag * numeratorImag);
        const denominatorMag = Math.sqrt(denominatorReal * denominatorReal + denominatorImag * denominatorImag);
        
        const reflectionCoeff = numeratorMag / denominatorMag;
        return reflectionCoeff >= 0.999 ? 999 : (1 + reflectionCoeff) / (1 - reflectionCoeff);
    },
    
    calculatePhaseAngle: (resistance, reactance) => {
        return Math.atan2(reactance, resistance);
    },

    calculateImpedanceMagnitude: (resistance, reactance) => {
        return Math.sqrt(resistance * resistance + reactance * reactance);
    }
};