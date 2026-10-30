/**
 * Blade Trail & Swipe Physics Controller
 * Handles mouse, trackpad, and multi-touch pointer inputs, renders glowing blade swoosh,
 * and performs line-segment to circle collision detection.
 */

class BladeTrail {
    constructor(canvas, particleManager) {
        this.canvas = canvas;
        this.pm = particleManager;
        this.points = []; // [{x, y, time}]
        this.isSwiping = false;
        this.maxTrailTime = 0.18; // 180ms trail duration
        this.lastSoundTime = 0;
        this.lastX = 0;
        this.lastY = 0;

        this.initListeners();
    }

    reset() {
        this.points = [];
        this.isSwiping = false;
    }

    /**
     * Translates client viewport coordinates to Canvas logical coordinates (CSS pixels).
     */
    getCanvasCoords(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    initListeners() {
        const canvas = this.canvas;

        const handleStart = (e) => {
            // Prevent scrolling on touch screens when touching canvas
            if (e.pointerType === 'touch' || e.cancelable) {
                e.preventDefault();
            }

            // Resume audio if needed
            if (window.soundCtrl) {
                window.soundCtrl.init();
            }

            const { x, y } = this.getCanvasCoords(e);
            this.isSwiping = true;
            this.points = [{ x, y, time: performance.now() / 1000 }];
            this.lastX = x;
            this.lastY = y;
        };

        const handleMove = (e) => {
            // If not swiping and mouse is not held down, allow normal browser actions
            if (!this.isSwiping && (e.pointerType !== 'mouse' || e.buttons === 0)) {
                return;
            }

            // Mouse button released while dragging
            if (e.pointerType === 'mouse' && e.buttons === 0) {
                this.isSwiping = false;
                return;
            }

            // Only prevent default while player is actively swiping inside the game area
            if (this.isSwiping && e.cancelable) {
                e.preventDefault();
            }

            const { x, y } = this.getCanvasCoords(e);
            const now = performance.now() / 1000;

            if (!this.isSwiping) {
                this.isSwiping = true;
                this.points = [{ x, y, time: now }];
                this.lastX = x;
                this.lastY = y;
                return;
            }

            const dx = x - this.lastX;
            const dy = y - this.lastY;
            const dist = Math.hypot(dx, dy);

            // Minimum movement threshold to register new point
            if (dist > 4) {
                this.points.push({ x, y, time: now });
                const speed = dist / 0.016; // approximate speed in px/s

                // Emit blade sparks during swift swipes
                if (speed > 400 && this.pm) {
                    this.pm.addBladeSpark(x, y, dx * 0.3, dy * 0.3);
                }

                // Swish whoosh audio effect
                if (speed > 800 && now - this.lastSoundTime > 0.16 && window.soundCtrl) {
                    window.soundCtrl.playSwish(Math.min(1.8, speed / 800));
                    this.lastSoundTime = now;
                }

                this.lastX = x;
                this.lastY = y;
            }
        };

        const handleEnd = (e) => {
            if (e.cancelable) {
                e.preventDefault();
            }
            this.isSwiping = false;
        };

        canvas.addEventListener('pointerdown', handleStart, { passive: false });
        window.addEventListener('pointermove', handleMove, { passive: false });
        window.addEventListener('pointerup', handleEnd, { passive: false });
        window.addEventListener('pointercancel', handleEnd, { passive: false });
    }

    update() {
        const now = performance.now() / 1000;
        // Purge points older than maxTrailTime
        while (this.points.length > 0 && now - this.points[0].time > this.maxTrailTime) {
            this.points.shift();
        }

        if (!this.isSwiping && this.points.length > 0) {
            // Speed up trail fade out when released
            this.points[0].time -= 0.03;
        }
    }

    /**
     * Renders a glowing neon tapered arcade blade swoosh.
     */
    draw(ctx) {
        if (this.points.length < 2) return;

        const now = performance.now() / 1000;
        const total = this.points.length;

        // Draw multiple passes for outer neon glow and bright white blade core
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // 1. Outer cyan glow
        for (let i = 1; i < total; i++) {
            const p1 = this.points[i - 1];
            const p2 = this.points[i];
            const ageProgress = (now - p2.time) / this.maxTrailTime;
            const alpha = Math.max(0, 1 - ageProgress);
            const width = (i / total) * 16 + 2;

            ctx.strokeStyle = `rgba(0, 229, 255, ${alpha * 0.6})`;
            ctx.lineWidth = width;
            ctx.shadowColor = '#00e5ff';
            ctx.shadowBlur = 14;

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
        }

        // 2. Inner intense white-hot core
        for (let i = 1; i < total; i++) {
            const p1 = this.points[i - 1];
            const p2 = this.points[i];
            const ageProgress = (now - p2.time) / this.maxTrailTime;
            const alpha = Math.max(0, 1 - ageProgress);
            const width = (i / total) * 6 + 1.5;

            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.95})`;
            ctx.lineWidth = width;
            ctx.shadowBlur = 0;

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
        }

        ctx.restore();
    }

    /**
     * Checks if the recent blade trajectory intersects an item's circle.
     * Line segment to circle distance formula.
     */
    checkSlice(item) {
        if (this.points.length < 2 || item.sliced) return null;

        // Check recent segments
        const checkCount = Math.min(this.points.length - 1, 4);
        for (let i = this.points.length - 1; i >= this.points.length - checkCount; i--) {
            const p1 = this.points[i - 1];
            const p2 = this.points[i];
            if (!p1 || !p2) continue;

            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const lenSq = dx * dx + dy * dy;

            if (lenSq === 0) continue;

            // Parameter t for closest point on segment
            let t = ((item.x - p1.x) * dx + (item.y - p1.y) * dy) / lenSq;
            t = Math.max(0, Math.min(1, t));

            const closestX = p1.x + t * dx;
            const closestY = p1.y + t * dy;

            const distSq = (item.x - closestX) ** 2 + (item.y - closestY) ** 2;
            const hitRadius = item.radius * 1.05;

            if (distSq <= hitRadius * hitRadius) {
                const cutAngle = Math.atan2(dy, dx);
                return { cutAngle, point: { x: closestX, y: closestY } };
            }
        }

        return null;
    }
}

window.BladeTrail = BladeTrail;

