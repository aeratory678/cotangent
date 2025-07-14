// audio-processor.js
// Handles audio file upload, playback, and frequency data extraction for Cotangent

class AudioProcessor {
    /**
     * @param {Object} opts
     * @param {function} opts.onUpdate - Called with frequency data on each animation frame
     * @param {function} opts.onSampleRate - Called with sample rate after loading
     */
    constructor({ onUpdate, onSampleRate, onEnded }) {
        this.audioContext = null; // Web Audio context
        this.analyser = null;     // AnalyserNode for FFT
        this.dataArray = null;    // Uint8Array for frequency data
        this.audioBufferSource = null; // BufferSourceNode for playback
        this.onUpdate = onUpdate;
        this.onSampleRate = onSampleRate;
        this.onEnded = onEnded;
        this.isPlaying = false;
        this.startTime = 0;   // When playback started (in context time)
        this.pauseTime = 0;   // Where playback was paused (in seconds)
        this.audioBuffer = null; // Decoded audio buffer
        this._endedByUser = false; // Track if stop was user-initiated
        this.hasEnded = false; // Track if playback ended naturally
    }

    /**
     * Loads an audio file, decodes it, and prepares for playback.
     * @param {File} file
     */
    async loadFile(file) {
        // Close previous context if running
        if (this.audioContext && this.audioContext.state !== 'closed') {
            await this.audioContext.close();
        }
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const arrayBuffer = await file.arrayBuffer();
        // Decode audio data (promise-based for compatibility)
        const audioBuffer = await (this.audioContext.decodeAudioData.length === 1
            ? this.audioContext.decodeAudioData(arrayBuffer)
            : new Promise((resolve, reject) => {
                this.audioContext.decodeAudioData(arrayBuffer, resolve, reject);
            })
        );
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 1024; // Lower FFT size for faster analysis
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.audioBuffer = audioBuffer;
        this.pauseTime = 0;
        this._createSource(0);
        this.analyser.connect(this.audioContext.destination);
        if (this.onSampleRate) this.onSampleRate(this.audioContext.sampleRate);
    }

    /**
     * Creates a new BufferSourceNode for playback, starting at offset (seconds).
     * @param {number} offset
     */
    _createSource(offset) {
        if (this.audioBufferSource) {
            try { this.audioBufferSource.disconnect(); } catch {}
        }
        this.audioBufferSource = this.audioContext.createBufferSource();
        this.audioBufferSource.buffer = this.audioBuffer;
        this.audioBufferSource.connect(this.analyser);
        this._endedByUser = false; // Reset before playback
        this.hasEnded = false; // Reset ended flag before playback
        this.audioBufferSource.onended = () => {
            this.isPlaying = false;
            if (!this._endedByUser) {
                this.pauseTime = this.audioBuffer.duration; // Set to duration at end
                this.hasEnded = true; // Mark as ended
            }
            if (this.onEnded) this.onEnded();
        };
        this.startOffset = offset || 0;
    }

    /**
     * Starts or resumes playback from the current pauseTime.
     */
    play() {
        if (!this.audioBuffer) return;
        if (this.isPlaying) return;
        // If at end, reset to start
        if (this.pauseTime >= this.audioBuffer.duration - 0.1) {
            this.pauseTime = 0;
            this.hasEnded = false;
        }
        this._createSource(this.pauseTime);
        this.audioBufferSource.start(0, this.pauseTime);
        this.startTime = this.audioContext.currentTime - this.pauseTime;
        this.isPlaying = true;
        this._update();
    }

    /**
     * Pauses playback and remembers the current position.
     */
    pause() {
        // Prevent pausing if already ended
        if (!this.isPlaying || this.hasEnded) return;
        this._endedByUser = true;
        this.audioBufferSource.stop();
        this.pauseTime = this.audioContext.currentTime - this.startTime;
        this.isPlaying = false;
        // Only set hasEnded if truly at the end
        if (Math.abs(this.pauseTime - this.audioBuffer.duration) < 0.1) {
            this.hasEnded = true;
        } else {
            this.hasEnded = false;
        }
    }

    /**
     * Animation loop: updates frequency data and calls onUpdate.
     */
    _update() {
        if (!this.isPlaying) return;
        this.analyser.getByteFrequencyData(this.dataArray);
        if (this.onUpdate) this.onUpdate([...this.dataArray]);
        requestAnimationFrame(() => this._update());
    }
}

window.AudioProcessor = AudioProcessor;
