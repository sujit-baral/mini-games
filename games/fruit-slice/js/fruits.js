/**
 * Procedural Vector Fruits & Bomb Engine
 * 100% Canvas vector art — no external image files or copyrighted assets.
 */

const FRUIT_TYPES = {
    WATERMELON: {
        id: 'watermelon',
        name: 'Watermelon',
        radius: 46,
        points: 1,
        juiceColor: '#ff2a54',
        splatterColor: 'rgba(255, 42, 84, 0.45)',
        drawWhole: (ctx, r) => {
            // Striped watermelon sphere
            const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
            grad.addColorStop(0, '#38a169');
            grad.addColorStop(0.7, '#22543d');
            grad.addColorStop(1, '#1c4532');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.fill();

            // Dark wavy stripes
            ctx.save();
            ctx.clip();
            ctx.strokeStyle = '#143626';
            ctx.lineWidth = r * 0.16;
            ctx.lineCap = 'round';
            for (let i = -2; i <= 2; i++) {
                ctx.beginPath();
                const offset = i * (r * 0.45);
                ctx.moveTo(offset - r * 0.2, -r);
                ctx.bezierCurveTo(offset + r * 0.2, -r * 0.3, offset - r * 0.2, r * 0.3, offset + r * 0.1, r);
                ctx.stroke();
            }
            ctx.restore();

            // Specular shine
            const shine = ctx.createRadialGradient(-r * 0.35, -r * 0.35, 1, -r * 0.35, -r * 0.35, r * 0.5);
            shine.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
            shine.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = shine;
            ctx.beginPath();
            ctx.arc(-r * 0.35, -r * 0.35, r * 0.4, 0, Math.PI * 2);
            ctx.fill();
        },
        drawHalf: (ctx, r, isTop) => {
            // Semicircle cut
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI, !isTop);
            ctx.closePath();

            // Outer green rind
            ctx.fillStyle = '#22543d';
            ctx.fill();

            // White/light-green inner rind
            ctx.beginPath();
            ctx.arc(0, 0, r * 0.9, 0, Math.PI, !isTop);
            ctx.closePath();
            ctx.fillStyle = '#c6f6d5';
            ctx.fill();

            // Red flesh
            ctx.beginPath();
            ctx.arc(0, 0, r * 0.82, 0, Math.PI, !isTop);
            ctx.closePath();
            const fleshGrad = ctx.createRadialGradient(0, isTop ? -r * 0.2 : r * 0.2, 5, 0, 0, r * 0.8);
            fleshGrad.addColorStop(0, '#ff385c');
            fleshGrad.addColorStop(1, '#e51e46');
            ctx.fillStyle = fleshGrad;
            ctx.fill();

            // Black teardrop seeds
            ctx.fillStyle = '#1a202c';
            const seedDist = r * 0.52;
            const seedAngles = isTop ? [-0.3, -0.7, -1.1, -1.5, -1.9, -2.3, -2.7] : [0.3, 0.7, 1.1, 1.5, 1.9, 2.3, 2.7];
            seedAngles.forEach(ang => {
                const sx = Math.cos(ang) * seedDist;
                const sy = Math.sin(ang) * seedDist;
                ctx.save();
                ctx.translate(sx, sy);
                ctx.rotate(ang + Math.PI / 2);
                ctx.beginPath();
                ctx.ellipse(0, 0, r * 0.05, r * 0.09, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });
        }
    },

    ORANGE: {
        id: 'orange',
        name: 'Orange',
        radius: 40,
        points: 1,
        juiceColor: '#ff9800',
        splatterColor: 'rgba(255, 152, 0, 0.45)',
        drawWhole: (ctx, r) => {
            const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
            grad.addColorStop(0, '#ffb74d');
            grad.addColorStop(0.7, '#f57c00');
            grad.addColorStop(1, '#e65100');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.fill();

            // Citrus stipple dots
            ctx.fillStyle = 'rgba(230, 81, 0, 0.35)';
            for (let i = 0; i < 16; i++) {
                const a = i * 0.4;
                const dist = (i % 3 + 1) * (r * 0.22);
                ctx.beginPath();
                ctx.arc(Math.cos(a) * dist, Math.sin(a) * dist, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }

            // Green leaf and stem
            ctx.fillStyle = '#48bb78';
            ctx.beginPath();
            ctx.ellipse(-r * 0.15, -r * 0.95, r * 0.25, r * 0.12, -0.6, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#6d4c41';
            ctx.beginPath();
            ctx.arc(0, -r * 0.9, r * 0.08, 0, Math.PI * 2);
            ctx.fill();

            // Specular shine
            ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.beginPath();
            ctx.arc(-r * 0.35, -r * 0.35, r * 0.35, 0, Math.PI * 2);
            ctx.fill();
        },
        drawHalf: (ctx, r, isTop) => {
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI, !isTop);
            ctx.closePath();
            ctx.fillStyle = '#f57c00';
            ctx.fill();

            // White pith ring
            ctx.beginPath();
            ctx.arc(0, 0, r * 0.9, 0, Math.PI, !isTop);
            ctx.closePath();
            ctx.fillStyle = '#fff3e0';
            ctx.fill();

            // Segments
            const segments = 6;
            const arcStep = Math.PI / segments;
            for (let i = 0; i < segments; i++) {
                const startAngle = (isTop ? Math.PI : 0) + i * arcStep + 0.07;
                const endAngle = (isTop ? Math.PI : 0) + (i + 1) * arcStep - 0.07;

                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.arc(0, 0, r * 0.82, startAngle, endAngle);
                ctx.closePath();
                ctx.fillStyle = '#ff9800';
                ctx.fill();

                // Highlight inside segment
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.arc(0, 0, r * 0.55, startAngle + 0.05, endAngle - 0.05);
                ctx.closePath();
                ctx.fillStyle = '#ffa726';
                ctx.fill();
            }

            // Center pip
            ctx.fillStyle = '#fff3e0';
            ctx.beginPath();
            ctx.arc(0, 0, r * 0.14, 0, Math.PI, !isTop);
            ctx.fill();
        }
    },

    STRAWBERRY: {
        id: 'strawberry',
        name: 'Strawberry',
        radius: 36,
        points: 2,
        juiceColor: '#e91e63',
        splatterColor: 'rgba(233, 30, 99, 0.45)',
        drawWhole: (ctx, r) => {
            // Heart-tapered berry
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(0, r * 0.95);
            ctx.bezierCurveTo(-r * 0.9, r * 0.3, -r * 0.95, -r * 0.6, -r * 0.4, -r * 0.85);
            ctx.bezierCurveTo(-r * 0.1, -r * 0.95, r * 0.1, -r * 0.95, r * 0.4, -r * 0.85);
            ctx.bezierCurveTo(r * 0.95, -r * 0.6, r * 0.9, r * 0.3, 0, r * 0.95);
            ctx.closePath();

            const grad = ctx.createRadialGradient(-r * 0.2, -r * 0.2, r * 0.1, 0, 0, r);
            grad.addColorStop(0, '#ff5252');
            grad.addColorStop(0.7, '#d50000');
            grad.addColorStop(1, '#9b0000');
            ctx.fillStyle = grad;
            ctx.fill();

            // Seeds
            ctx.fillStyle = '#ffe082';
            const seeds = [
                {x: 0, y: r * 0.5}, {x: -r * 0.3, y: r * 0.3}, {x: r * 0.3, y: r * 0.3},
                {x: -r * 0.5, y: -r * 0.1}, {x: 0, y: -r * 0.05}, {x: r * 0.5, y: -r * 0.1},
                {x: -r * 0.3, y: -r * 0.45}, {x: r * 0.3, y: -r * 0.45}, {x: 0, y: -r * 0.6}
            ];
            seeds.forEach(s => {
                ctx.beginPath();
                ctx.ellipse(s.x, s.y, 1.8, 3, 0.2, 0, Math.PI * 2);
                ctx.fill();
            });

            // Green calyx leaves
            ctx.fillStyle = '#388e3c';
            for (let i = -2; i <= 2; i++) {
                ctx.save();
                ctx.translate(i * (r * 0.2), -r * 0.85);
                ctx.rotate(i * 0.35);
                ctx.beginPath();
                ctx.ellipse(0, 0, r * 0.15, r * 0.3, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            ctx.restore();
        },
        drawHalf: (ctx, r, isTop) => {
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI, !isTop);
            ctx.closePath();
            ctx.fillStyle = '#c62828';
            ctx.fill();

            // Pink pulp gradient
            ctx.beginPath();
            ctx.arc(0, 0, r * 0.85, 0, Math.PI, !isTop);
            ctx.closePath();
            ctx.fillStyle = '#ff80ab';
            ctx.fill();

            // White center core
            ctx.beginPath();
            ctx.arc(0, 0, r * 0.45, 0, Math.PI, !isTop);
            ctx.closePath();
            ctx.fillStyle = '#ffffff';
            ctx.fill();

            // Radiating red fibers
            ctx.strokeStyle = '#e91e63';
            ctx.lineWidth = 1.5;
            const count = 7;
            for (let i = 0; i <= count; i++) {
                const ang = (isTop ? Math.PI : 0) + (i / count) * Math.PI;
                ctx.beginPath();
                ctx.moveTo(Math.cos(ang) * (r * 0.2), Math.sin(ang) * (r * 0.2));
                ctx.lineTo(Math.cos(ang) * (r * 0.7), Math.sin(ang) * (r * 0.7));
                ctx.stroke();
            }
        }
    },

    BANANA: {
        id: 'banana',
        name: 'Banana',
        radius: 38,
        points: 2,
        juiceColor: '#ffd600',
        splatterColor: 'rgba(255, 214, 0, 0.45)',
        drawWhole: (ctx, r) => {
            // Crescent banana curve
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(-r * 0.95, -r * 0.3);
            ctx.bezierCurveTo(-r * 0.4, r * 0.85, r * 0.4, r * 0.85, r * 0.95, -r * 0.3);
            ctx.bezierCurveTo(r * 0.3, r * 0.4, -r * 0.3, r * 0.4, -r * 0.95, -r * 0.3);
            ctx.closePath();

            const grad = ctx.createLinearGradient(0, -r * 0.5, 0, r * 0.8);
            grad.addColorStop(0, '#ffee58');
            grad.addColorStop(0.7, '#fdd835');
            grad.addColorStop(1, '#fbc02d');
            ctx.fillStyle = grad;
            ctx.fill();

            // Banana ridge line
            ctx.strokeStyle = 'rgba(245, 127, 23, 0.5)';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(-r * 0.85, -r * 0.2);
            ctx.bezierCurveTo(-r * 0.3, r * 0.6, r * 0.3, r * 0.6, r * 0.85, -r * 0.2);
            ctx.stroke();

            // Tips (greenish and brown stem)
            ctx.fillStyle = '#689f38';
            ctx.beginPath();
            ctx.arc(-r * 0.92, -r * 0.28, r * 0.12, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#4e342e';
            ctx.beginPath();
            ctx.arc(r * 0.92, -r * 0.28, r * 0.14, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        },
        drawHalf: (ctx, r, isTop) => {
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI, !isTop);
            ctx.closePath();
            ctx.fillStyle = '#fbc02d'; // Yellow peel
            ctx.fill();

            // White/cream interior pulp
            ctx.beginPath();
            ctx.arc(0, 0, r * 0.78, 0, Math.PI, !isTop);
            ctx.closePath();
            ctx.fillStyle = '#fffde7';
            ctx.fill();

            // Tiny central seeds
            ctx.fillStyle = '#795548';
            const seeds = [-0.2, 0, 0.2];
            seeds.forEach(dx => {
                ctx.beginPath();
                ctx.arc(dx * r, isTop ? -r * 0.15 : r * 0.15, 1.6, 0, Math.PI * 2);
                ctx.fill();
            });
        }
    },

    KIWI: {
        id: 'kiwi',
        name: 'Kiwi',
        radius: 35,
        points: 2,
        juiceColor: '#76ff03',
        splatterColor: 'rgba(118, 255, 3, 0.45)',
        drawWhole: (ctx, r) => {
            // Fuzzy brown oval
            const grad = ctx.createRadialGradient(-r * 0.25, -r * 0.25, r * 0.1, 0, 0, r);
            grad.addColorStop(0, '#8d6e63');
            grad.addColorStop(0.8, '#5d4037');
            grad.addColorStop(1, '#3e2723');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.ellipse(0, 0, r * 0.95, r * 0.85, 0, 0, Math.PI * 2);
            ctx.fill();

            // Fuzzy hair bristles
            ctx.strokeStyle = '#4e342e';
            ctx.lineWidth = 1.2;
            for (let i = 0; i < 20; i++) {
                const ang = (i / 20) * Math.PI * 2;
                const ox = Math.cos(ang) * (r * 0.95);
                const oy = Math.sin(ang) * (r * 0.85);
                ctx.beginPath();
                ctx.moveTo(ox, oy);
                ctx.lineTo(ox + Math.cos(ang) * 3, oy + Math.sin(ang) * 3);
                ctx.stroke();
            }
        },
        drawHalf: (ctx, r, isTop) => {
            // Brown fuzzy rind
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI, !isTop);
            ctx.closePath();
            ctx.fillStyle = '#5d4037';
            ctx.fill();

            // Radiant emerald flesh
            ctx.beginPath();
            ctx.arc(0, 0, r * 0.9, 0, Math.PI, !isTop);
            ctx.closePath();
            const kiwiGrad = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 0.9);
            kiwiGrad.addColorStop(0, '#cddc39');
            kiwiGrad.addColorStop(0.5, '#7cb342');
            kiwiGrad.addColorStop(1, '#558b2f');
            ctx.fillStyle = kiwiGrad;
            ctx.fill();

            // Cream core
            ctx.beginPath();
            ctx.arc(0, 0, r * 0.28, 0, Math.PI, !isTop);
            ctx.closePath();
            ctx.fillStyle = '#fff9c4';
            ctx.fill();

            // Radiating black seed ring
            ctx.fillStyle = '#212121';
            const count = 10;
            for (let i = 0; i < count; i++) {
                const ang = (isTop ? Math.PI : 0) + (i / count) * Math.PI + 0.15;
                const dist = r * 0.48;
                ctx.beginPath();
                ctx.ellipse(Math.cos(ang) * dist, Math.sin(ang) * dist, 1.8, 3, ang, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    },

    DRAGONFRUIT: {
        id: 'dragonfruit',
        name: 'Dragonfruit',
        radius: 42,
        points: 3,
        juiceColor: '#ff007f',
        splatterColor: 'rgba(255, 0, 127, 0.5)',
        drawWhole: (ctx, r) => {
            // Exotic magenta body with green scale bracts
            ctx.fillStyle = '#c2185b';
            ctx.beginPath();
            ctx.ellipse(0, 0, r * 0.9, r, 0, 0, Math.PI * 2);
            ctx.fill();

            // Highlight
            const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 5, 0, 0, r);
            grad.addColorStop(0, '#ff4081');
            grad.addColorStop(1, '#880e4f');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.ellipse(0, 0, r * 0.9, r, 0, 0, Math.PI * 2);
            ctx.fill();

            // Green flame-like scales
            ctx.fillStyle = '#64dd17';
            const scales = [
                {x: -r * 0.6, y: -r * 0.4, rot: -0.6},
                {x: r * 0.6, y: -r * 0.4, rot: 0.6},
                {x: -r * 0.7, y: r * 0.2, rot: -0.9},
                {x: r * 0.7, y: r * 0.2, rot: 0.9},
                {x: 0, y: -r * 0.95, rot: 0}
            ];
            scales.forEach(s => {
                ctx.save();
                ctx.translate(s.x, s.y);
                ctx.rotate(s.rot);
                ctx.beginPath();
                ctx.moveTo(0, -r * 0.35);
                ctx.bezierCurveTo(-r * 0.15, -r * 0.1, -r * 0.1, r * 0.1, 0, 0);
                ctx.bezierCurveTo(r * 0.1, r * 0.1, r * 0.15, -r * 0.1, 0, -r * 0.35);
                ctx.fill();
                ctx.restore();
            });
        },
        drawHalf: (ctx, r, isTop) => {
            // Magenta outer peel
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI, !isTop);
            ctx.closePath();
            ctx.fillStyle = '#c2185b';
            ctx.fill();

            // White interior
            ctx.beginPath();
            ctx.arc(0, 0, r * 0.84, 0, Math.PI, !isTop);
            ctx.closePath();
            ctx.fillStyle = '#ffffff';
            ctx.fill();

            // Specks of black poppy seeds
            ctx.fillStyle = '#111111';
            const seedLocations = [
                {x: -r * 0.5, y: 0.3}, {x: -r * 0.2, y: 0.5}, {x: 0, y: 0.2},
                {x: r * 0.3, y: 0.4}, {x: r * 0.6, y: 0.3}, {x: -r * 0.4, y: 0.7},
                {x: -r * 0.1, y: 0.6}, {x: r * 0.2, y: 0.7}, {x: r * 0.5, y: 0.6}
            ];
            seedLocations.forEach(s => {
                ctx.beginPath();
                ctx.arc(s.x, isTop ? -s.y * r : s.y * r, 1.8, 0, Math.PI * 2);
                ctx.fill();
            });
        }
    },

    PINEAPPLE: {
        id: 'pineapple',
        name: 'Pineapple',
        radius: 44,
        points: 2,
        juiceColor: '#ffea00',
        splatterColor: 'rgba(255, 234, 0, 0.45)',
        drawWhole: (ctx, r) => {
            // Golden textured body
            ctx.save();
            ctx.fillStyle = '#ff8f00';
            ctx.beginPath();
            ctx.ellipse(0, r * 0.1, r * 0.85, r * 0.9, 0, 0, Math.PI * 2);
            ctx.fill();

            // Diamond pattern scales
            ctx.clip();
            ctx.strokeStyle = '#e65100';
            ctx.lineWidth = 2;
            for (let i = -3; i <= 3; i++) {
                ctx.beginPath();
                ctx.moveTo(-r * 0.9, i * 16 - r * 0.4);
                ctx.lineTo(r * 0.9, i * 16 + r * 0.4);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(r * 0.9, i * 16 - r * 0.4);
                ctx.lineTo(-r * 0.9, i * 16 + r * 0.4);
                ctx.stroke();
            }
            ctx.restore();

            // Green crown leaves
            ctx.fillStyle = '#2e7d32';
            for (let i = -3; i <= 3; i++) {
                ctx.save();
                ctx.translate(i * 7, -r * 0.75);
                ctx.rotate(i * 0.22);
                ctx.beginPath();
                ctx.moveTo(0, -r * 0.45);
                ctx.lineTo(-r * 0.14, 0);
                ctx.lineTo(r * 0.14, 0);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }
        },
        drawHalf: (ctx, r, isTop) => {
            // Outer golden rind
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI, !isTop);
            ctx.closePath();
            ctx.fillStyle = '#ff8f00';
            ctx.fill();

            // Bright sunny pulp
            ctx.beginPath();
            ctx.arc(0, 0, r * 0.9, 0, Math.PI, !isTop);
            ctx.closePath();
            ctx.fillStyle = '#fff176';
            ctx.fill();

            // Fibrous core
            ctx.beginPath();
            ctx.arc(0, 0, r * 0.35, 0, Math.PI, !isTop);
            ctx.closePath();
            ctx.fillStyle = '#ffee58';
            ctx.fill();

            // Radial pulp ridges
            ctx.strokeStyle = '#fbc02d';
            ctx.lineWidth = 1.5;
            for (let i = 0; i <= 8; i++) {
                const ang = (isTop ? Math.PI : 0) + (i / 8) * Math.PI;
                ctx.beginPath();
                ctx.moveTo(Math.cos(ang) * (r * 0.35), Math.sin(ang) * (r * 0.35));
                ctx.lineTo(Math.cos(ang) * (r * 0.85), Math.sin(ang) * (r * 0.85));
                ctx.stroke();
            }
        }
    }
};

/**
 * Bomb class: hazard with sparking animated fuse and metallic body
 */
class BombItem {
    constructor(x, y, vx, vy) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = 38;
        this.rotation = Math.random() * Math.PI * 2;
        this.vRot = (Math.random() - 0.5) * 2;
        this.isBomb = true;
        this.sliced = false;
        this.sparkTimer = 0;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vy += 800 * dt; // Gravity
        this.rotation += this.vRot * dt;

        this.sparkTimer += dt;
        if (this.sparkTimer > 0.08) {
            this.sparkTimer = 0;
            if (window.soundCtrl && !window.soundCtrl.isMuted) {
                // Occasional subtle fuse sound
                if (Math.random() < 0.3) window.soundCtrl.playFuseSpark();
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        const r = this.radius;

        // Brass fuse collar
        ctx.fillStyle = '#b7791f';
        ctx.fillRect(-r * 0.2, -r * 1.15, r * 0.4, r * 0.25);

        // Twisted burning fuse cord
        ctx.strokeStyle = '#d69e2e';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, -r * 1.15);
        ctx.quadraticCurveTo(r * 0.3, -r * 1.4, r * 0.1, -r * 1.6);
        ctx.stroke();

        // Animated sparking flame at fuse tip
        const sparkPhase = Date.now() * 0.02;
        const sparkSize = 6 + Math.sin(sparkPhase) * 3;
        const fuseTipX = r * 0.1;
        const fuseTipY = -r * 1.6;

        const flameGrad = ctx.createRadialGradient(fuseTipX, fuseTipY, 1, fuseTipX, fuseTipY, sparkSize);
        flameGrad.addColorStop(0, '#ffffff');
        flameGrad.addColorStop(0.3, '#ffeb3b');
        flameGrad.addColorStop(0.7, '#ff5722');
        flameGrad.addColorStop(1, 'rgba(255, 87, 34, 0)');

        ctx.fillStyle = flameGrad;
        ctx.beginPath();
        ctx.arc(fuseTipX, fuseTipY, sparkSize * 1.8, 0, Math.PI * 2);
        ctx.fill();

        // Dark cast iron bomb sphere
        const bombGrad = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r);
        bombGrad.addColorStop(0, '#4a5568');
        bombGrad.addColorStop(0.5, '#2d3748');
        bombGrad.addColorStop(0.9, '#1a202c');
        bombGrad.addColorStop(1, '#0d1117');

        ctx.fillStyle = bombGrad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // Red danger skull or hazard exclamation
        ctx.fillStyle = '#e53e3e';
        ctx.beginPath();
        ctx.arc(0, -r * 0.15, r * 0.18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(-r * 0.08, r * 0.05, r * 0.16, r * 0.22);
        ctx.beginPath();
        ctx.arc(0, r * 0.35, r * 0.08, 0, Math.PI * 2);
        ctx.fill();

        // Specular highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.beginPath();
        ctx.ellipse(-r * 0.4, -r * 0.4, r * 0.25, r * 0.14, -0.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

/**
 * Fruit Half: created when a whole fruit is sliced
 */
class FruitHalf {
    constructor(fruitType, x, y, vx, vy, rotation, vRot, isTop, cutAngle) {
        this.fruitType = fruitType;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.rotation = rotation;
        this.vRot = vRot;
        this.isTop = isTop;
        this.cutAngle = cutAngle;
        this.radius = fruitType.radius;
        this.alpha = 1.0;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vy += 860 * dt; // Gravity
        this.rotation += this.vRot * dt;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.cutAngle + this.rotation);
        this.fruitType.drawHalf(ctx, this.radius, this.isTop);
        ctx.restore();
    }
}

/**
 * Whole Fruit Item in motion
 */
class FruitItem {
    constructor(typeKey, x, y, vx, vy) {
        this.type = FRUIT_TYPES[typeKey] || FRUIT_TYPES.WATERMELON;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = this.type.radius;
        this.rotation = Math.random() * Math.PI * 2;
        this.vRot = (Math.random() - 0.5) * 3;
        this.isBomb = false;
        this.sliced = false;
        this.missed = false;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vy += 800 * dt; // Gravity
        this.rotation += this.vRot * dt;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        this.type.drawWhole(ctx, this.radius);
        ctx.restore();
    }

    /**
     * Splits fruit into two halves flying away from the cut line.
     */
    slice(cutAngle) {
        this.sliced = true;
        const pushSpeed = 160 + Math.random() * 80;
        const normal = cutAngle + Math.PI / 2;

        const half1 = new FruitHalf(
            this.type,
            this.x,
            this.y,
            this.vx + Math.cos(normal) * pushSpeed,
            this.vy + Math.sin(normal) * pushSpeed - 60,
            0,
            -2.5 - Math.random() * 2,
            true,
            cutAngle
        );

        const half2 = new FruitHalf(
            this.type,
            this.x,
            this.y,
            this.vx - Math.cos(normal) * pushSpeed,
            this.vy - Math.sin(normal) * pushSpeed - 60,
            0,
            2.5 + Math.random() * 2,
            false,
            cutAngle
        );

        return [half1, half2];
    }
}

window.FRUIT_TYPES = FRUIT_TYPES;
window.FruitItem = FruitItem;
window.FruitHalf = FruitHalf;
window.BombItem = BombItem;
