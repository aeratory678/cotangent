// ferrofluid-physics.js
// Draws a thin black circle and a soft, organic ferrofluid shape in the center of the canvas

class FerrofluidPhysics {
    /**
     * @param {HTMLCanvasElement} canvas - The canvas to render the ferrofluid on
     */
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.numParticles = 256; // 8 points per lobe, 24 lobes
        this.rotation = 0; // rotation angle in radians
        this.lastUpdateTime = Date.now();
        this.initParticles();
    }

    /**
     * Initializes the particles in a perfect circle.
     */
    initParticles() {
        const w = this.canvas.width;
        const h = this.canvas.height;
        // Make the ferrofluid shape a perfect circle (use width for radius, not min)
        const radius = w / 2 - 100; // smaller ferrofluid, always round
        this.particles = [];
        for (let i = 0; i < this.numParticles; i++) {
            const angle = (i / this.numParticles) * 2 * Math.PI;
            this.particles.push({
                baseAngle: angle,
                baseRadiusX: radius,
                baseRadiusY: radius,
                x: w / 2 + Math.cos(angle) * radius,
                y: h / 2 + Math.sin(angle) * radius,
                vx: 0,
                vy: 0
            });
        }
    }

    /**
     * Updates the ferrofluid shape based on audio frequency data and settings.
     * @param {number[]} frequencyData - Array of frequency magnitudes
     * @param {Object} bands - { bass, mid, treble }
     */
    update(frequencyData, bands) {
        // Audio-driven, smooth, wavy organic shape
        const len = this.particles.length;
        let freq = frequencyData && frequencyData.length ? frequencyData : null;
        // Use bands for multi-part control
        let bass = bands && bands.bass !== undefined ? bands.bass : 64;
        let mid = bands && bands.mid !== undefined ? bands.mid : 64;
        let treble = bands && bands.treble !== undefined ? bands.treble : 64;
        // For small waves, use new properties if provided
        let bassSmall = bands && bands.bassSmall !== undefined ? bands.bassSmall : bass;
        let midSmall = bands && bands.midSmall !== undefined ? bands.midSmall : mid;
        let trebleSmall = bands && bands.trebleSmall !== undefined ? bands.trebleSmall : treble;
        // --- Rotation logic ---
        const now = Date.now();
        const delta = (now - this.lastUpdateTime) / 1000; // seconds
        this.lastUpdateTime = now;
        // Use global rotation speed if set
        let rotSpeed = (window.ctgRotationSpeed !== undefined) ? window.ctgRotationSpeed : 0.25;
        this.rotation += delta * rotSpeed;
        if (this.rotation > Math.PI * 2) this.rotation -= Math.PI * 2;
        // Use global sensitivity if set
        let sensitivity = (window.ctgSensitivity !== undefined) ? window.ctgSensitivity : 1.0;
        for (let i = 0; i < len; i++) {
            const p = this.particles[i];
            let spike = 0;
            if (freq) {
                // Assign band in sequence: 0-bass, 1-mid, 2-treble, repeat
                let bandValue, smallBandValue;
                if (i % 3 === 0) {
                    bandValue = bass;
                    smallBandValue = bassSmall;
                } else if (i % 3 === 1) {
                    bandValue = mid;
                    smallBandValue = midSmall;
                } else {
                    bandValue = treble;
                    smallBandValue = trebleSmall;
                }
                // Large lobes (main shape)
                let mainLobe = (bandValue - 128) * 0.5 * sensitivity;
                // Small waves (superimposed)
                let t = i * (2 * Math.PI / len) + this.rotation;
                let smallWave = (smallBandValue - 128) * 0.16 * Math.sin(6 * t + now / 300) * sensitivity;
                spike = mainLobe + smallWave;
            } else {
                // Idle: combine large lobes and smaller spikes
                const t = Date.now() / 900;
                const mainLobes = 14; // large lobes
                const smallSpikes = 42; // smaller spikes
                spike = sensitivity * (16 * Math.sin(t + i * (2 * Math.PI / (len / mainLobes)))
                      + 7 * Math.sin(t * 1.2 + i * (2 * Math.PI / (len / smallSpikes))));
            }
            // Elliptical base
            // --- Apply rotation to angle ---
            const angle = p.baseAngle + this.rotation;
            const radiusX = p.baseRadiusX + spike;
            const radiusY = p.baseRadiusY + spike;
            // Smoothly interpolate to new position
            p.x += ((this.canvas.width / 2 + Math.cos(angle) * radiusX) - p.x) * 0.25;
            p.y += ((this.canvas.height / 2 + Math.sin(angle) * radiusY) - p.y) * 0.25;
        }
    }

    /**
     * Renders the outline circle and the ferrofluid shape using Catmull-Rom splines.
     */
    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // Draw outer circle (shifted higher)
        ctx.save();
        ctx.beginPath();
        const cx = this.canvas.width / 2;
        // Use width for radius calculation to keep circle perfectly round
        const cy = this.canvas.height / 2 - 60;
        const r = this.canvas.width / 2 - 40; // slightly smaller circle
        if (window.ctgShowOutline !== false) {
            ctx.arc(cx, cy, r, 0, 2 * Math.PI);
            ctx.lineWidth = 1.1;
            ctx.strokeStyle = '#222';
            ctx.shadowColor = 'rgba(0,0,0,0.07)';
            ctx.shadowBlur = 0;
            ctx.stroke();
        }
        ctx.restore();
        // Draw ferrofluid shape with Catmull-Rom spline for smoothness, also shifted higher
        ctx.save();
        ctx.globalAlpha = 1.0; // fully opaque
        ctx.fillStyle = 'rgb(10, 10, 10 )'; // much darker
        ctx.beginPath();
        const pts = this.particles;
        function catmullRom(t, p0, p1, p2, p3) {
            return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2*p0 - 5*p1 + 4*p2 - p3) * t * t + (-p0 + 3*p1 - 3*p2 + p3) * t * t * t);
        }
        for (let i = 0; i < pts.length; i++) {
            const p0 = pts[(i - 1 + pts.length) % pts.length];
            const p1 = pts[i];
            const p2 = pts[(i + 1) % pts.length];
            const p3 = pts[(i + 2) % pts.length];
            for (let t = 0; t < 1; t += 0.1) {
                const x = catmullRom(t, p0.x, p1.x, p2.x, p3.x);
                const y = catmullRom(t, p0.y, p1.y, p2.y, p3.y) - 60; // shift up by 60px
                if (i === 0 && t === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.shadowColor = 'rgba(0,0,0,0.16)';
        ctx.shadowBlur = 64;
        ctx.fill();
        ctx.restore();
    }
}

window.FerrofluidPhysics = FerrofluidPhysics;
