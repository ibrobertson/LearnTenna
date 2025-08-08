# LearnTenna Modularization Script
# Creates complete modular folder structure and files

Write-Host "Starting LearnTenna Modularization..." -ForegroundColor Green

# Create directory structure
$directories = @(
    "config",
    "models", 
    "physics",
    "rendering",
    "ui",
    "utils"
)

foreach ($dir in $directories) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force
        Write-Host "Created directory: $dir" -ForegroundColor Yellow
    }
}

# Helper function to create files
function Create-File {
    param(
        [string]$Path,
        [string]$Content
    )
    
    Set-Content -Path $Path -Value $Content -Encoding UTF8
    Write-Host "Created file: $Path" -ForegroundColor Cyan
}

# ===================================================================
# CONFIG FILES
# ===================================================================

$renderingConfig = @"
// config/rendering.js
export const RENDERING_CONFIG = {
    FIELD_OPACITY: 0.6,
    AXIS_OPACITY: 0.3,
    RING_SEGMENTS: 32,
    CURVE_POINTS: 50,
    AXIS_LENGTH: 15,
    LABEL_DISTANCE: 16
};

export const NODES_CONFIG = {
    NODE_SIZE: 0.25,
    ANTINODE_SIZE: 0.35,
    MIN_AMPLITUDE_THRESHOLD: 0.1,
    POSITION_TOLERANCE: 0.05
};
"@

$configConstants = @"
// config/constants.js
export const UI_CONFIG = {
    ANIMATION_STEP: 0.05,
    FPS_HISTORY_LENGTH: 60,
    DEBUG_UPDATE_INTERVAL: 100
};

export const CACHE_CONFIG = {
    MAX_IMPEDANCE_CACHE: 1000,
    MAX_DISTRIBUTION_CACHE: 500,
    CACHE_CLEANUP_INTERVAL: 30000
};
"@

Create-File "config/rendering.js" $renderingConfig
Create-File "config/constants.js" $configConstants

# ===================================================================
# UTILS FILES  
# ===================================================================

$helpers = @"
// utils/helpers.js
export const Utils = {
    clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
    
    formatNumber: (value, decimals = 2) => {
        return parseFloat(value).toFixed(decimals);
    },
    
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    generateId: () => {
        return Math.random().toString(36).substr(2, 9);
    }
};
"@

Create-File "utils/helpers.js" $helpers

# ===================================================================
# PHYSICS FILES
# ===================================================================

$physicsConstants = @"
export const PHYSICS_CONSTANTS = {
    SPEED_OF_LIGHT: 300,
    FREE_SPACE_IMPEDANCE: 377,
    STANDARD_IMPEDANCE: 50,
    DIPOLE_BASE_RESISTANCE: 73.1,
};

export const PHYSICS_LIMITS = {
    MIN_RESISTANCE: 0.1,
    MAX_RESISTANCE: 50000,
    MIN_REACTANCE: -5000,
    MAX_REACTANCE: 5000,
    MIN_SWR: 1.0,
    MAX_SWR: 999
};

export const MATCHING_NETWORKS = {
    'use1to1Balun': { ratio: 1, name: '1:1 Balun', type: 'balun' },
    'use4to1Balun': { ratio: 4, name: '4:1 Balun', type: 'balun' },
    'use9to1UnUn': { ratio: 9, name: '9:1 UnUn', type: 'unun' },
    'use49to1UnUn': { ratio: 49, name: '49:1 UnUn', type: 'unun' }
};
"@

$physicsUtils = @"
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
"@

$impedanceCalculator = @"
import { PHYSICS_CONSTANTS, PHYSICS_LIMITS } from './constants.js';
import { PhysicsUtils } from './physicsutils.js';

export class ImpedanceCalculator {
    constructor() {
        this._cache = new Map();
    }

    calculateImpedance(params) {
        const { length, frequency, feedPosition, wireDiameter } = params;
        const key = `${length}_${frequency}_${feedPosition}_${wireDiameter}`;
        
        if (this._cache.has(key)) {
            return this._cache.get(key);
        }

        const wavelength = PHYSICS_CONSTANTS.SPEED_OF_LIGHT / frequency;
        const electricalLength = length / wavelength;
        const waveNumber = 2 * Math.PI / wavelength;
        const wireRadius = wireDiameter / 2000;
        const lengthToRadiusRatio = length / wireRadius;
        
        let impedance;
        if (feedPosition === 0.5) {
            impedance = this._calculateCenterFed(length, electricalLength, waveNumber, lengthToRadiusRatio);
        } else if (feedPosition === 0 || feedPosition === 1) {
            impedance = this._calculateEndFed(length, electricalLength, waveNumber, lengthToRadiusRatio);
        } else {
            impedance = this._calculateOffCenter(length, electricalLength, waveNumber, lengthToRadiusRatio, feedPosition);
        }
        
        const limitedImpedance = {
            resistance: PhysicsUtils.clamp(impedance.resistance, PHYSICS_LIMITS.MIN_RESISTANCE, PHYSICS_LIMITS.MAX_RESISTANCE),
            reactance: PhysicsUtils.clamp(impedance.reactance, PHYSICS_LIMITS.MIN_REACTANCE, PHYSICS_LIMITS.MAX_REACTANCE)
        };
        
        this._cache.set(key, limitedImpedance);
        return limitedImpedance;
    }

