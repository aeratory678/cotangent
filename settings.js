// settings.js
// Handles the settings panel logic for Cotangent

(function() {
    // Create settings panel if not present
    let panel = document.querySelector('.ctg-settings-panel');
    if (!panel) {
        panel = document.createElement('div');
        panel.className = 'ctg-settings-panel';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-modal', 'true');
        panel.setAttribute('aria-label', 'Settings');
        panel.innerHTML = `
            <div class="ctg-settings-title">settings</div>
            <div class="ctg-slider-row">
                <label for="ctg-sensitivity">sensitivity</label>
                <input type="range" id="ctg-sensitivity" min="0.1" max="2" step="0.01" value="1" aria-label="sensitivity">
                <span id="ctg-sensitivity-value">1.00</span>
            </div>
            <div class="ctg-slider-row">
                <label for="ctg-rotation">rotation speed</label>
                <input type="range" id="ctg-rotation" min="0" max="1" step="0.01" value="0.25" aria-label="rotation speed">
                <span id="ctg-rotation-value">0.25</span>
            </div>
            <div class="ctg-slider-row">
                <label for="ctg-outline">show outline</label>
                <input type="checkbox" id="ctg-outline" aria-label="show outline">
            </div>
        `;
        document.body.appendChild(panel);
    }
    // Show/hide logic for settings panel
    const gear = document.querySelector('.ctg-gear');
    gear.addEventListener('click', (e) => {
        e.stopPropagation();
        panel.classList.toggle('ctg-settings-open');
        if (panel.classList.contains('ctg-settings-open')) {
            // Update slider values on open
            document.getElementById('ctg-sensitivity-value').textContent = (+document.getElementById('ctg-sensitivity').value).toFixed(2);
            document.getElementById('ctg-rotation-value').textContent = (+document.getElementById('ctg-rotation').value).toFixed(2);
            document.getElementById('ctg-sensitivity').focus();
        }
    });
    // Close panel when clicking outside
    document.addEventListener('mousedown', function(e) {
        if (!panel.classList.contains('ctg-settings-open')) return;
        if (panel.contains(e.target) || gear.contains(e.target)) return;
        panel.classList.remove('ctg-settings-open');
    });
    // Keyboard: close on Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && panel.classList.contains('ctg-settings-open')) {
            panel.classList.remove('ctg-settings-open');
            gear.focus();
        }
    });
    // Sensitivity slider logic
    const sensSlider = document.getElementById('ctg-sensitivity');
    const sensValue = document.getElementById('ctg-sensitivity-value');
    sensSlider.addEventListener('input', function() {
        sensValue.textContent = (+this.value).toFixed(2);
        window.ctgSensitivity = +this.value;
    });
    // Rotation slider logic
    const rotSlider = document.getElementById('ctg-rotation');
    const rotValue = document.getElementById('ctg-rotation-value');
    rotSlider.addEventListener('input', function() {
        rotValue.textContent = (+this.value).toFixed(2);
        window.ctgRotationSpeed = +this.value;
    });
    // Outline toggle logic
    const outlineCheckbox = document.getElementById('ctg-outline');
    outlineCheckbox.addEventListener('change', function() {
        window.ctgShowOutline = this.checked;
    });
    // Defaults for global settings
    window.ctgSensitivity = +sensSlider.value;
    window.ctgRotationSpeed = +rotSlider.value;
    window.ctgShowOutline = outlineCheckbox.checked;
})();
