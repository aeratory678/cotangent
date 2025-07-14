// script.js
// Coordinates UI, audio, and visualization for Cotangent

// --- DOM Elements ---
const canvas = document.getElementById('ferrofluid-canvas');
const barBass = document.querySelector('.ctg-bar-bass');
const barMid = document.querySelector('.ctg-bar-mid');
const barTreble = document.querySelector('.ctg-bar-treble');
const sampleRateSpan = document.getElementById('ctg-sample-rate');
const audioBar = document.querySelector('.ctg-audio-bar');
const playBtn = document.querySelector('.ctg-audio-play');
const playIcon = document.querySelector('.ctg-audio-play-icon');
const pauseIcon = document.querySelector('.ctg-audio-pause-icon');
const fileNameSpan = document.querySelector('.ctg-audio-filename');
const audioTimeSpan = document.querySelector('.ctg-audio-time');
const progressBar = document.querySelector('.ctg-audio-progress-bar');
const uploadInput = document.getElementById('audio-upload');

// --- State ---
let audioProcessor = null;
let ferrofluid = new FerrofluidPhysics(canvas);
let isPlaying = false;
let audioFileName = '';
let audioDuration = 0;
let audioTimeInterval = null;

// --- Utility: Format seconds as mm:ss ---
function formatTime(sec) {
    sec = Math.max(0, Math.floor(sec));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// --- Animation Loop ---
function animate() {
    // Only update ferrofluid here if not playing audio
    if (!isPlaying) {
        ferrofluid.update();
    }
    ferrofluid.render();
    requestAnimationFrame(animate);
}
animate();

// --- Status Dot Helper ---
function setStatusDot(color = '#00e676', label = 'ready') {
    const dot = document.querySelector('.ctg-dot');
    const ready = document.querySelector('.ctg-ready');
    if (dot) dot.style.background = color;
    if (ready) ready.textContent = label;
}

// --- Audio Bar State ---
function setAudioBarState(isPlaying, fileName, elapsed, duration) {
    if (isPlaying) {
        playIcon.style.display = 'none';
        pauseIcon.style.display = '';
    } else {
        playIcon.style.display = '';
        pauseIcon.style.display = 'none';
    }
    fileNameSpan.textContent = fileName || 'no file';
    // Removed time text update for progress bar UI
}

// --- Show/hide audio bar ---
function showAudioBar(show) {
    if (audioBar) audioBar.style.display = show ? '' : 'none';
}

// --- Update Audio Time Display ---
function updateAudioTime() {
    if (!audioProcessor || !audioProcessor.audioContext) return;
    let elapsed = 0;
    if (audioProcessor.hasEnded && !audioProcessor.isPlaying) {
        elapsed = audioDuration;
        setStatusDot('#00e676', 'ready');
    } else if (audioProcessor.isPlaying) {
        elapsed = audioProcessor.audioContext.currentTime - audioProcessor.startTime;
        setStatusDot('#2979ff', 'playing');
    } else if (!isPlaying && audioProcessor.pauseTime > 0) {
        elapsed = audioProcessor.pauseTime || 0;
        setStatusDot('#ffb300', 'paused');
    } else {
        elapsed = audioProcessor.pauseTime || 0;
        setStatusDot('#00e676', 'ready');
    }
    // Update progress bar
    let percent = (audioDuration > 0) ? Math.min(100, (elapsed / audioDuration) * 100) : 0;
    if (progressBar) progressBar.style.width = percent + '%';
    setAudioBarState(isPlaying, audioFileName, elapsed, audioDuration);
}

// --- Play/Pause Button ---
playBtn.addEventListener('click', () => {
    if (!audioProcessor) return;
    // If at end, reset to start
    if (!isPlaying && audioProcessor.pauseTime >= audioDuration - 0.1) {
        audioProcessor.pauseTime = 0;
    }
    if (isPlaying) {
        audioProcessor.pause && audioProcessor.pause(); // <-- actually pause audio
        isPlaying = false;
        setStatusDot('#ffb300', 'paused');
        clearInterval(audioTimeInterval);
        updateAudioTime();
    } else {
        audioProcessor.play && audioProcessor.play();
        isPlaying = true;
        setStatusDot('#2979ff', 'playing');
        audioTimeInterval = setInterval(updateAudioTime, 500);
    }
});

// --- Frequency Bars & Ferrofluid Update ---
function updateBarsAndFerrofluid(frequencyData) {
    console.log('Frequency data:', frequencyData.slice(0, 10)); // Debug: log first 10 values
    // Split frequencyData into bass, mid, treble
    const len = frequencyData.length;
    const bassArr = frequencyData.slice(0, len / 6);
    const midArr = frequencyData.slice(len / 6, len / 2);
    const trebleArr = frequencyData.slice(len / 2);
    const bass = avg(bassArr);
    const mid = avg(midArr);
    const treble = avg(trebleArr);
    // Set bar widths (max 100px, min 10px for visibility)
    barBass.style.width = Math.max(10, (bass / 255 * 100)) + 'px';
    barMid.style.width = Math.max(10, (mid / 255 * 100)) + 'px';
    barTreble.style.width = Math.max(10, (treble / 255 * 100)) + 'px';
    // Set bar color for subtle animation
    barBass.style.background = `linear-gradient(90deg,#bbb ${(bass/255)*100}%,#eee 100%)`;
    barMid.style.background = `linear-gradient(90deg,#bbb ${(mid/255)*100}%,#eee 100%)`;
    barTreble.style.background = `linear-gradient(90deg,#bbb ${(treble/255)*100}%,#eee 100%)`;
    // Update ferrofluid with bass, mid, treble for both large and small waves
    ferrofluid.update(frequencyData, { bass, mid, treble, bassSmall: bass, midSmall: mid, trebleSmall: treble });
}

// --- Helper: Average of array ---
function avg(arr) {
    if (!arr.length) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// --- Audio Upload ---
uploadInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Set filename in UI
    audioFileName = file.name;

    // Create or update AudioProcessor with proper callbacks
    if (!audioProcessor) {
        audioProcessor = new AudioProcessor({
            onUpdate: updateBarsAndFerrofluid,
            onSampleRate: (rate) => {
                if (sampleRateSpan) sampleRateSpan.textContent = rate;
            },
            onEnded: () => {
                isPlaying = false;
                setStatusDot('#00e676', 'ready');
                clearInterval(audioTimeInterval);
                updateAudioTime();
            }
        });
    } else {
        audioProcessor.onUpdate = updateBarsAndFerrofluid;
        audioProcessor.onSampleRate = (rate) => {
            if (sampleRateSpan) sampleRateSpan.textContent = rate;
        };
        audioProcessor.onEnded = () => {
            isPlaying = false;
            setStatusDot('#00e676', 'ready');
            clearInterval(audioTimeInterval);
            updateAudioTime();
        };
    }

    setStatusDot('#00e676', 'processing');
    await audioProcessor.loadFile(file);

    // Set duration
    audioDuration = audioProcessor.audioBuffer ? audioProcessor.audioBuffer.duration : 0;

    // Show audio bar and update UI
    showAudioBar(true);
    updateAudioTime();
    setAudioBarState(false, audioFileName, 0, audioDuration);
});

// --- Optionally, update status dot color based on audio state ---
if (window.AudioProcessor) {
    const origPlay = AudioProcessor.prototype.play;
    AudioProcessor.prototype.play = function() {
        // Only show 'processing' if not already playing
        if (!this.isPlaying) setStatusDot('#00e676', 'processing');
        origPlay.call(this);
        // After starting playback, immediately show 'playing'
        setTimeout(() => setStatusDot('#2979ff', 'playing'), 100);
    };
}

// --- Freq Card Toggle ---
const freqToggle = document.querySelector('.ctg-freq-toggle');
const freqCard = document.querySelector('.ctg-freq-card');
const freqArrow = document.querySelector('.ctg-freq-arrow');
if (freqToggle && freqCard && freqArrow) {
    freqToggle.addEventListener('click', () => {
        const isOpen = freqCard.style.display !== 'none';
        freqCard.style.display = isOpen ? 'none' : '';
        // Chevron: up (open) or down (closed)
        freqArrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
    });
}
