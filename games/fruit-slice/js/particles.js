/**
 * Particle Effects & Juice Splatter System
 * Manages juice droplets, wall splatters, blade sparks, explosion bursts, and floating score popups.
 */

class JuiceParticle {
    constructor(x, y, color, baseVx, baseVy) {
        this.x = x;
        this.y = y;
        this.color = color;
        const angle = Math.random() * Math.PI * 2;
        const speed = 120 + Math.random() * 320;
        this.vx = (baseVx || 0) * 0.4 + Math.cos(angle) * speed;
        this.vy = (baseVy || 0) * 0.4 + Math.sin(angle) * speed;
        this.radius = 2.5 + Math.random() * 3.5;
        this.gravity = 750;
        this.drag = 0.96;
        this.life = 0.45 + Math.random() * 0.35;
        this.maxLife = this.life;
    }

    update(dt) {
        this.vx *= Math.pow(this.drag, dt * 60);
        this.vy *= Math.pow(this.drag, dt * 60);
        this.vy += this.gravity * dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
    }

    draw(ctx) {
        if (this.life <= 0) return;
        const progress = this.life / this.maxLife;
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.globalAlpha = Math.max(0, progress);

        // Slight speed stretch (motion streak)
        const speed = Math.hypot(this.vx, this.vy);
        if (speed > 50) {
            const angle = Math.atan2(this.vy, this.vx);
            ctx.translate(this.x, this.y);
            ctx.rotate(angle);
            ctx.beginPath();
            ctx.ellipse(0, 0, this.radius * (1 + speed * 0.004), this.radius * 0.7, 0, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * progress, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

class SplatterStain {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = 18 + Math.random() * 24;
        this.alpha = 0.45;
        this.decay = 0.025; // Fades slowly
        // Pre-generate irregular organic droplets
        this.drops = [];
        const count = 5 + Math.floor(Math.random() * 6);
        for (let i = 0; i < count; i++) {
            const a = Math.random() * Math.PI * 2;
            const dist = (0.3 + Math.random() * 0.9) * this.radius;
            this.drops.push({
                dx: Math.cos(a) * dist,
                dy: Math.sin(a) * dist,
                r: 3 + Math.random() * 6
            });
        }
    }

    update(dt) {
        this.alpha -= this.decay * dt;
    }

    draw(ctx) {
        if (this.alpha <= 0) return;
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.globalAlpha = Math.max(0, this.alpha);

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.7, 0, Math.PI * 2);
        ctx.fill();

        this.drops.forEach(d => {
            ctx.beginPath();
            ctx.arc(this.x + d.dx, this.y + d.dy, d.r, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.restore();
    }
}

class BladeSpark {
    constructor(x, y, vx, vy) {
        this.x = x;
        this.y = y;
        this.vx = (vx || 0) * 0.2 + (Math.random() - 0.5) * 80;
        this.vy = (vy || 0) * 0.2 + (Math.random() - 0.5) * 80;
        this.radius = 1.5 + Math.random() * 2;
        this.life = 0.2 + Math.random() * 0.15;
        this.maxLife = this.life;
        this.color = Math.random() < 0.6 ? '#ffffff' : '#ffd54f';
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
    }

    draw(ctx) {
        if (this.life <= 0) return;
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class FloatingText {
    constructor(text, x, y, color = '#ffffff', fontSize = 26, isSpecial = false) {
        this.text = text;
        this.x = x;
        this.y = y;
        this.color = color;
        this.fontSize = fontSize;
        this.isSpecial = isSpecial;
        this.vy = -70;
        this.life = 0.85;
        this.maxLife = this.life;
        this.scale = 0.4;
    }

    update(dt) {
        this.y += this.vy * dt;
        this.life -= dt;
        // Bounce scale in first 150ms
        const progress = 1 - this.life / this.maxLife;
        if (progress < 0.25) {
            this.scale = 0.5 + (progress / 0.25) * 0.7; // Pops to 1.2
        } else {
            this.scale = 1.2 - ((progress - 0.25) / 0.75) * 0.2; // Settles to 1.0
        }
    }

    draw(ctx) {
        if (this.life <= 0) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);
        ctx.globalAlpha = Math.min(1, this.life / 0.35);

        ctx.font = `900 ${this.fontSize}px 'Montserrat', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Outer dark stroke
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.lineWidth = 5;
        ctx.lineJoin = 'round';
        ctx.strokeText(this.text, 0, 0);

        // Fill with bright color
        ctx.fillStyle = this.color;
        if (this.isSpecial) {
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 12;
        }
        ctx.fillText(this.text, 0, 0);

        ctx.restore();
    }
}

class ExplosionEffect {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 10;
        this.maxRadius = 240;
        this.ringSpeed = 450;
        this.life = 0.65;
        this.maxLife = this.life;

        // Blast fire particles
        this.particles = [];
        const count = 35;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 140 + Math.random() * 450;
            const isFire = Math.random() < 0.65;
            this.particles.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 4 + Math.random() * 8,
                color: isFire ? (Math.random() < 0.5 ? '#ff5722' : '#ffeb3b') : '#424242',
                life: 0.4 + Math.random() * 0.3,
                maxLife: 0.7
            });
        }
    }

    update(dt) {
        this.life -= dt;
        this.radius += this.ringSpeed * dt;

        this.particles.forEach(p => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vx *= 0.94;
            p.vy *= 0.94;
            p.life -= dt;
        });
    }

    draw(ctx) {
        if (this.life <= 0) return;
        const alpha = Math.max(0, this.life / this.maxLife);

        ctx.save();
        // Expanding shockwave ring
        ctx.strokeStyle = `rgba(255, 120, 0, ${alpha * 0.9})`;
        ctx.lineWidth = 6 * alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();

        // Blast sparks and smoke
        this.particles.forEach(p => {
            if (p.life <= 0) return;
            const pAlpha = Math.max(0, p.life / p.maxLife);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = pAlpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius * pAlpha, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.restore();
    }
}

/**
 * Main Particle Controller Manager
 */
class ParticleManager {
    constructor() {
        this.juices = [];
        this.splatters = [];
        this.sparks = [];
        this.texts = [];
        this.explosions = [];
        this.screenShake = 0;
    }

    reset() {
        this.juices = [];
        this.splatters = [];
        this.sparks = [];
        this.texts = [];
        this.explosions = [];
        this.screenShake = 0;
    }

    addJuiceExplosion(x, y, fruitType, vx, vy) {
        // Splatter stain on board
        if (this.splatters.length > 25) this.splatters.shift();
        this.splatters.push(new SplatterStain(x, y, fruitType.splatterColor));

        // Droplets
        const count = 18 + Math.floor(Math.random() * 8);
        for (let i = 0; i < count; i++) {
            this.juices.push(new JuiceParticle(x, y, fruitType.juiceColor, vx, vy));
        }
    }

    addBladeSpark(x, y, vx, vy) {
        if (this.sparks.length > 50) this.sparks.shift();
        this.sparks.push(new BladeSpark(x, y, vx, vy));
    }

    addFloatingText(text, x, y, color = '#ffffff', size = 26, isSpecial = false) {
        this.texts.push(new FloatingText(text, x, y, color, size, isSpecial));
    }

    addBombExplosion(x, y) {
        this.explosions.push(new ExplosionEffect(x, y));
        this.screenShake = 0.45; // 450ms intense screen shake
    }

    update(dt) {
        // Decay screen shake
        if (this.screenShake > 0) {
            this.screenShake = Math.max(0, this.screenShake - dt);
        }

        // Update splatters
        for (let i = this.splatters.length - 1; i >= 0; i--) {
            this.splatters[i].update(dt);
            if (this.splatters[i].alpha <= 0) this.splatters.splice(i, 1);
        }

        // Update juice
        for (let i = this.juices.length - 1; i >= 0; i--) {
            this.juices[i].update(dt);
            if (this.juices[i].life <= 0) this.juices.splice(i, 1);
        }

        // Update sparks
        for (let i = this.sparks.length - 1; i >= 0; i--) {
            this.sparks[i].update(dt);
            if (this.sparks[i].life <= 0) this.sparks.splice(i, 1);
        }

        // Update floating texts
        for (let i = this.texts.length - 1; i >= 0; i--) {
            this.texts[i].update(dt);
            if (this.texts[i].life <= 0) this.texts.splice(i, 1);
        }

        // Update explosions
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            this.explosions[i].update(dt);
            if (this.explosions[i].life <= 0) this.explosions.splice(i, 1);
        }
    }

    drawSplatters(ctx) {
        this.splatters.forEach(s => s.draw(ctx));
    }

    drawEffects(ctx) {
        this.juices.forEach(j => j.draw(ctx));
        this.sparks.forEach(sp => sp.draw(ctx));
        this.explosions.forEach(exp => exp.draw(ctx));
        this.texts.forEach(t => t.draw(ctx));
    }
}

window.ParticleManager = ParticleManager;

