// Simple Web Audio SFX
(() => {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    let lastClick = 0;

    function beep(type, duration, freq, gain, decay) {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const amp = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);
        amp.gain.setValueAtTime(gain, now);
        amp.gain.exponentialRampToValueAtTime(0.0001, now + duration * decay);
        osc.connect(amp).connect(ctx.destination);
        osc.start(now);
        osc.stop(now + duration);
    }

    function noise(duration, gain) {
        const now = ctx.currentTime;
        const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const src = ctx.createBufferSource();
        const amp = ctx.createGain();
        amp.gain.setValueAtTime(gain, now);
        amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        src.buffer = buffer;
        src.connect(amp).connect(ctx.destination);
        src.start(now);
        src.stop(now + duration);
    }

    function ensureRunning() {
        if (ctx.state === 'suspended') ctx.resume();
    }

    function isEnabled() {
        return localStorage.getItem('soundEnabled') !== 'false';
    }

    function playClick() {
        const now = Date.now();
        if (now - lastClick < 60) return;
        lastClick = now;
        if (!isEnabled()) return;
        ensureRunning();
        beep('square', 0.06, 900, 0.08, 0.8);
    }

    function playTrigger() {
        if (!isEnabled()) return;
        ensureRunning();
        beep('triangle', 0.15, 220, 0.15, 0.7);
    }

    function playGunshot() {
        if (!isEnabled()) return;
        ensureRunning();
        noise(0.25, 0.25);
        beep('sawtooth', 0.1, 110, 0.08, 0.6);
    }

    window.AudioFX = { playClick, playTrigger, playGunshot, isEnabled };

    document.addEventListener('click', (e) => {
        const target = e.target.closest('button, .btn, a');
        if (target) playClick();
    });
})();
