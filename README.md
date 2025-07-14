# Cotangent

**Cotangent** is a liquid-based audio visualizer that utilizes Catmull-Rom splines to create a smooth, organic ferrofluid-like animation, driven by live audio frequency data. The project features a modern UI, real-time audio upload and playback, and visually appealing frequency-responsive animations.

## Features

- 🎵 **Audio Upload & Playback**: Upload your own audio files and watch the visualization react in real time.
- 🟢 **Ferrofluid Visualizer**: A central ferrofluid blob morphs smoothly using Catmull-Rom splines, with lobes and spikes responding to bass, mid, and treble frequencies.
- 📊 **Frequency Bars**: Minimalist horizontal bars show the current bass, mid, and treble levels.
- ⚡ **Real-Time Animation**: Responsive updates and performance-optimized rendering with requestAnimationFrame.
- 🌓 **Modern UI**: Clean, minimalist design using CSS, SVG icons, and custom controls.
- 🛠️ **Customizable Settings**:  Options to adjust sensitivity, rotation speed, and outline display.

## Demo


## How It Works

### Audio Processing

- The `AudioProcessor` class (see `audio-processor.js`) uses the Web Audio API to decode uploaded audio files and extract frequency data via an AnalyserNode.
- Frequency data is split into bass, mid, and treble, which update both the UI bars and the ferrofluid shape.

### Visualization

- The `FerrofluidPhysics` class (see `ferrofluid-physics.js`) maintains a ring of particles forming a shape in the center of the canvas.
- Each frame, the positions of the particles are modified by the current audio band values, creating large lobes (bass/mid/treble) and superimposed small waves.
- The shape outline is rendered using a Catmull-Rom spline for smoothness.

### UI and Controls

- The main interface is in `index.html` and styled with `style.css`.
- UI includes a header, frequency bars, a canvas for the visualizer, and custom audio controls.
- `script.js` coordinates the UI, file uploads, playback controls, and updates the visualization in sync with the audio.

## File Structure

```
index.html              # Main HTML file and UI layout
style.css               # Styles for the UI and visualizer
audio-processor.js      # Audio file handling and frequency extraction
ferrofluid-physics.js   # Visualization and shape physics
script.js               # Main coordination between UI, audio, and visualization
settings.js             # (Optional/Planned) Settings for sensitivity, rotation, etc
utils.js                # (Optional) Utility functions
favicon.svg             # SVG icon for browser tab
LICENSE                 # MIT License
```

## Usage

1. **Clone or Download** this repository.
2. Open `index.html` in a modern browser (Chrome, Firefox, Edge; requires Web Audio API support).
3. Click the upload icon to select an audio file.
4. Use the play/pause button to control playback. Watch the ferrofluid visualization react in real time!

## Technologies

- JavaScript (ES6+)
- Web Audio API
- HTML5 Canvas
- Catmull-Rom Splines
- CSS3

## License

MIT License  
Copyright (c) 2025 Edwin Jojo Udhiniparamban

See [LICENSE](LICENSE) for details.

## Credits

- Designed and developed by Edwin Jojo Udhiniparamban.
- Inspired by ferrofluid and audio visualization art.

---

*Contributions, issues, and suggestions are welcome!*
