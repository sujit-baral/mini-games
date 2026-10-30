/**
 * Cyber Brick Breaker - Pure HTML5 Canvas Arcade Engine
 * Supports Mouse, Touch, and Keyboard. 100% self-contained.
 */

class CyberBrickBreaker {
    constructor() {
        this.canvas = document.getElementById('brick-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.container = document.getElementById('game-container');

        this.state = 'MENU'; // 'MENU', 'READY', 'PLAYING', 'PAUSED', 'GAME_OVER', 'LEVEL_CLEARED'
        this.score = 0;
        this.highScore = 0;
        this.lives = 3;
        this.level = 1;
        this.combo = 0;

        // Paddle
        this.paddle = {
            width: 110,
            height: 16,
            x: 0,
            y: 0,
            speed: 650,
            vx: 0,
            isWide: false,
            wideTimer: 0
        };

        // Balls
        this.balls = [];

        // Bricks
        this.bricks = [];
        this.brickRows = 5;
        this.brickCols = 8;
        this.brickPadding = 8;
        this.brickOffsetTop = 60;
        this.brickOffsetLeft = 35;

        // Particles & Powerups
        this.particles = [];
        this.powerups = [];

        // Input
        this.keys = { left: false, right: false };
        this.pointerX = null;
        this.lastTime = performance.now();

        this.loadHighScore();
        this.initUI();
        this.handleResize();

        window.addEventListener('resize', () => this.handleResize());
        window.addEventListener('orientationchange', () => setTimeout(() => this.handleResize(), 100));

        requestAnimationFrame(this.loop.bind(this));
    }

    loadHighScore() {
        try {
            const hi = localStorage.getItem('cyber_brick_hi');
            if (hi) this.highScore = parseInt(hi, 10) || 0;
        } catch (e) {}
    }

    saveHighScore() {
        try {
            localStorage.setItem('cyber_brick_hi', this.highScore.toString());
        } catch (e) {}
    }

    handleResize() {
        if (!this.container) return;
        const rect = this.container.getBoundingClientRect();
        this.width = rect.width;
        this.height = rect.height;

        this.dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.canvas.width = Math.floor(this.width * this.dpr);
        this.canvas.height = Math.floor(this.height * this.dpr);

        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(this.dpr, this.dpr);

        this.paddle.y = this.height - 35;
        if (this.state === 'READY' || this.state === 'MENU') {
            this.paddle.x = (this.width - this.paddle.width) / 2;
            if (this.balls.length > 0) {
                this.balls[0].x = this.paddle.x + this.paddle.width / 2;
                this.balls[0].y = this.paddle.y - 12;
            }
        }
    }

    initUI() {
        const btnStart = document.getElementById('btn-start-game');
        const btnPause = document.getElementById('btn-pause');
        const btnResume = document.getElementById('btn-resume');
        const btnRestart = document.getElementById('btn-restart');
        const btnGameOverRestart = document.getElementById('btn-gameover-restart');
        const btnSound = document.getElementById('btn-sound-toggle');

        if (btnStart) btnStart.addEventListener('click', () => { window.brickAudio.init(); this.startGame(); });
        if (btnPause) btnPause.addEventListener('click', () => this.togglePause());
        if (btnResume) btnResume.addEventListener('click', () => this.togglePause());
        if (btnRestart) btnRestart.addEventListener('click', () => this.startGame());
        if (btnGameOverRestart) btnGameOverRestart.addEventListener('click', () => this.startGame());

        const btnPauseMenu = document.getElementById('btn-pause-menu');
        const btnGameOverMenu = document.getElementById('btn-gameover-menu');
        if (btnPauseMenu) btnPauseMenu.addEventListener('click', () => this.showMenu());
        if (btnGameOverMenu) btnGameOverMenu.addEventListener('click', () => this.showMenu());

        if (btnSound) {
            btnSound.addEventListener('click', () => {
                window.brickAudio.init();
                const muted = window.brickAudio.toggleMute();
                this.updateSoundIcon(muted);
            });
            this.updateSoundIcon(window.brickAudio.isMuted);
        }

        // Pointer input (mouse & touch)
        const trackPointer = (clientX) => {
            const rect = this.canvas.getBoundingClientRect();
            const relX = clientX - rect.left;
            this.paddle.x = Math.max(0, Math.min(this.width - this.paddle.width, relX - this.paddle.width / 2));
            if (this.state === 'READY' && this.balls.length > 0) {
                this.balls[0].x = this.paddle.x + this.paddle.width / 2;
                this.balls[0].y = this.paddle.y - 12;
            }
        };

        this.canvas.addEventListener('pointerdown', (e) => {
            window.brickAudio.init();
            if (e.cancelable) e.preventDefault();
            trackPointer(e.clientX);
            if (this.state === 'READY') this.launchBall();
        }, { passive: false });

        window.addEventListener('pointermove', (e) => {
            if (this.state === 'PLAYING' || this.state === 'READY') {
                const rect = this.canvas.getBoundingClientRect();
                if (e.clientY >= rect.top && e.clientY <= rect.bottom + 40) {
                    trackPointer(e.clientX);
                }
            }
        }, { passive: false });

        // Keyboard Controls
        window.addEventListener('keydown', (e) => {
            if (e.code === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.left = true;
            if (e.code === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.right = true;
            if (e.code === 'Space') {
                e.preventDefault();
                window.brickAudio.init();
                if (this.state === 'READY') this.launchBall();
                else if (this.state === 'PLAYING' || this.state === 'PAUSED') this.togglePause();
            }
            if (e.key === 'r' || e.key === 'R') {
                if (this.state === 'PLAYING' || this.state === 'GAME_OVER' || this.state === 'PAUSED') {
                    this.startGame();
                }
            }
            if (e.key === 'm' || e.key === 'M') {
                window.brickAudio.init();
                const muted = window.brickAudio.toggleMute();
                this.updateSoundIcon(muted);
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.code === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.left = false;
            if (e.code === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.right = false;
        });

        this.updateHUD();
    }

    updateSoundIcon(isMuted) {
        const iconSpan = document.getElementById('sound-icon');
        const textSpan = document.getElementById('sound-text');
        if (iconSpan) iconSpan.textContent = isMuted ? '🔇' : '🔊';
        if (textSpan) textSpan.textContent = isMuted ? 'Muted' : 'Sound ON';
    }

    initBricks() {
        this.bricks = [];
        const colors = ['#e91e63', '#ff9800', '#ffeb3b', '#00e676', '#00e5ff'];
        const points = [50, 40, 30, 20, 10];

        // Total available width for bricks
        const totalPad = (this.brickCols - 1) * this.brickPadding;
        const availableW = this.width - 2 * this.brickOffsetLeft;
        const brickW = Math.max(30, (availableW - totalPad) / this.brickCols);
        const brickH = 22;

        for (let r = 0; r < this.brickRows; r++) {
            for (let c = 0; c < this.brickCols; c++) {
                this.bricks.push({
                    x: this.brickOffsetLeft + c * (brickW + this.brickPadding),
                    y: this.brickOffsetTop + r * (brickH + this.brickPadding),
                    width: brickW,
                    height: brickH,
                    color: colors[r % colors.length],
                    points: points[r % points.length],
                    alive: true
                });
            }
        }
    }

    startGame() {
        this.state = 'READY';
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.combo = 0;
        this.particles = [];
        this.powerups = [];

        this.paddle.width = 110;
        this.paddle.isWide = false;
        this.paddle.x = (this.width - this.paddle.width) / 2;
        this.paddle.y = this.height - 35;

        this.balls = [{
            x: this.paddle.x + this.paddle.width / 2,
            y: this.paddle.y - 12,
            radius: 8,
            vx: 0,
            vy: 0,
            speed: 400
        }];

        this.initBricks();

        document.getElementById('screen-menu').classList.add('hidden');
        document.getElementById('screen-hud').classList.remove('hidden');
        document.getElementById('screen-pause').classList.add('hidden');
        document.getElementById('screen-gameover').classList.add('hidden');

        this.updateHUD();
    }

    launchBall() {
        if (this.state !== 'READY' || this.balls.length === 0) return;
        this.state = 'PLAYING';
        const ball = this.balls[0];
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.8;
        ball.vx = Math.sin(angle) * ball.speed;
        ball.vy = -Math.cos(angle) * ball.speed;
        window.brickAudio.playBounce(true);
    }

    togglePause() {
        if (this.state === 'PLAYING' || this.state === 'READY') {
            this.state = 'PAUSED';
            document.getElementById('screen-pause').classList.remove('hidden');
        } else if (this.state === 'PAUSED') {
            this.state = 'PLAYING';
            this.lastTime = performance.now();
            document.getElementById('screen-pause').classList.add('hidden');
        }
    }

    showMenu() {
        this.state = 'MENU';
        this.balls = [];
        this.particles = [];
        this.powerups = [];
        document.getElementById('screen-menu').classList.remove('hidden');
        document.getElementById('screen-hud').classList.add('hidden');
        document.getElementById('screen-pause').classList.add('hidden');
        document.getElementById('screen-gameover').classList.add('hidden');
    }

    gameOver() {
        this.state = 'GAME_OVER';
        window.brickAudio.playLifeLost();

        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.saveHighScore();
        }

        const screen = document.getElementById('screen-gameover');
        document.getElementById('gameover-score').textContent = this.score;
        document.getElementById('gameover-high-score').textContent = this.highScore;
        screen.classList.remove('hidden');
        document.getElementById('screen-hud').classList.add('hidden');
    }

    updateHUD() {
        const elScore = document.getElementById('hud-score-value');
        if (elScore) elScore.textContent = this.score;

        const elLives = document.getElementById('hud-lives-value');
        if (elLives) elLives.textContent = '❤️'.repeat(Math.max(0, this.lives));

        const elLevel = document.getElementById('hud-level-value');
        if (elLevel) elLevel.textContent = this.level;
    }

    spawnParticles(x, y, color) {
        for (let i = 0; i < 14; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 60 + Math.random() * 200;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 4,
                color,
                life: 0.4 + Math.random() * 0.3,
                maxLife: 0.7
            });
        }
    }

    spawnPowerup(x, y) {
        const rand = Math.random();
        if (rand > 0.28) return; // 28% drop rate
        const types = ['WIDE', 'MULTI', 'LIFE'];
        const type = types[Math.floor(Math.random() * types.length)];
        this.powerups.push({
            x, y,
            width: 28,
            height: 16,
            vy: 140,
            type
        });
    }

    update(dt) {
        if (this.state !== 'PLAYING') return;

        // Paddle Keyboard Movement
        if (this.keys.left) this.paddle.x -= this.paddle.speed * dt;
        if (this.keys.right) this.paddle.x += this.paddle.speed * dt;
        this.paddle.x = Math.max(0, Math.min(this.width - this.paddle.width, this.paddle.x));

        // Powerup Wide Paddle timer
        if (this.paddle.isWide) {
            this.paddle.wideTimer -= dt;
            if (this.paddle.wideTimer <= 0) {
                this.paddle.isWide = false;
                this.paddle.width = 110;
            }
        }

        // Update Balls
        for (let i = this.balls.length - 1; i >= 0; i--) {
            const b = this.balls[i];
            b.x += b.vx * dt;
            b.y += b.vy * dt;

            // Wall Collisions
            if (b.x - b.radius < 0) {
                b.x = b.radius;
                b.vx = Math.abs(b.vx);
                window.brickAudio.playBounce(false);
            } else if (b.x + b.radius > this.width) {
                b.x = this.width - b.radius;
                b.vx = -Math.abs(b.vx);
                window.brickAudio.playBounce(false);
            }

            if (b.y - b.radius < 0) {
                b.y = b.radius;
                b.vy = Math.abs(b.vy);
                window.brickAudio.playBounce(false);
            }

            // Paddle Collision
            if (
                b.y + b.radius >= this.paddle.y &&
                b.y - b.radius <= this.paddle.y + this.paddle.height &&
                b.x >= this.paddle.x - 4 &&
                b.x <= this.paddle.x + this.paddle.width + 4 &&
                b.vy > 0
            ) {
                // Angle based on hit location relative to paddle center
                const hitOffset = (b.x - (this.paddle.x + this.paddle.width / 2)) / (this.paddle.width / 2);
                const maxAngle = Math.PI * 0.42;
                const bounceAngle = hitOffset * maxAngle;

                const speed = Math.hypot(b.vx, b.vy);
                b.vx = Math.sin(bounceAngle) * speed;
                b.vy = -Math.abs(Math.cos(bounceAngle) * speed);
                b.y = this.paddle.y - b.radius - 1;

                this.combo = 0; // Reset brick combo streak
                window.brickAudio.playBounce(true);
            }

            // Brick Collisions
            let remainingBricks = 0;
            this.bricks.forEach(brick => {
                if (!brick.alive) return;
                remainingBricks++;

                // AABB to circle collision
                const closestX = Math.max(brick.x, Math.min(b.x, brick.x + brick.width));
                const closestY = Math.max(brick.y, Math.min(b.y, brick.y + brick.height));
                const distX = b.x - closestX;
                const distY = b.y - closestY;

                if (distX * distX + distY * distY <= b.radius * b.radius) {
                    brick.alive = false;
                    this.combo++;
                    this.score += brick.points * Math.min(this.combo, 4);
                    this.updateHUD();

                    this.spawnParticles(closestX, closestY, brick.color);
                    this.spawnPowerup(brick.x + brick.width / 2, brick.y);
                    window.brickAudio.playBrickHit(this.combo);

                    // Bounce ball
                    if (Math.abs(distX) > Math.abs(distY)) b.vx = -b.vx;
                    else b.vy = -b.vy;
                }
            });

            // Level Cleared Check
            if (remainingBricks === 0) {
                this.level++;
                window.brickAudio.playLevelClear();
                this.initBricks();
                this.state = 'READY';
                this.balls = [{
                    x: this.paddle.x + this.paddle.width / 2,
                    y: this.paddle.y - 12,
                    radius: 8,
                    vx: 0,
                    vy: 0,
                    speed: 400 + this.level * 30
                }];
                this.updateHUD();
                return;
            }

            // Dropped Ball Check
            if (b.y - b.radius > this.height) {
                this.balls.splice(i, 1);
            }
        }

        // If all balls lost
        if (this.balls.length === 0) {
            this.lives--;
            this.updateHUD();
            window.brickAudio.playLifeLost();

            if (this.lives <= 0) {
                this.gameOver();
                return;
            } else {
                this.state = 'READY';
                this.paddle.x = (this.width - this.paddle.width) / 2;
                this.balls = [{
                    x: this.paddle.x + this.paddle.width / 2,
                    y: this.paddle.y - 12,
                    radius: 8,
                    vx: 0,
                    vy: 0,
                    speed: 400 + (this.level - 1) * 30
                }];
            }
        }

        // Update Powerups
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const p = this.powerups[i];
            p.y += p.vy * dt;

            // Paddle Catch
            if (
                p.y + p.height >= this.paddle.y &&
                p.y <= this.paddle.y + this.paddle.height &&
                p.x + p.width >= this.paddle.x &&
                p.x <= this.paddle.x + this.paddle.width
            ) {
                this.applyPowerup(p.type);
                this.powerups.splice(i, 1);
                window.brickAudio.playPowerup();
            } else if (p.y > this.height + 20) {
                this.powerups.splice(i, 1);
            }
        }

        // Update Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const pt = this.particles[i];
            pt.x += pt.vx * dt;
            pt.y += pt.vy * dt;
            pt.life -= dt;
            if (pt.life <= 0) this.particles.splice(i, 1);
        }
    }

