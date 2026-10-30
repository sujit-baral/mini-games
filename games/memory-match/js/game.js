/**
 * Memory Match - Core Game Engine
 * Features 3 difficulty tiers, 3D card flip animations, timer, move counter,
 * keyboard grid navigation, touch support, Web Audio, and victory modals.
 */

const MEMORY_ICONS = [
    {
        id: 'bolt',
        name: 'Lightning Bolt',
        color: '#00e5ff',
        svg: `<svg viewBox="0 0 40 40" width="100%" height="100%"><polygon points="22,4 10,22 19,22 17,36 30,16 21,16" fill="#00e5ff" filter="drop-shadow(0 0 6px #00e5ff)"/></svg>`
    },
    {
        id: 'gem',
        name: 'Quantum Gem',
        color: '#e91e63',
        svg: `<svg viewBox="0 0 40 40" width="100%" height="100%"><polygon points="12,12 28,12 34,18 20,34 6,18" fill="#e91e63" filter="drop-shadow(0 0 6px #e91e63)"/><polygon points="12,12 28,12 20,34" fill="rgba(255,255,255,0.3)"/></svg>`
    },
    {
        id: 'planet',
        name: 'Ringed Planet',
        color: '#ff9800',
        svg: `<svg viewBox="0 0 40 40" width="100%" height="100%"><circle cx="20" cy="20" r="10" fill="#ff9800"/><ellipse cx="20" cy="20" rx="18" ry="5" fill="none" stroke="#ffd54f" stroke-width="2.5" transform="rotate(-25 20 20)"/></svg>`
    },
    {
        id: 'rocket',
        name: 'Retro Rocket',
        color: '#ffd600',
        svg: `<svg viewBox="0 0 40 40" width="100%" height="100%"><path d="M20,6 Q27,14 26,26 L14,26 Q13,14 20,6 Z" fill="#ffd600"/><polygon points="14,26 8,30 14,22" fill="#ff5722"/><polygon points="26,26 32,30 26,22" fill="#ff5722"/><circle cx="20" cy="16" r="3" fill="#070a10"/></svg>`
    },
    {
        id: 'shield',
        name: 'Cyber Shield',
        color: '#00e676',
        svg: `<svg viewBox="0 0 40 40" width="100%" height="100%"><path d="M20,6 L32,10 L32,22 Q20,34 20,34 Q20,34 8,22 L8,10 Z" fill="#00e676" filter="drop-shadow(0 0 6px #00e676)"/><path d="M20,9 L29,12 L29,21 Q20,30 20,30 Z" fill="rgba(255,255,255,0.3)"/></svg>`
    },
    {
        id: 'atom',
        name: 'Atomic Core',
        color: '#b388ff',
        svg: `<svg viewBox="0 0 40 40" width="100%" height="100%"><circle cx="20" cy="20" r="4.5" fill="#ffffff" filter="drop-shadow(0 0 6px #b388ff)"/><ellipse cx="20" cy="20" rx="15" ry="5" fill="none" stroke="#b388ff" stroke-width="2"/><ellipse cx="20" cy="20" rx="15" ry="5" fill="none" stroke="#b388ff" stroke-width="2" transform="rotate(60 20 20)"/><ellipse cx="20" cy="20" rx="15" ry="5" fill="none" stroke="#b388ff" stroke-width="2" transform="rotate(120 20 20)"/></svg>`
    },
    {
        id: 'portal',
        name: 'Neon Portal',
        color: '#ff4081',
        svg: `<svg viewBox="0 0 40 40" width="100%" height="100%"><circle cx="20" cy="20" r="14" fill="none" stroke="#ff4081" stroke-width="3" stroke-dasharray="8 4"/><circle cx="20" cy="20" r="8" fill="none" stroke="#00e5ff" stroke-width="2.5"/><circle cx="20" cy="20" r="3" fill="#ffffff"/></svg>`
    },
    {
        id: 'star',
        name: 'Radiant Star',
        color: '#ffee58',
        svg: `<svg viewBox="0 0 40 40" width="100%" height="100%"><polygon points="20,4 24,14 34,15 26,22 29,32 20,26 11,32 14,22 6,15 16,14" fill="#ffee58" filter="drop-shadow(0 0 6px #ffee58)"/></svg>`
    },
    {
        id: 'heart',
        name: 'Cyber Heart',
        color: '#ff1744',
        svg: `<svg viewBox="0 0 40 40" width="100%" height="100%"><path d="M20,32 C10,22 6,17 6,12 C6,7 10,4 15,4 C18,4 20,7 20,7 C20,7 22,4 25,4 C30,4 34,7 34,12 C34,17 30,22 20,32 Z" fill="#ff1744" filter="drop-shadow(0 0 6px #ff1744)"/></svg>`
    },
    {
        id: 'crown',
        name: 'Neon Crown',
        color: '#ffd700',
        svg: `<svg viewBox="0 0 40 40" width="100%" height="100%"><polygon points="8,28 32,28 34,14 26,20 20,10 14,20 6,14" fill="#ffd700" filter="drop-shadow(0 0 6px #ffd700)"/><circle cx="20" cy="8" r="2" fill="#fff"/><circle cx="6" cy="12" r="2" fill="#fff"/><circle cx="34" cy="12" r="2" fill="#fff"/></svg>`
    }
];