    _calculateCenterFed(length, eLen, k, lToR) {
        if (eLen < 0.1) {
            const resistance = Math.max(20 * Math.PI * Math.PI * eLen * eLen, 0.1);
            const reactance = -119.9 * (PhysicsUtils.log10(lToR) - 2.25) / (eLen * 2 * Math.PI);
            return { resistance, reactance };
        }
        
        if (Math.abs(eLen - 0.5) < 0.05) {
            const wireReactance = 42.5 * (PhysicsUtils.log10(lToR) - 2.25);
            return {
                resistance: PHYSICS_CONSTANTS.DIPOLE_BASE_RESISTANCE,
                reactance: wireReactance * 0.02
            };
        }
        
        const beta = k * length / 2;
        const sinBeta = Math.sin(beta);
        const cosBeta = Math.cos(beta);
        
        if (Math.abs(sinBeta) < 0.001) {
            return { resistance: 2000, reactance: 0 };
        }
        
        const resistance = PHYSICS_CONSTANTS.DIPOLE_BASE_RESISTANCE * sinBeta * sinBeta;
        const reactance = 43.1 * (cosBeta - Math.cos(k * length)) / sinBeta + 
                        42.5 * (PhysicsUtils.log10(lToR) - 2.25) * 0.1;
        
        return { resistance, reactance };
    }

    _calculateEndFed(length, eLen, k, lToR) {
        if (Math.abs(eLen - 0.25) < 0.02) {
            return {
                resistance: PHYSICS_CONSTANTS.DIPOLE_BASE_RESISTANCE / 2,
                reactance: 21.25 * (PhysicsUtils.log10(lToR) - 2.25)
            };
        }
        
        if (Math.abs(eLen - 0.5) < 0.02) {
            return { resistance: 2500, reactance: 0 };
        }
        
        const beta = k * length;
        const cosBeta = Math.cos(beta);
        const sinBeta = Math.sin(beta);
        
        if (Math.abs(sinBeta) < 0.001) {
            return { resistance: 5000, reactance: 0 };
        }
        
        const resistance = Math.min(PHYSICS_CONSTANTS.DIPOLE_BASE_RESISTANCE / (cosBeta * cosBeta), 15000);
        const reactance = PhysicsUtils.clamp(
            PHYSICS_CONSTANTS.FREE_SPACE_IMPEDANCE * Math.tan(beta / 2), 
            -5000, 
            5000
        );
        
        return { resistance, reactance };
    }

    _calculateOffCenter(length, eLen, k, lToR, feedPos) {
        const centerFed = this._calculateCenterFed(length, eLen, k, lToR);
        const offsetFromCenter = Math.abs(feedPos - 0.5);
        
        const electricalOffset = offsetFromCenter * k * length;
        const transformFactor = offsetFromCenter < 0.1 ?
            1 + offsetFromCenter * 2 :
            1 / (Math.cos(electricalOffset) ** 2);
        
        const currentScaling = Math.cos(electricalOffset);
        
        return {
            resistance: centerFed.resistance * transformFactor,
            reactance: centerFed.reactance * Math.sqrt(transformFactor) * currentScaling
        };
    }
}
"@

$matchingNetworks = @"
import { MATCHING_NETWORKS } from './constants.js';

export class MatchingNetworks {
    static applyMatching(impedance, networkType) {
        if (!networkType) {
            return { impedance, matchingType: "None" };
        }
        
        const config = MATCHING_NETWORKS[networkType];
        if (!config) {
            return { impedance, matchingType: "Unknown" };
        }
        
        if (networkType === 'use1to1Balun') {
            return { 
                impedance: {
                    resistance: impedance.resistance,
                    reactance: impedance.reactance
                }, 
                matchingType: config.name 
            };
        }
        
        const transformedImpedance = {
            resistance: impedance.resistance / config.ratio,
            reactance: impedance.reactance / config.ratio
        };
        
        return {
            impedance: transformedImpedance,
            matchingType: config.name
        };
    }
}
"@

Create-File "physics/constants.js" $physicsConstants
Create-File "physics/physicsutils.js" $physicsUtils
Create-File "physics/impedancecalculator.js" $impedanceCalculator
Create-File "physics/matchingnetworks.js" $matchingNetworks