    applyPowerup(type) {
        if (type === 'WIDE') {
            this.paddle.isWide = true;
            this.paddle.width = 160;
            this.paddle.wideTimer = 12.0;
        } else if (type === 'MULTI') {
            if (this.balls.length > 0) {
                const b = this.balls[0];
                this.balls.push({
                    x: b.x, y: b.y,
                    radius: b.radius,
                    vx: -b.vx + (Math.random() - 0.5) * 80,
                    vy: b.vy,
                    speed: b.speed
                });
                this.balls.push({
                    x: b.x, y: b.y,
                    radius: b.radius,
                    vx: b.vx + (Math.random() - 0.5) * 80,
                    vy: -Math.abs(b.vy),
                    speed: b.speed
                });
            }
        } else if (type === 'LIFE') {
            this.lives = Math.min(5, this.lives + 1);
            this.updateHUD();
        }
    }

    draw() {
        const ctx = this.ctx;
        const W = this.width;
        const H = this.height;

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.save();
        ctx.scale(this.dpr, this.dpr);

        // Cyber Grid Background
        ctx.fillStyle = '#0a0d14';
        ctx.fillRect(0, 0, W, H);

        ctx.strokeStyle = 'rgba(0, 229, 255, 0.04)';
        ctx.lineWidth = 1;
        const step = 40;
        for (let x = 0; x < W; x += step) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, H);
            ctx.stroke();
        }
        for (let y = 0; y < H; y += step) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(W, y);
            ctx.stroke();
        }

        // Draw Bricks
        this.bricks.forEach(b => {
            if (!b.alive) return;
            ctx.save();
            ctx.fillStyle = b.color;
            ctx.shadowColor = b.color;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.roundRect ? ctx.roundRect(b.x, b.y, b.width, b.height, 4) : ctx.rect(b.x, b.y, b.width, b.height);
            ctx.fill();

            // Inner gloss
            ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
            ctx.fillRect(b.x + 2, b.y + 2, b.width - 4, 3);
            ctx.restore();
        });

        // Draw Paddle
        ctx.save();
        const padGrad = ctx.createLinearGradient(this.paddle.x, 0, this.paddle.x + this.paddle.width, 0);
        padGrad.addColorStop(0, '#00e5ff');
        padGrad.addColorStop(0.5, '#ffffff');
        padGrad.addColorStop(1, '#00e5ff');
        ctx.fillStyle = padGrad;
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height, 8) : ctx.rect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);
        ctx.fill();
        ctx.restore();

        // Draw Balls
        this.balls.forEach(b => {
            ctx.save();
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#00e5ff';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        // Draw Powerups
        this.powerups.forEach(p => {
            ctx.save();
            ctx.fillStyle = p.type === 'WIDE' ? '#ff9100' : (p.type === 'MULTI' ? '#00e5ff' : '#00e676');
            ctx.shadowColor = ctx.fillStyle;
            ctx.shadowBlur = 8;
            ctx.fillRect(p.x, p.y, p.width, p.height);

            ctx.fillStyle = '#111';
            ctx.font = '900 10px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(p.type === 'WIDE' ? 'W' : (p.type === 'MULTI' ? 'M' : '+1'), p.x + p.width / 2, p.y + p.height / 2);
            ctx.restore();
        });

        // Draw Particles
        this.particles.forEach(pt => {
            ctx.save();
            ctx.fillStyle = pt.color;
            ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
            ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
            ctx.restore();
        });

        // Launch prompt in READY state
        if (this.state === 'READY') {
            ctx.save();
            ctx.font = '800 16px "Montserrat", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.fillText('Tap Screen or Press [Space] to Launch Ball', W / 2, this.paddle.y - 45);
            ctx.restore();
        }

        ctx.restore();
    }

    loop(timestamp) {
        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
        this.lastTime = timestamp;

        this.update(dt);
        this.draw();

        requestAnimationFrame(this.loop.bind(this));
    }
}

window.CyberBrickBreaker = CyberBrickBreaker;
window.addEventListener('DOMContentLoaded', () => {
    window.brickGame = new CyberBrickBreaker();
});

