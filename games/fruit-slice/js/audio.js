/**
 * Fruit Slice Arcade - 100% Procedural Web Audio Synthesizer
 * Zero external audio files — 100% copyright-free procedural synthesis.
 * Built with Web Audio API (Oscillators, Noise Buffers, Biquad Filters, Envelopes).
 * Automatically unlocks on first user gesture (touch, click, keydown).
 */

class SoundController {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.isMuted = false;
        this.isInitialized = false;

        // Restore mute state from localStorage if available
        try {
            const savedMute = localStorage.getItem('fruit_slice_muted');
            if (savedMute !== null) {
                this.isMuted = JSON.parse(savedMute);
            }
        } catch (e) {
            this.isMuted = false;
        }

        // Global gesture listeners to guarantee instant unlock on modern browsers
        this.bindUnlockGestures();
    }

    bindUnlockGestures() {
        const unlock = () => {
            this.init();
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume().catch(() => {});
            }
        };

        if (typeof window !== 'undefined') {
            ['click', 'pointerdown', 'touchstart', 'keydown'].forEach(evt => {
                window.addEventListener(evt, unlock, { passive: true });
            });
        }
    }

    /**
     * Initializes the Web Audio context on user interaction.
     */
    init() {
        if (!this.ctx) {
            try {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                if (!AudioContextClass) return;

                this.ctx = new AudioContextClass();
                this.masterGain = this.ctx.createGain();
                this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.85, this.ctx.currentTime);
                this.masterGain.connect(this.ctx.destination);
                this.isInitialized = true;
            } catch (err) {
                console.warn('Web Audio initialization error:', err);
                return;
            }
        }

        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
    }

    /**
     * Ensures AudioContext is created and running before playing any sound.
     */
    ensureContext() {
        if (!this.ctx) {
            this.init();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
    }

    /**
     * Toggles sound on/off and persists setting.
     */
    toggleMute() {
        this.ensureContext();
        this.isMuted = !this.isMuted;
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.85, this.ctx.currentTime);
        }
        try {
            localStorage.setItem('fruit_slice_muted', JSON.stringify(this.isMuted));
        } catch (e) {}

        if (!this.isMuted) {
            this.playClick();
        }
        return this.isMuted;
    }

    /**
     * Helper to create a buffer of procedural white noise.
     */
    createNoiseBuffer(duration = 0.25) {
        if (!this.ctx) return null;
        const bufferSize = Math.floor(this.ctx.sampleRate * duration);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    /**
     * Swish / Blade whoosh sound when swiping rapidly.
     */
    playSwish(speedFactor = 1.0) {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const noise = this.ctx.createBufferSource();
        const noiseBuffer = this.createNoiseBuffer(0.18);
        if (!noiseBuffer) return;
        noise.buffer = noiseBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.Q.setValueAtTime(2.5, now);
        filter.frequency.setValueAtTime(700 * speedFactor, now);
        filter.frequency.exponentialRampToValueAtTime(1600 * speedFactor, now + 0.08);
        filter.frequency.exponentialRampToValueAtTime(300, now + 0.16);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.55, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noise.start(now);
        noise.stop(now + 0.19);
    }

    /**
     * Juicy fruit slice / squish sound.
     */
    playSlice(pitchShift = 1.0) {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;

        // 1. Blade cut transient (bright metallic sweep)
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1600 * pitchShift, now);
        osc.frequency.exponentialRampToValueAtTime(320 * pitchShift, now + 0.1);

        oscGain.gain.setValueAtTime(0.65, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        osc.connect(oscGain);
        oscGain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.11);

        // 2. Juicy squish noise burst
        const noise = this.ctx.createBufferSource();
        const noiseBuf = this.createNoiseBuffer(0.18);
        if (!noiseBuf) return;
        noise.buffer = noiseBuf;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2200 * pitchShift, now);
        filter.frequency.exponentialRampToValueAtTime(450, now + 0.16);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.6, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.masterGain);

        noise.start(now);
        noise.stop(now + 0.17);
    }

    /**
     * Combo celebration chime arpeggio.
     */
    playCombo(comboCount = 3) {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const baseFreqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        const count = Math.min(comboCount, 5);

        for (let i = 0; i < count; i++) {
            const time = now + i * 0.07;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            const f = baseFreqs[i % baseFreqs.length] * (1 + Math.floor(i / baseFreqs.length) * 0.5);
            osc.frequency.setValueAtTime(f, time);

            gain.gain.setValueAtTime(0.45, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.28);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(time);
            osc.stop(time + 0.29);
        }
    }

    /**
     * Bomb explosion — deep sub-bass punch + distortion noise.
     */
    playExplosion() {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;

        // Sub-bass thud
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(32, now + 0.45);

        oscGain.gain.setValueAtTime(0.9, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc.connect(oscGain);
        oscGain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.46);

        // Cracking explosion noise
        const noise = this.ctx.createBufferSource();
        const noiseBuf = this.createNoiseBuffer(0.55);
        if (!noiseBuf) return;
        noise.buffer = noiseBuf;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400, now);
        filter.frequency.exponentialRampToValueAtTime(100, now + 0.5);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.85, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.52);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.masterGain);

        noise.start(now);
        noise.stop(now + 0.53);
    }

    /**
     * Bomb fuse ticking / spark crackle.
     */
    playFuseSpark() {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const noise = this.ctx.createBufferSource();
        const noiseBuf = this.createNoiseBuffer(0.04);
        if (!noiseBuf) return;
        noise.buffer = noiseBuf;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(4000, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noise.start(now);
        noise.stop(now + 0.05);
    }

    /**
     * Strike / Life lost buzzer.
     */
    playStrike() {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(110, now + 0.28);

        gain.gain.setValueAtTime(0.55, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.29);
    }

    /**
     * Game start arcade fanfare.
     */
    playGameStart() {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [349.23, 440.00, 523.25, 698.46]; // F4, A4, C5, F5
        notes.forEach((freq, idx) => {
            const time = now + idx * 0.08;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, time);

            gain.gain.setValueAtTime(0.45, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(time);
            osc.stop(time + 0.26);
        });
    }

    /**
     * Game over descending minor chords.
     */
    playGameOver() {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [440.00, 415.30, 369.99, 329.63]; // A4, Ab4, F#4, E4
        notes.forEach((freq, idx) => {
            const time = now + idx * 0.14;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, time);

            gain.gain.setValueAtTime(0.4, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(time);
            osc.stop(time + 0.36);
        });
    }

    /**
     * UI button click.
     */
    playClick() {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(640, now);
        osc.frequency.exponentialRampToValueAtTime(960, now + 0.04);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.06);
    }
}

// Global instance
window.soundCtrl = new SoundController();
