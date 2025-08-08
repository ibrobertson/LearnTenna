class PerformanceMonitor {
    constructor(elementId) {
        this.element = document.getElementById(elementId);
        this.lastTime = performance.now();
        this.frameCount = 0;
        this.fps = 0;
        this.fpsHistory = [];
        this.maxHistory = 60;
    }

    update() {
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;
        
        this.fpsHistory.push(deltaTime);
        
        if (this.fpsHistory.length > this.maxHistory) {
            this.fpsHistory.shift();
        }
        
        if (this.fpsHistory.length > 5) {
            const avgFrameTime = this.fpsHistory.reduce((a, b) => a + b) / this.fpsHistory.length;
            this.fps = Math.round(1000 / avgFrameTime);
            
            if (this.element) {
                this.element.textContent = `FPS: ${this.fps}`;
                
                if (this.fps >= 55) {
                    this.element.style.color = '#00ff00';
                } else if (this.fps >= 30) {
                    this.element.style.color = '#ffaa00';
                } else {
                    this.element.style.color = '#ff3366';
                }
            }
        }
        
        this.lastTime = currentTime;
    }

    getFPS() {
        return this.fps;
    }
}