class MemoryMatchGame {
    constructor() {
        this.gridEl = document.getElementById('cards-grid');
        this.difficulty = 'classic'; // 'easy' (6 pairs), 'classic' (8 pairs), 'expert' (10 pairs)
        this.state = 'MENU'; // 'MENU', 'PLAYING', 'PAUSED', 'VICTORY'

        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.totalPairs = 8;
        this.moves = 0;
        this.seconds = 0;
        this.timerInterval = null;
        this.isLocked = false;
        this.focusedIndex = 0;

        this.highScores = {
            easy: { moves: 0, time: 0 },
            classic: { moves: 0, time: 0 },
            expert: { moves: 0, time: 0 }
        };

        this.loadHighScores();
        this.initUI();
    }

    loadHighScores() {
        ['easy', 'classic', 'expert'].forEach(d => {
            try {
                const saved = localStorage.getItem(`memory_match_hi_${d}`);
                if (saved) this.highScores[d] = JSON.parse(saved);
            } catch (e) {}
        });
    }

    saveHighScore(diff, moves, time) {
        this.highScores[diff] = { moves, time };
        try {
            localStorage.setItem(`memory_match_hi_${diff}`, JSON.stringify(this.highScores[diff]));
        } catch (e) {}
    }

    initUI() {
        // Difficulty tabs
        document.querySelectorAll('.diff-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.diff-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.difficulty = tab.getAttribute('data-diff');
                this.updateMenuStats();
                window.memoryAudio.playClick();
            });
        });

        // Main buttons
        const btnStart = document.getElementById('btn-start-game');
        const btnPause = document.getElementById('btn-pause');
        const btnResume = document.getElementById('btn-resume');
        const btnRestart = document.getElementById('btn-restart');
        const btnPauseMenu = document.getElementById('btn-pause-menu');
        const btnWinRestart = document.getElementById('btn-win-restart');
        const btnWinMenu = document.getElementById('btn-win-menu');
        const btnSound = document.getElementById('btn-sound-toggle');

        if (btnStart) btnStart.addEventListener('click', () => { window.memoryAudio.init(); this.startGame(); });
        if (btnPause) btnPause.addEventListener('click', () => this.togglePause());
        if (btnResume) btnResume.addEventListener('click', () => this.togglePause());
        if (btnRestart) btnRestart.addEventListener('click', () => this.startGame());
        if (btnPauseMenu) btnPauseMenu.addEventListener('click', () => this.showMenu());
        if (btnWinRestart) btnWinRestart.addEventListener('click', () => this.startGame());
        if (btnWinMenu) btnWinMenu.addEventListener('click', () => this.showMenu());

        if (btnSound) {
            btnSound.addEventListener('click', () => {
                window.memoryAudio.init();
                const muted = window.memoryAudio.toggleMute();
                this.updateSoundIcon(muted);
                if (!muted) window.memoryAudio.playClick();
            });
            this.updateSoundIcon(window.memoryAudio.isMuted);
        }

        // Global Keyboard Controls
        window.addEventListener('keydown', (e) => {
            if (this.state === 'PLAYING') {
                if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.code)) {
                    e.preventDefault();
                    this.handleKeyboardNav(e.code);
                } else if (e.code === 'Enter' || e.code === 'Space') {
                    // If focus is on a card
                    const activeCard = this.cards[this.focusedIndex];
                    if (activeCard && !activeCard.isFlipped && !activeCard.isMatched) {
                        e.preventDefault();
                        this.flipCard(this.focusedIndex);
                    }
                }
            }

            if (e.key === 'r' || e.key === 'R') {
                if (this.state === 'PLAYING' || this.state === 'VICTORY' || this.state === 'PAUSED') {
                    this.startGame();
                }
            } else if (e.key === 'p' || e.key === 'P') {
                if (this.state === 'PLAYING' || this.state === 'PAUSED') {
                    this.togglePause();
                }
            } else if (e.key === 'm' || e.key === 'M') {
                window.memoryAudio.init();
                const muted = window.memoryAudio.toggleMute();
                this.updateSoundIcon(muted);
            } else if (e.key === 'Escape') {
                if (this.state === 'PLAYING' || this.state === 'PAUSED') {
                    this.togglePause();
                }
            }
        });

        this.updateMenuStats();
    }

    updateSoundIcon(isMuted) {
        const iconSpan = document.getElementById('sound-icon');
        const textSpan = document.getElementById('sound-text');
        if (iconSpan) iconSpan.textContent = isMuted ? '🔇' : '🔊';
        if (textSpan) textSpan.textContent = isMuted ? 'Muted' : 'Sound ON';
    }

    updateMenuStats() {
        const record = this.highScores[this.difficulty];
        const elBestMoves = document.getElementById('menu-best-moves');
        const elBestTime = document.getElementById('menu-best-time');
        if (elBestMoves) elBestMoves.textContent = record.moves > 0 ? `${record.moves} moves` : '--';
        if (elBestTime) elBestTime.textContent = record.time > 0 ? this.formatTime(record.time) : '--';
    }

    startGame() {
        this.state = 'PLAYING';
        this.moves = 0;
        this.matchedPairs = 0;
        this.flippedCards = [];
        this.isLocked = false;
        this.focusedIndex = 0;

        // Configure grid size
        if (this.difficulty === 'easy') {
            this.totalPairs = 6;
            this.cols = 4;
        } else if (this.difficulty === 'expert') {
            this.totalPairs = 10;
            this.cols = 5;
        } else {
            this.totalPairs = 8;
            this.cols = 4;
        }

        this.generateCards();
        this.renderGrid();

        // UI screens
        document.getElementById('screen-menu').classList.add('hidden');
        document.getElementById('screen-hud').classList.remove('hidden');
        document.getElementById('screen-pause').classList.add('hidden');
        document.getElementById('screen-victory').classList.add('hidden');

        // Reset & start timer
        this.seconds = 0;
        this.startTimer();
        this.updateHUD();

        window.memoryAudio.playClick();
    }

    generateCards() {
        const selectedIcons = MEMORY_ICONS.slice(0, this.totalPairs);
        const cardDeck = [];

        selectedIcons.forEach((icon, i) => {
            cardDeck.push({ id: `${icon.id}_1`, pairId: icon.id, name: icon.name, color: icon.color, svg: icon.svg, isFlipped: false, isMatched: false });
            cardDeck.push({ id: `${icon.id}_2`, pairId: icon.id, name: icon.name, color: icon.color, svg: icon.svg, isFlipped: false, isMatched: false });
        });

        // Fisher-Yates Shuffle
        for (let i = cardDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cardDeck[i], cardDeck[j]] = [cardDeck[j], cardDeck[i]];
        }

        this.cards = cardDeck;
    }

    renderGrid() {
        if (!this.gridEl) return;
        this.gridEl.className = `cards-grid grid-${this.difficulty}`;
        this.gridEl.innerHTML = '';

        this.cards.forEach((card, index) => {
            const cardEl = document.createElement('div');
            cardEl.className = 'memory-card';
            cardEl.id = `card-${index}`;
            cardEl.setAttribute('role', 'button');
            cardEl.setAttribute('tabindex', index === this.focusedIndex ? '0' : '-1');
            cardEl.setAttribute('aria-label', `Card ${index + 1}, Hidden`);

            cardEl.innerHTML = `
                <div class="card-inner">
                    <div class="card-face card-back">
                        <div class="card-pattern">
                            <span class="card-glyph">💠</span>
                        </div>
                    </div>
                    <div class="card-face card-front" style="border-color: ${card.color};">
                        <div class="icon-wrap">${card.svg}</div>
                        <span class="card-name">${card.name}</span>
                    </div>
                </div>
            `;

            cardEl.addEventListener('click', () => {
                window.memoryAudio.init();
                this.flipCard(index);
            });

            this.gridEl.appendChild(cardEl);
        });

        this.updateFocusIndicator();
    }

    flipCard(index) {
        if (this.state !== 'PLAYING' || this.isLocked) return;
        const card = this.cards[index];
        if (card.isFlipped || card.isMatched) return;

        // Flip card
        card.isFlipped = true;
        const cardEl = document.getElementById(`card-${index}`);
        if (cardEl) {
            cardEl.classList.add('flipped');
            cardEl.setAttribute('aria-label', `Card ${index + 1}, ${card.name}`);
        }
        this.flippedCards.push(index);
        window.memoryAudio.playFlip();

        if (this.flippedCards.length === 2) {
            this.moves++;
            this.updateHUD();
            this.checkMatch();
        }
    }

    checkMatch() {
        this.isLocked = true;
        const [idx1, idx2] = this.flippedCards;
        const card1 = this.cards[idx1];
        const card2 = this.cards[idx2];

        if (card1.pairId === card2.pairId) {
            // Match found!
            card1.isMatched = true;
            card2.isMatched = true;
            this.matchedPairs++;

            setTimeout(() => {
                const el1 = document.getElementById(`card-${idx1}`);
                const el2 = document.getElementById(`card-${idx2}`);
                if (el1) el1.classList.add('matched');
                if (el2) el2.classList.add('matched');

                window.memoryAudio.playMatch();
                this.flippedCards = [];
                this.isLocked = false;
                this.updateHUD();

                if (this.matchedPairs === this.totalPairs) {
                    this.victory();
                }
            }, 300);
        } else {
            // Mismatch: flip back after brief pause
            setTimeout(() => {
                card1.isFlipped = false;
                card2.isFlipped = false;
                const el1 = document.getElementById(`card-${idx1}`);
                const el2 = document.getElementById(`card-${idx2}`);
                if (el1) {
                    el1.classList.remove('flipped');
                    el1.setAttribute('aria-label', `Card ${idx1 + 1}, Hidden`);
                }
                if (el2) {
                    el2.classList.remove('flipped');
                    el2.setAttribute('aria-label', `Card ${idx2 + 1}, Hidden`);
                }

                window.memoryAudio.playMismatch();
                this.flippedCards = [];
                this.isLocked = false;
            }, 850);
        }
    }

    handleKeyboardNav(direction) {
        const total = this.cards.length;
        const cols = this.cols;

        if (direction === 'ArrowLeft') this.focusedIndex = (this.focusedIndex - 1 + total) % total;
        else if (direction === 'ArrowRight') this.focusedIndex = (this.focusedIndex + 1) % total;
        else if (direction === 'ArrowUp') this.focusedIndex = (this.focusedIndex - cols + total) % total;
        else if (direction === 'ArrowDown') this.focusedIndex = (this.focusedIndex + cols) % total;

        this.updateFocusIndicator();
    }

    updateFocusIndicator() {
        this.cards.forEach((_, idx) => {
            const el = document.getElementById(`card-${idx}`);
            if (el) {
                if (idx === this.focusedIndex) {
                    el.setAttribute('tabindex', '0');
                    el.focus();
                } else {
                    el.setAttribute('tabindex', '-1');
                }
            }
        });
    }

    startTimer() {
        this.stopTimer();
        this.timerInterval = setInterval(() => {
            if (this.state === 'PLAYING') {
                this.seconds++;
                this.updateHUD();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    formatTime(sec) {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }

    updateHUD() {
        const elTimer = document.getElementById('hud-timer-value');
        const elMoves = document.getElementById('hud-moves-value');
        const elPairs = document.getElementById('hud-pairs-value');

        if (elTimer) elTimer.textContent = this.formatTime(this.seconds);
        if (elMoves) elMoves.textContent = this.moves;
        if (elPairs) elPairs.textContent = `${this.matchedPairs} / ${this.totalPairs}`;
    }

    togglePause() {
        if (this.state === 'PLAYING') {
            this.state = 'PAUSED';
            this.stopTimer();
            document.getElementById('screen-pause').classList.remove('hidden');
        } else if (this.state === 'PAUSED') {
            this.state = 'PLAYING';
            this.startTimer();
            document.getElementById('screen-pause').classList.add('hidden');
        }
    }

    showMenu() {
        this.state = 'MENU';
        this.stopTimer();
        document.getElementById('screen-menu').classList.remove('hidden');
        document.getElementById('screen-hud').classList.add('hidden');
        document.getElementById('screen-pause').classList.add('hidden');
        document.getElementById('screen-victory').classList.add('hidden');
        this.updateMenuStats();
    }

    victory() {
        this.state = 'VICTORY';
        this.stopTimer();
        window.memoryAudio.playVictory();

        // Check High Score
        const currRecord = this.highScores[this.difficulty];
        const isNewRecord = currRecord.moves === 0 || this.moves < currRecord.moves || (this.moves === currRecord.moves && this.seconds < currRecord.time);
        if (isNewRecord) {
            this.saveHighScore(this.difficulty, this.moves, this.seconds);
        }

        // Accuracy calculation: perfect = totalPairs moves
        const accuracy = Math.min(100, Math.round((this.totalPairs / Math.max(this.moves, this.totalPairs)) * 100));

        // Update Victory UI
        document.getElementById('win-time').textContent = this.formatTime(this.seconds);
        document.getElementById('win-moves').textContent = this.moves;
        document.getElementById('win-accuracy').textContent = `${accuracy}%`;
        document.getElementById('win-new-record').classList.toggle('hidden', !isNewRecord);

        document.getElementById('screen-victory').classList.remove('hidden');
        document.getElementById('screen-hud').classList.add('hidden');
    }
}

window.MemoryMatchGame = MemoryMatchGame;
window.addEventListener('DOMContentLoaded', () => {
    window.memoryGame = new MemoryMatchGame();
});

