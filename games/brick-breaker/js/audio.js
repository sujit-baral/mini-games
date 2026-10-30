/**
 * Cyber Brick Breaker - 100% Procedural Web Audio Synthesizer
 * Zero external audio dependencies — 100% copyright-free procedural synthesis.
 * Features auto-unlocking on first interaction and punchy arcade tones.
 */

class BrickAudio {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.isMuted = false;
        this.isInitialized = false;

        try {
            const saved = localStorage.getItem('brick_audio_muted');
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
            localStorage.setItem('brick_audio_muted', JSON.stringify(this.isMuted));
        } catch (e) {}

        if (!this.isMuted) {
            this.playClick();
        }
        return this.isMuted;
    }

    playBounce(isPaddle = false) {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = isPaddle ? 'sine' : 'triangle';
        const startFreq = isPaddle ? 460 : 320;
        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.exponentialRampToValueAtTime(isPaddle ? 620 : 220, now + 0.08);

        gain.gain.setValueAtTime(0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.09);
    }

    playBrickHit(combo = 1) {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const baseFreq = 520 + Math.min((combo - 1) * 80, 700);
        osc.type = 'square';
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.6, now + 0.09);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.11);
    }

    playPowerup() {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
            const time = now + idx * 0.06;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, time);

            gain.gain.setValueAtTime(0.4, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(time);
            osc.stop(time + 0.21);
        });
    }

    playLifeLost() {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.4);

        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.41);
    }

    playLevelClear() {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const melody = [523.25, 659.25, 783.99, 1046.50, 1318.51];
        melody.forEach((freq, i) => {
            const t = now + i * 0.09;
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, t);
            g.gain.setValueAtTime(0.45, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.26);
            osc.connect(g);
            g.connect(this.masterGain);
            osc.start(t);
            osc.stop(t + 0.27);
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

window.brickAudio = new BrickAudio();
