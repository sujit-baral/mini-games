/**
 * Doodle Guess Arcade - Web Audio Synthesizer
 * 100% procedural sound effects — zero external mp3/wav audio downloads.
 * Strictly initializes upon user gesture and remembers mute preference.
 */

class DoodleSoundController {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.isMuted = false;
        this.isInitialized = false;

        try {
            const saved = localStorage.getItem('doodle_guess_muted');
            if (saved !== null) {
                this.isMuted = JSON.parse(saved);
            }
        } catch (e) {
            this.isMuted = false;
        }
    }

    init() {
        if (this.isInitialized) {
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
            return;
        }

        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) return;

            this.ctx = new AudioContextClass();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.75, this.ctx.currentTime);
            this.masterGain.connect(this.ctx.destination);
            this.isInitialized = true;
        } catch (err) {
            console.warn('Web Audio initialization error:', err);
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.75, this.ctx.currentTime);
        }
        try {
            localStorage.setItem('doodle_guess_muted', JSON.stringify(this.isMuted));
        } catch (e) {}
        return this.isMuted;
    }

    playUiClick() {
        if (this.isMuted || !this.ctx) return;
        try {
            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(440, t);
            osc.frequency.exponentialRampToValueAtTime(880, t + 0.04);

            gain.gain.setValueAtTime(0.15, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(t);
            osc.stop(t + 0.04);
        } catch (e) {}
    }

    playDrawStroke() {
        if (this.isMuted || !this.ctx) return;
        // Subtle soft pencil scratch
        try {
            const t = this.ctx.currentTime;
            const bufferSize = this.ctx.sampleRate * 0.025; // 25ms
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
            }

            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(1400 + Math.random() * 400, t);
            filter.Q.setValueAtTime(3, t);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.04, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);

            noise.start(t);
        } catch (e) {}
    }

    playCorrectGuess() {
        if (this.isMuted || !this.ctx) return;
        try {
            const t = this.ctx.currentTime;
            // Celebratory major arpeggio: C5 -> E5 -> G5 -> C6
            const notes = [523.25, 659.25, 783.99, 1046.50];
            notes.forEach((freq, i) => {
                const noteTime = t + (i * 0.07);
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, noteTime);

                gain.gain.setValueAtTime(0.2, noteTime);
                gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.25);

                osc.connect(gain);
                gain.connect(this.masterGain);

                osc.start(noteTime);
                osc.stop(noteTime + 0.25);
            });
        } catch (e) {}
    }

    playClockTick() {
        if (this.isMuted || !this.ctx) return;
        try {
            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, t);
            osc.frequency.exponentialRampToValueAtTime(600, t + 0.03);

            gain.gain.setValueAtTime(0.12, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(t);
            osc.stop(t + 0.03);
        } catch (e) {}
    }

    playRoundStart() {
        if (this.isMuted || !this.ctx) return;
        try {
            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(330, t);
            osc.frequency.exponentialRampToValueAtTime(660, t + 0.15);

            gain.gain.setValueAtTime(0.25, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(t);
            osc.stop(t + 0.25);
        } catch (e) {}
    }

    playRoundEnd() {
        if (this.isMuted || !this.ctx) return;
        try {
            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(350, t);
            osc.frequency.exponentialRampToValueAtTime(180, t + 0.35);

            gain.gain.setValueAtTime(0.2, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(t);
            osc.stop(t + 0.35);
        } catch (e) {}
    }

    playCoinReward() {
        if (this.isMuted || !this.ctx) return;
        try {
            const t = this.ctx.currentTime;
            const osc1 = this.ctx.createOscillator();
            const osc2 = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(987.77, t); // B5
            osc1.frequency.setValueAtTime(1318.51, t + 0.08); // E6

            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(1975.53, t); // B6 harmonic
            osc2.frequency.setValueAtTime(2637.02, t + 0.08); // E7

            gain.gain.setValueAtTime(0.25, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(this.masterGain);

            osc1.start(t);
            osc2.start(t);
            osc1.stop(t + 0.35);
            osc2.stop(t + 0.35);
        } catch (e) {}
    }

    playBuySuccess() {
        if (this.isMuted || !this.ctx) return;
        try {
            const t = this.ctx.currentTime;
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
            notes.forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const noteTime = t + idx * 0.06;

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, noteTime);

                gain.gain.setValueAtTime(0.18, noteTime);
                gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.2);

                osc.connect(gain);
                gain.connect(this.masterGain);

                osc.start(noteTime);
                osc.stop(noteTime + 0.2);
            });
        } catch (e) {}
    }

    playEquip() {
        if (this.isMuted || !this.ctx) return;
        try {
            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, t);
            osc.frequency.exponentialRampToValueAtTime(1200, t + 0.07);

            gain.gain.setValueAtTime(0.2, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(t);
            osc.stop(t + 0.07);
        } catch (e) {}
    }
}

if (typeof window !== 'undefined') {
    window.DoodleSoundController = DoodleSoundController;
}

