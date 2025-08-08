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
