/**
 * Memory Match - 100% Procedural Web Audio Synthesizer
 * Zero external audio files — 100% copyright-free procedural synthesis.
 * Features auto-unlocking on first interaction and tactile cyber tones.
 */

class MemoryAudio {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.isMuted = false;
        this.isInitialized = false;

        try {
            const saved = localStorage.getItem('memory_audio_muted');
            if (saved !== null) this.isMuted = JSON.parse(saved);
        } catch (e) {
            this.isMuted = false;
        }

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
            } catch (e) {
                return;
            }
        }

        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
    }

    ensureContext() {
        if (!this.ctx) {
            this.init();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
    }

    toggleMute() {
        this.ensureContext();
        this.isMuted = !this.isMuted;
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.85, this.ctx.currentTime);
        }
        try {
            localStorage.setItem('memory_audio_muted', JSON.stringify(this.isMuted));
        } catch (e) {}

        if (!this.isMuted) {
            this.playClick();
        }
        return this.isMuted;
    }

    playFlip() {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(360, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.1);
    }

    playMatch() {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        freqs.forEach((freq, idx) => {
            const time = now + idx * 0.07;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, time);

            gain.gain.setValueAtTime(0.45, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.28);

            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(time);
            osc.stop(time + 0.29);
        });
    }

    playMismatch() {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.linearRampToValueAtTime(140, now + 0.22);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.23);
    }

    playVictory() {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98]; // C5 pentatonic fanfare
        notes.forEach((freq, idx) => {
            const time = now + idx * 0.09;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, time);

            gain.gain.setValueAtTime(0.5, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);

            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(time);
            osc.stop(time + 0.41);
        });
    }

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

window.memoryAudio = new MemoryAudio();
