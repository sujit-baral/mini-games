/**
 * Fruit Slice Arcade - Main Game Engine
 * Coordinates state machine, physics loops, fruit spawners, combo detection,
 * responsive canvas scaling, and UI event bindings.
 */

class FruitSliceGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        // Core systems
        this.pm = new window.ParticleManager();
        this.blade = new window.BladeTrail(this.canvas, this.pm);

        // Game state
        this.state = 'MENU'; // 'MENU', 'PLAYING', 'PAUSED', 'GAME_OVER'
        this.mode = 'CLASSIC'; // 'CLASSIC' or 'ARCADE'
        this.score = 0;
        this.highScores = {
            CLASSIC: 0,
            ARCADE: 0
        };
        this.strikes = 0;
        this.maxStrikes = 3;
        this.timeLeft = 60; // Arcade mode timer (seconds)
        this.fruitsSliced = 0;
        this.maxCombo = 0;
        this.bombsAvoided = 0;

        // Wave spawner variables
        this.items = []; // Active fruits and bombs
        this.halves = []; // Sliced fruit halves
        this.spawnTimer = 0;
        this.spawnInterval = 2.2;
        this.difficulty = 1.0;

        // Combo tracker
        this.currentSwipeCombo = 0;
        this.comboResetTimer = null;
        this.lastSliceTime = 0;

        // Visual effects
        this.redBottomFlash = 0; // Flash red when fruit is dropped
        this.lastFrameTime = performance.now();

        // Load persisted high scores
        this.loadSettings();

        // Responsive resize & event bindings
        this.handleResize = this.handleResize.bind(this);
        window.addEventListener('resize', this.handleResize);
        window.addEventListener('orientationchange', () => setTimeout(this.handleResize, 100));

        this.initUI();
        this.handleResize();

        // Start render loop
        requestAnimationFrame(this.loop.bind(this));
    }

    loadSettings() {
        try {
            const savedClassic = localStorage.getItem('fruit_slice_hi_classic');
            if (savedClassic) this.highScores.CLASSIC = parseInt(savedClassic, 10) || 0;

            const savedArcade = localStorage.getItem('fruit_slice_hi_arcade');
            if (savedArcade) this.highScores.ARCADE = parseInt(savedArcade, 10) || 0;
        } catch (e) {
            console.warn('LocalStorage not available');
        }
    }

    saveHighScores() {
        try {
            localStorage.setItem('fruit_slice_hi_classic', this.highScores.CLASSIC.toString());
            localStorage.setItem('fruit_slice_hi_arcade', this.highScores.ARCADE.toString());
        } catch (e) {}
    }

    handleResize() {
        const container = document.getElementById('game-container');
        if (!container) return;

        this.dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2 for optimal mobile 60fps
        const rect = container.getBoundingClientRect();

        this.width = rect.width;
        this.height = rect.height;

        this.canvas.width = Math.floor(this.width * this.dpr);
        this.canvas.height = Math.floor(this.height * this.dpr);

        // Normalize context coordinate system to CSS pixels
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(this.dpr, this.dpr);
    }

    initUI() {
        // Mode buttons
        const btnClassic = document.getElementById('btn-mode-classic');
        const btnArcade = document.getElementById('btn-mode-arcade');
        const btnStart = document.getElementById('btn-start-game');
        const btnPause = document.getElementById('btn-pause');
        const btnResume = document.getElementById('btn-resume');
        const btnRestart = document.getElementById('btn-restart');
        const btnGameOverRestart = document.getElementById('btn-gameover-restart');
        const btnGameOverMenu = document.getElementById('btn-gameover-menu');
        const btnSound = document.getElementById('btn-sound-toggle');
        const btnHelp = document.getElementById('btn-help');
        const btnCloseHelp = document.getElementById('btn-close-help');
        const btnStartDialog = document.getElementById('btn-start-dialog');

        if (btnClassic) {
            btnClassic.addEventListener('click', () => {
                this.selectMode('CLASSIC');
                window.soundCtrl.playClick();
            });
        }

        if (btnArcade) {
            btnArcade.addEventListener('click', () => {
                this.selectMode('ARCADE');
                window.soundCtrl.playClick();
            });
        }

        if (btnStart) {
            btnStart.addEventListener('click', () => {
                window.soundCtrl.init();
                window.soundCtrl.playClick();
                this.startGame();
            });
        }

        if (btnPause) {
            btnPause.addEventListener('click', () => {
                this.togglePause();
            });
        }

        if (btnResume) {
            btnResume.addEventListener('click', () => {
                window.soundCtrl.playClick();
                this.togglePause();
            });
        }

        if (btnRestart) {
            btnRestart.addEventListener('click', () => {
                window.soundCtrl.playClick();
                this.startGame();
            });
        }

        const btnPauseMenu = document.getElementById('btn-pause-menu');
        if (btnPauseMenu) {
            btnPauseMenu.addEventListener('click', () => {
                window.soundCtrl.playClick();
                this.showMenu();
            });
        }

        if (btnGameOverRestart) {
            btnGameOverRestart.addEventListener('click', () => {
                window.soundCtrl.playClick();
                this.startGame();
            });
        }

        if (btnGameOverMenu) {
            btnGameOverMenu.addEventListener('click', () => {
                window.soundCtrl.playClick();
                this.showMenu();
            });
        }

        if (btnSound) {
            btnSound.addEventListener('click', () => {
                window.soundCtrl.init();
                const isMuted = window.soundCtrl.toggleMute();
                this.updateSoundIcon(isMuted);
                if (!isMuted) window.soundCtrl.playClick();
            });
            this.updateSoundIcon(window.soundCtrl.isMuted);
        }

        if (btnHelp) {
            btnHelp.addEventListener('click', () => {
                window.soundCtrl.playClick();
                this.showHelpModal(true);
            });
        }

        if (btnCloseHelp) {
            btnCloseHelp.addEventListener('click', () => {
                window.soundCtrl.playClick();
                this.showHelpModal(false);
            });
        }

        if (btnStartDialog) {
            btnStartDialog.addEventListener('click', () => {
                window.soundCtrl.playClick();
                this.showHelpModal(false);
            });
        }

        // Keyboard Shortcuts
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.key === 'p' || e.key === 'P') {
                if (this.state === 'PLAYING' || this.state === 'PAUSED') {
                    e.preventDefault();
                    this.togglePause();
                }
            } else if (e.key === 'r' || e.key === 'R') {
                if (this.state === 'PLAYING' || this.state === 'GAME_OVER' || this.state === 'PAUSED') {
                    e.preventDefault();
                    this.startGame();
                }
            } else if (e.key === 'm' || e.key === 'M') {
                window.soundCtrl.init();
                const isMuted = window.soundCtrl.toggleMute();
                this.updateSoundIcon(isMuted);
            } else if (e.key === 'Escape') {
                const helpModal = document.getElementById('help-modal');
                if (helpModal && !helpModal.classList.contains('hidden')) {
                    this.showHelpModal(false);
                } else if (this.state === 'PLAYING' || this.state === 'PAUSED') {
                    this.togglePause();
                }
            }
        });

        // First-time instruction overlay check
        try {
            const hasSeenHelp = localStorage.getItem('fruit_slice_has_seen_help');
            if (!hasSeenHelp) {
                this.showHelpModal(true);
                localStorage.setItem('fruit_slice_has_seen_help', 'true');
            }
        } catch (e) {}

        this.updateHUD();
    }

    updateSoundIcon(isMuted) {
        const iconSpan = document.getElementById('sound-icon');
        const textSpan = document.getElementById('sound-text');
        if (iconSpan) {
            iconSpan.textContent = isMuted ? '🔇' : '🔊';
        }
        if (textSpan) {
            textSpan.textContent = isMuted ? 'Muted' : 'Sound ON';
        }
    }

    selectMode(mode) {
        this.mode = mode;
        const btnClassic = document.getElementById('btn-mode-classic');
        const btnArcade = document.getElementById('btn-mode-arcade');
        if (btnClassic && btnArcade) {
            btnClassic.classList.toggle('active', mode === 'CLASSIC');
            btnArcade.classList.toggle('active', mode === 'ARCADE');
        }
        const hiScoreDisplay = document.getElementById('menu-high-score');
        if (hiScoreDisplay) {
            hiScoreDisplay.textContent = this.highScores[this.mode];
        }
        const modeDesc = document.getElementById('mode-description');
        if (modeDesc) {
            modeDesc.textContent = mode === 'CLASSIC'
                ? 'Classic Mode: 3 strikes allowed. Missed fruits cost lives. Slicing a bomb is instant game over!'
                : 'Arcade Mode: 60-second frenzy! Missed fruits are free. Bombs penalize -10 pts. High combo bonuses!';
        }
    }

    showHelpModal(show) {
        const modal = document.getElementById('help-modal');
        if (modal) {
            modal.classList.toggle('hidden', !show);
        }
    }

    showMenu() {
        this.state = 'MENU';
        this.items = [];
        this.halves = [];
        this.blade.reset();
        document.getElementById('screen-menu').classList.remove('hidden');
        document.getElementById('screen-hud').classList.add('hidden');
        document.getElementById('screen-pause').classList.add('hidden');
        document.getElementById('screen-gameover').classList.add('hidden');
        this.selectMode(this.mode);
    }

    startGame() {
        this.state = 'PLAYING';
        this.score = 0;
        this.strikes = 0;
        this.timeLeft = 60;
        this.difficulty = 1.0;
        this.fruitsSliced = 0;
        this.maxCombo = 0;
        this.bombsAvoided = 0;
        this.spawnTimer = 1.0; // First wave arrives in 1s
        this.items = [];
        this.halves = [];
        this.currentSwipeCombo = 0;
        this.blade.reset();
        this.pm.reset();

        // UI screens
        document.getElementById('screen-menu').classList.add('hidden');
        document.getElementById('screen-hud').classList.remove('hidden');
        document.getElementById('screen-pause').classList.add('hidden');
        document.getElementById('screen-gameover').classList.add('hidden');

        // Mode specific HUD toggle
        const strikesContainer = document.getElementById('hud-strikes');
        const timerContainer = document.getElementById('hud-timer');
        if (strikesContainer && timerContainer) {
            if (this.mode === 'CLASSIC') {
                strikesContainer.classList.remove('hidden');
                timerContainer.classList.add('hidden');
            } else {
                strikesContainer.classList.add('hidden');
                timerContainer.classList.remove('hidden');
            }
        }

        this.updateHUD();
        window.soundCtrl.playGameStart();
    }

    togglePause() {
        if (this.state === 'PLAYING') {
            this.state = 'PAUSED';
            document.getElementById('screen-pause').classList.remove('hidden');
        } else if (this.state === 'PAUSED') {
            this.state = 'PLAYING';
            this.lastFrameTime = performance.now();
            document.getElementById('screen-pause').classList.add('hidden');
        }
    }

    gameOver(reason = 'strikes') {
        if (this.state === 'GAME_OVER') return;
        this.state = 'GAME_OVER';

        window.soundCtrl.playGameOver();

        const isNewRecord = this.score > this.highScores[this.mode];
        if (isNewRecord) {
            this.highScores[this.mode] = this.score;
            this.saveHighScores();
        }

        // Update Game Over UI
        const screenGameOver = document.getElementById('screen-gameover');
        const elFinalScore = document.getElementById('gameover-score');
        const elHighScore = document.getElementById('gameover-high-score');
        const elNewBadge = document.getElementById('gameover-new-record');
        const elStatsFruits = document.getElementById('stat-fruits');
        const elStatsCombo = document.getElementById('stat-combo');
        const elReason = document.getElementById('gameover-reason');

        if (elFinalScore) elFinalScore.textContent = this.score;
        if (elHighScore) elHighScore.textContent = this.highScores[this.mode];
        if (elNewBadge) elNewBadge.classList.toggle('hidden', !isNewRecord);
        if (elStatsFruits) elStatsFruits.textContent = this.fruitsSliced;
        if (elStatsCombo) elStatsCombo.textContent = `${this.maxCombo}x`;

        if (elReason) {
            if (reason === 'bomb') {
                elReason.textContent = 'BOOM! You sliced an explosive bomb!';
            } else if (reason === 'timeout') {
                elReason.textContent = "Time's up! Great frenzy session!";
            } else {
                elReason.textContent = '3 Fruits dropped! Better slice faster!';
            }
        }

        screenGameOver.classList.remove('hidden');
        document.getElementById('screen-hud').classList.add('hidden');
    }

    updateHUD() {
        const scoreVal = document.getElementById('hud-score-value');
        if (scoreVal) scoreVal.textContent = this.score;

        // Strikes
        if (this.mode === 'CLASSIC') {
            for (let i = 1; i <= 3; i++) {
                const strikeEl = document.getElementById(`strike-${i}`);
                if (strikeEl) {
                    strikeEl.classList.toggle('active', i <= this.strikes);
                }
            }
        } else {
            // Arcade Timer
            const timerVal = document.getElementById('hud-timer-value');
            if (timerVal) {
                timerVal.textContent = Math.ceil(this.timeLeft);
                if (this.timeLeft <= 10) {
                    timerVal.classList.add('urgent');
                } else {
                    timerVal.classList.remove('urgent');
                }
            }
        }
    }

    spawnWave() {
        const W = this.width;
        const H = this.height;

        // Number of items in this wave
        let count = 1;
        const rand = Math.random();
        if (this.mode === 'ARCADE') {
            // Frenzy waves: 3 to 7 items
            count = 2 + Math.floor(Math.random() * 4);
            if (Math.random() < 0.2) count = 6; // Mega frenzy!
        } else {
            // Classic mode: 1 to 4 items scaling with difficulty
            if (this.difficulty > 2.0 && rand < 0.4) count = 3 + Math.floor(Math.random() * 2);
            else if (this.difficulty > 1.3 && rand < 0.6) count = 2 + Math.floor(Math.random() * 2);
            else if (rand < 0.7) count = 2;
        }

        const fruitKeys = Object.keys(window.FRUIT_TYPES);
        let bombSpawned = false;

        for (let i = 0; i < count; i++) {
            // Stagger position across bottom
            const minX = W * 0.15;
            const maxX = W * 0.85;
            const x = minX + Math.random() * (maxX - minX);
            const y = H + 45 + i * 20;

            // Target towards screen upper half
            const targetX = W * 0.3 + Math.random() * (W * 0.4);
            const peakHeight = H * (0.18 + Math.random() * 0.35); // Arcs to upper 18-50% of screen

            // Physics calculation for ballistic toss:
            // v_y^2 = 2 * g * delta_h -> v_y = -sqrt(2 * 800 * (y - peakHeight))
            const g = 800;
            const deltaH = y - peakHeight;
            const vy = -Math.sqrt(2 * g * Math.max(deltaH, 150));
            const timeToApex = Math.abs(vy) / g;
            const vx = (targetX - x) / (timeToApex * (1.2 + Math.random() * 0.6));

            // Decide if bomb or fruit
            const bombChance = this.mode === 'ARCADE' ? 0.22 : Math.min(0.35, 0.12 * this.difficulty);
            const shouldSpawnBomb = !bombSpawned && Math.random() < bombChance && this.score > 2;

            if (shouldSpawnBomb) {
                this.items.push(new window.BombItem(x, y, vx, vy));
                bombSpawned = true;
            } else {
                const typeKey = fruitKeys[Math.floor(Math.random() * fruitKeys.length)];
                this.items.push(new window.FruitItem(typeKey, x, y, vx, vy));
            }
        }
    }

    handleSliceCollision() {
        const now = performance.now() / 1000;
        let slicedThisFrame = 0;

        // Check slice collision if blade trail has points
        if (this.blade.points.length >= 2) {
            for (let i = this.items.length - 1; i >= 0; i--) {
                const item = this.items[i];
                const sliceHit = this.blade.checkSlice(item);

                if (sliceHit) {
                    if (item.isBomb) {
                        // Detonate bomb
                        this.items.splice(i, 1);
                        this.pm.addBombExplosion(item.x, item.y);
                        window.soundCtrl.playExplosion();

                        if (this.mode === 'CLASSIC') {
                            this.gameOver('bomb');
                            return;
                        } else {
                            // Arcade mode bomb penalty
                            this.score = Math.max(0, this.score - 10);
                            this.currentSwipeCombo = 0;
                            this.pm.addFloatingText('BOMB! -10', item.x, item.y - 20, '#ff1744', 32, true);
                            this.updateHUD();
                        }
                    } else {
                        // Sliced a fruit!
                        this.items.splice(i, 1);
                        this.fruitsSliced++;
                        slicedThisFrame++;
                        this.currentSwipeCombo++;
                        this.lastSliceTime = now;

                        // Spawn fruit halves
                        const halves = item.slice(sliceHit.cutAngle);
                        this.halves.push(...halves);

                        // Juice explosion and splatter
                        this.pm.addJuiceExplosion(item.x, item.y, item.type, item.vx, item.vy);

                        // Audio and score
                        const basePts = item.type.points;
                        this.score += basePts;
                        window.soundCtrl.playSlice(1.0 + (this.currentSwipeCombo - 1) * 0.15);

                        // Floating point indicator
                        this.pm.addFloatingText(`+${basePts}`, item.x, item.y, '#ffffff', 24);

                        this.updateHUD();
                    }
                }
            }

            // Track max combo
            if (this.currentSwipeCombo > this.maxCombo) {
                this.maxCombo = this.currentSwipeCombo;
            }
        }

        // Finalize combo when swipe finishes or after inactivity window
        if (!this.blade.isSwiping) {
            if (this.currentSwipeCombo >= 2) {
                this.awardCombo(this.currentSwipeCombo);
            }
            this.currentSwipeCombo = 0;
        } else if (now - this.lastSliceTime > 0.35 && this.currentSwipeCombo > 0) {
            if (this.currentSwipeCombo >= 2) {
                this.awardCombo(this.currentSwipeCombo);
            }
            this.currentSwipeCombo = 0;
        }
    }

    awardCombo(combo) {
        let bonus = 0;
        let label = '';
        let color = '#ffeb3b';

        if (combo === 2) {
            bonus = 2;
            label = 'DOUBLE! +2';
            color = '#80d8ff';
        } else if (combo === 3) {
            bonus = 5;
            label = '3x COMBO! +5';
            color = '#ffd600';
        } else if (combo === 4) {
            bonus = 10;
            label = 'MEGA 4x! +10';
            color = '#ff9100';
        } else if (combo >= 5) {
            bonus = 20;
            label = `BLITZ ${combo}x! +20`;
            color = '#ff1744';
        }

        if (bonus > 0) {
            this.score += bonus;
            window.soundCtrl.playCombo(combo);
            const cx = this.width * 0.5;
            const cy = this.height * 0.35;
            this.pm.addFloatingText(label, cx, cy, color, 36, true);
            this.updateHUD();
        }
    }

    update(dt) {
        if (this.state !== 'PLAYING') {
            this.blade.update();
            this.pm.update(dt);
            return;
        }

        // Gradually increase difficulty
        this.difficulty = 1.0 + this.score * 0.035;

        // Arcade countdown timer
        if (this.mode === 'ARCADE') {
            this.timeLeft -= dt;
            if (this.timeLeft <= 0) {
                this.timeLeft = 0;
                this.updateHUD();
                this.gameOver('timeout');
                return;
            }
            this.updateHUD();
        }

        // Wave spawner countdown
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
            this.spawnWave();
            // Variable interval based on mode & difficulty
            const baseInterval = this.mode === 'ARCADE' ? 1.5 : Math.max(1.1, 2.3 - this.difficulty * 0.25);
            this.spawnTimer = baseInterval + Math.random() * 0.6;
        }

        // Update items (fruits and bombs)
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            item.update(dt);

            // Check if dropped off screen
            if (item.y > this.height + 60 && item.vy > 0) {
                this.items.splice(i, 1);

                if (!item.isBomb && this.mode === 'CLASSIC') {
                    // Missed a fruit in Classic mode! Strike!
                    this.strikes++;
                    this.redBottomFlash = 0.3; // Flash bottom edge red
                    window.soundCtrl.playStrike();
                    this.updateHUD();

                    if (this.strikes >= this.maxStrikes) {
                        this.gameOver('strikes');
                        return;
                    }
                } else if (item.isBomb) {
                    this.bombsAvoided++;
                }
            }
        }

        // Update sliced halves
        for (let i = this.halves.length - 1; i >= 0; i--) {
            const half = this.halves[i];
            half.update(dt);
            if (half.y > this.height + 80) {
                this.halves.splice(i, 1);
            }
        }

        // Blade & particles
        this.blade.update();
        this.handleSliceCollision();
        this.pm.update(dt);

        // Flash timer decay
        if (this.redBottomFlash > 0) {
            this.redBottomFlash = Math.max(0, this.redBottomFlash - dt);
        }
    }

    draw() {
        const ctx = this.ctx;
        const W = this.width;
        const H = this.height;

        // Reset transform to physical pixels to cleanly wipe entire canvas
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Reapply DPR scaling and optional screen shake
        ctx.save();
        ctx.scale(this.dpr || 1, this.dpr || 1);
        if (this.pm.screenShake > 0) {
            const shakeMagnitude = this.pm.screenShake * 18;
            const sx = (Math.random() - 0.5) * shakeMagnitude;
            const sy = (Math.random() - 0.5) * shakeMagnitude;
            ctx.translate(sx, sy);
        }

        // 1. Dojo Wood / Bamboo Arcade Board Background
        this.drawBackground(ctx, W, H);

        // 2. Splatter stains layer (organic fruit stains directly on board)
        this.pm.drawSplatters(ctx);

        // 3. Falling fruit halves
        this.halves.forEach(h => h.draw(ctx));

        // 4. Active whole fruits and bombs
        this.items.forEach(item => item.draw(ctx));

        // 5. Juice droplets, sparks, and explosion shockwaves
        this.pm.drawEffects(ctx);

        // 6. Glowing arcade blade trail
        this.blade.draw(ctx);

        // 7. Red bottom danger flash on dropped fruit
        if (this.redBottomFlash > 0) {
            const flashAlpha = this.redBottomFlash / 0.3;
            const grad = ctx.createLinearGradient(0, H - 90, 0, H);
            grad.addColorStop(0, 'rgba(255, 0, 0, 0)');
            grad.addColorStop(1, `rgba(255, 23, 68, ${flashAlpha * 0.65})`);
            ctx.fillStyle = grad;
            ctx.fillRect(0, H - 90, W, 90);
        }

        ctx.restore();
    }

    /**
     * Draws rich procedural polished woodgrain dojo background.
     */
    drawBackground(ctx, W, H) {
        // Base dark warm wood gradient
        const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
        bgGrad.addColorStop(0, '#1c1511');
        bgGrad.addColorStop(0.5, '#281c15');
        bgGrad.addColorStop(1, '#18120d');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);

        // Vertical plank seams
        const plankCount = Math.max(5, Math.floor(W / 140));
        const plankWidth = W / plankCount;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.lineWidth = 2;

        for (let i = 1; i < plankCount; i++) {
            const px = i * plankWidth;
            ctx.beginPath();
            ctx.moveTo(px, 0);
            ctx.lineTo(px, H);
            ctx.stroke();

            // Plank edge highlight
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
            ctx.beginPath();
            ctx.moveTo(px + 1, 0);
            ctx.lineTo(px + 1, H);
            ctx.stroke();
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
        }

        // Dojo ambient radial lighting
        const radialGlow = ctx.createRadialGradient(W * 0.5, H * 0.4, 60, W * 0.5, H * 0.4, W * 0.7);
        radialGlow.addColorStop(0, 'rgba(255, 183, 77, 0.09)');
        radialGlow.addColorStop(0.7, 'rgba(0, 0, 0, 0.25)');
        radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0.65)');
        ctx.fillStyle = radialGlow;
        ctx.fillRect(0, 0, W, H);
    }

    loop(timestamp) {
        const dt = Math.min((timestamp - this.lastFrameTime) / 1000, 0.1); // Max delta clamp 100ms
        this.lastFrameTime = timestamp;

        this.update(dt);
        this.draw();

        requestAnimationFrame(this.loop.bind(this));
    }
}

// Export class to window
window.FruitSliceGame = FruitSliceGame;

// Instantiate game on page load
window.addEventListener('DOMContentLoaded', () => {
    window.game = new FruitSliceGame();
});

