# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LearnTenna is an interactive 3D antenna visualization tool that provides accurate physics calculations for various antenna types including current/voltage distributions, electromagnetic field visualization, and impedance analysis. The application uses vanilla JavaScript ES6 modules with Three.js for 3D rendering.

## Development Environment

**No package.json exists** - This is a pure client-side web application served directly from static files.

### Running the Application
- Open `index.html` directly in a web browser
- For development with live reloading, use any static file server:
  - `python -m http.server 8000` (Python)
  - `npx live-server` (Node.js)
  - `php -S localhost:8000` (PHP)

### Browser Requirements
- Modern browser with WebGL support (Chrome, Firefox, Safari, Edge)
- Three.js r128 loaded from CDN

## Architecture Overview

### Core Module Structure

**Physics Engine** (`/physics/`)
- `constants.js` - Physical constants and matching network definitions
- `physicsutils.js` - Utility functions for calculations and formatting
- `impedancecalculator.js` - Complex impedance calculations using method of moments
- `matchingnetworks.js` - Impedance transformation and matching network logic
- `nodescalculator.js` - Node/antinode position calculations

**Models** (`/models/`)
- `antennamodel.js` - Main antenna model with physics engine integration

**Rendering** (`/rendering/`)
- `Scene3D.js` - Three.js scene setup and coordinate system
- `CameraController.js` - Camera controls and user interaction
- `AntennaRenderer.js` - 3D antenna wire visualization
- `NodesRenderer.js` - Node/antinode marker rendering
- `FieldRenderer.js` - Electromagnetic field visualization
- `ThreeDRenderer.js` - Main renderer orchestration
- `PerformanceMonitor.js` - FPS tracking and performance monitoring

**UI Controllers** (`/ui/`)
- `controls.js` - Form controls and user input handling
- `display.js` - Information panel updates
- `fallback.js` - Fallback mode for WebGL-disabled browsers

**Entry Point**
- `js/main.js` - Main application orchestration and startup

### Data Flow
1. User input updates `AntennaModel` parameters
2. Model triggers physics calculations via `AntennaPhysicsEngine`
3. Results propagate to rendering modules and UI display
4. Three.js renders the updated 3D scene
5. Display panels show calculated impedance, SWR, and antenna analysis

### Key Design Patterns

**Module System**: ES6 imports/exports with clear separation of concerns
**Caching Strategy**: Impedance and field distribution calculations are cached for performance
**Error Handling**: Graceful fallback to calculation-only mode if WebGL fails
**Animation Loop**: RequestAnimationFrame-based rendering with time-based field animations

## Physics Implementation

The application implements transmission line theory and antenna physics:
- **Method of Moments** approximations for impedance calculation
- **Standing Wave Analysis** with accurate current/voltage phase relationships
- **Field Theory** with proper E-field and H-field calculations
- **Matching Networks** supporting 1:1 baluns, 4:1 baluns, and 9:1/49:1 UnUns

## Common Debugging

### WebGL Issues
Check browser WebGL support and Three.js loading. The app provides fallback mode with working calculations but no 3D visualization.

### Physics Cache
Monitor performance via debug panel - cache stats show impedance and distribution calculation efficiency.

### Module Loading
All imports use relative paths with `.js` extensions for ES6 module compatibility.

## File Organization

- Root contains `index.html` and static assets
- `/backups/` contains development archives
- `/config/` contains configuration constants
- Each module directory has focused responsibility
- No build process or compilation required