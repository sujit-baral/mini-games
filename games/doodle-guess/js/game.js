/**
 * Doodle Guess Arcade - Main Game Engine
 * Coordinates Canvas drawing, state machines for Multiplayer P2P, Solo Challenge,
 * word hints, timer loops, and chat engine.
 */

class DoodleGuessGame {
    constructor() {
        // Core elements
        this.canvas = document.getElementById('drawing-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvasContainer = document.getElementById('canvas-container');

        // Audio & Network
        this.sound = new window.DoodleSoundController();
        window.soundCtrl = this.sound;

        this.network = new window.DoodleP2PNetwork({
            onHostReady: (roomCode) => this.onHostRoomReady(roomCode),
            onHostError: (msg) => this.showNotification(msg, 'error'),
            onJoinSuccess: (roomCode) => this.onJoinedRoomSuccess(roomCode),
            onHostDisconnected: () => this.onHostDisconnected(),
            onPlayerLeft: () => this.updateLobbyPlayerList(),
            onMessage: (data, fromConn) => this.handleNetworkMessage(data, fromConn)
        });

        // Game State
        this.mode = 'MENU'; // 'MENU', 'MULTIPLAYER', 'SOLO_GUESS', 'FREE_DRAW'
        this.gameState = 'LOBBY'; // 'LOBBY', 'WORD_SELECT', 'DRAWING', 'ROUND_SUMMARY', 'GAME_OVER'
        this.players = []; // [{id, name, score, isHost, hasGuessed}]
        this.currentDrawerId = null;
        this.currentWord = '';
        this.revealedHints = [];
        this.roundNumber = 1;
        this.maxRounds = 3;
        this.roundDuration = 60; // seconds
        this.timerSeconds = 60;
        this.timerInterval = null;
        this.soloScore = 0;
        this.soloHighscore = 0;

        // Drawing State
        this.isDrawing = false;
        this.canDraw = false;
        this.brushColor = '#ffffff';
        this.brushSize = 6;
        this.isEraser = false;
        this.isFillMode = false;
        this.lastX = 0;
        this.lastY = 0;
        this.strokeHistory = []; // For Undo
        this.currentStroke = [];
        this.batchPoints = []; // Micro-batching queue for ultra-fast network sync
        this.batchFlushTimer = null;
        this.logicalWidth = 800;
        this.logicalHeight = 550;

        // Solo Bot State
        this.soloDoodleIndex = 0;
        this.soloAnimationTimer = null;

        // Load saved High Scores
        try {
            const saved = localStorage.getItem('doodle_guess_solo_highscore');
            if (saved) this.soloHighscore = parseInt(saved, 10) || 0;
        } catch (e) {}

        this.initDOM();
        this.initCanvas();
        this.applyBoardTheme();
        this.initEventListeners();
        this.checkUrlRoomParam();
    }

    initDOM() {
        // Screens
        this.screenMenu = document.getElementById('screen-menu');
        this.screenGame = document.getElementById('screen-game');
        this.screenLobby = document.getElementById('screen-lobby');

        // Overlays & Modals
        this.modalWordSelect = document.getElementById('modal-word-select');
        this.modalRoundSummary = document.getElementById('modal-round-summary');
        this.modalGameOver = document.getElementById('modal-game-over');
        this.modalHelp = document.getElementById('modal-help');
        this.modalShop = document.getElementById('modal-shop');

        // Rewards & Shop
        this.rewards = window.ArcadeRewards;
        this.btnShopToggle = document.getElementById('btn-shop-toggle');
        this.btnCloseShop = document.getElementById('btn-close-shop');
        this.headerCoinsCounter = document.getElementById('header-coins-counter');
        this.shopModalCoinsValue = document.getElementById('shop-modal-coins-value');
        this.shopItemsGrid = document.getElementById('shop-items-grid');
        this.shopTabButtons = document.querySelectorAll('.shop-tab-btn');
        this.currentShopCategory = 'avatars';

        if (this.rewards) {
            this.rewards.subscribe(() => {
                this.updateShopUI();
            });
            this.updateShopUI();
        }

        // Drawing Toolbar
        this.toolbar = document.getElementById('canvas-toolbar');
        this.colorButtons = document.querySelectorAll('.color-swatch');
        this.sizeButtons = document.querySelectorAll('.btn-size');
        this.btnFill = document.getElementById('btn-fill');
        this.btnEraser = document.getElementById('btn-eraser');
        this.btnUndo = document.getElementById('btn-undo');
        this.btnClear = document.getElementById('btn-clear');
        this.btnDownload = document.getElementById('btn-download');

        // HUD Elements
        this.timerDisplay = document.getElementById('hud-timer-value');
        this.roundDisplay = document.getElementById('hud-round-value');
        this.wordHintDisplay = document.getElementById('hud-word-hint');
        this.drawerStatusText = document.getElementById('hud-drawer-status');

        // Chat Elements
        this.chatMessages = document.getElementById('chat-messages');
        this.chatForm = document.getElementById('chat-form');
        this.chatInput = document.getElementById('chat-input');

        // Leaderboard
        this.leaderboardList = document.getElementById('leaderboard-list');

        // Notification Toast
        this.toast = document.getElementById('toast-notification');
    }

    initCanvas() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        const canvas = this.canvas;

        const getCoords = (e) => {
            const rect = canvas.getBoundingClientRect();
            if (!rect.width || !rect.height) {
                return { x: 0, y: 0 };
            }

            // Calculate rendered canvas dimensions & pillarbox/letterbox offsets caused by object-fit: contain
            const canvasAspect = this.logicalWidth / this.logicalHeight;
            const rectAspect = rect.width / rect.height;
            let renderW = rect.width;
            let renderH = rect.height;
            let offsetX = 0;
            let offsetY = 0;

            if (rectAspect > canvasAspect) {
                // Pillarbox: container is wider than 800:550; letterboxing on left and right
                renderW = rect.height * canvasAspect;
                offsetX = (rect.width - renderW) / 2;
            } else if (rectAspect < canvasAspect) {
                // Letterbox: container is taller than 800:550; letterboxing on top and bottom
                renderH = rect.width / canvasAspect;
                offsetY = (rect.height - renderH) / 2;
            }

            const scaleX = this.logicalWidth / renderW;
            const scaleY = this.logicalHeight / renderH;

            const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
            const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

            const x = (clientX - rect.left - offsetX) * scaleX;
            const y = (clientY - rect.top - offsetY) * scaleY;

            return {
                x: Math.max(0, Math.min(this.logicalWidth, x)),
                y: Math.max(0, Math.min(this.logicalHeight, y))
            };
        };

        const startDraw = (e) => {
            if (!this.canDraw) return;
            if (e.cancelable) e.preventDefault();
            this.sound.init();

            if (e.pointerId !== undefined && canvas.setPointerCapture) {
                try {
                    canvas.setPointerCapture(e.pointerId);
                } catch (err) {}
            }

            const coords = getCoords(e);
            const rx = Math.round(coords.x);
            const ry = Math.round(coords.y);

            // Handle Flood Fill / Paint Bucket (MS Paint style)
            if (this.isFillMode) {
                const fillColor = this.brushColor;
                this.floodFill(rx, ry, fillColor, true);
                this.sound.playDrawStroke();
                return;
            }

            this.isDrawing = true;
            this.lastX = rx;
            this.lastY = ry;
            this.currentStroke = [{ x: rx, y: ry }];
            this.batchPoints = [rx, ry];

            const color = this.isEraser ? this.getCanvasBgColor() : this.brushColor;
            this.drawDot(rx, ry, color, this.brushSize);

            if (this.mode === 'MULTIPLAYER') {
                this.network.broadcast({
                    type: 'DRAW_DOT',
                    x: rx,
                    y: ry,
                    color: color,
                    size: this.brushSize
                });

                // Micro-batching: flush points every 25ms (~40Hz) for silky smooth network sync
                clearInterval(this.batchFlushTimer);
                this.batchFlushTimer = setInterval(() => {
                    if (this.isDrawing) {
                        this.flushDrawBatch();
                    } else {
                        clearInterval(this.batchFlushTimer);
                    }
                }, 25);
            }
        };

        const moveDraw = (e) => {
            if (!this.isDrawing || !this.canDraw) return;
            if (e.cancelable) e.preventDefault();

            const coords = getCoords(e);
            const rx = Math.round(coords.x);
            const ry = Math.round(coords.y);

            // Skip zero-movement duplicate samples
            if (rx === this.lastX && ry === this.lastY) return;

            const color = this.isEraser ? this.getCanvasBgColor() : this.brushColor;

            // Draw locally with zero latency
            this.drawLine(this.lastX, this.lastY, rx, ry, color, this.brushSize);
            this.currentStroke.push({ x: rx, y: ry });

            if (this.mode === 'MULTIPLAYER') {
                this.batchPoints.push(rx, ry);
                // Flush immediately if batch buffer accumulates 16 coordinates (8 line segments)
                if (this.batchPoints.length >= 16) {
                    this.flushDrawBatch();
                }
            }

            this.lastX = rx;
            this.lastY = ry;

            if (Math.random() < 0.25) {
                this.sound.playDrawStroke();
            }
        };

        const endDraw = (e) => {
            if (!this.isDrawing) return;
            this.isDrawing = false;
            clearInterval(this.batchFlushTimer);

            if (e && e.pointerId !== undefined && canvas.releasePointerCapture) {
                try {
                    if (canvas.hasPointerCapture(e.pointerId)) {
                        canvas.releasePointerCapture(e.pointerId);
                    }
                } catch (err) {}
            }

            // Flush any remaining coordinates in the batch
            if (this.mode === 'MULTIPLAYER' && this.batchPoints.length >= 4) {
                this.flushDrawBatch();
            }
            this.batchPoints = [];

            if (this.currentStroke.length > 0) {
                this.strokeHistory.push({
                    color: this.isEraser ? this.getCanvasBgColor() : this.brushColor,
                    size: this.brushSize,
                    points: this.currentStroke
                });
            }
            this.currentStroke = [];
        };

        canvas.addEventListener('pointerdown', startDraw);
        canvas.addEventListener('pointermove', moveDraw);
        canvas.addEventListener('pointerup', endDraw);
        canvas.addEventListener('pointercancel', endDraw);
        canvas.addEventListener('pointerleave', endDraw);
    }

    flushDrawBatch() {
        if (!this.canDraw || this.mode !== 'MULTIPLAYER' || this.batchPoints.length < 4) {
            return;
        }

        const color = this.isEraser ? this.getCanvasBgColor() : this.brushColor;
        this.network.broadcast({
            type: 'DRAW_BATCH',
            points: this.batchPoints,
            color: color,
            size: this.brushSize
        });

        // Retain the last point (x, y) so the next batch connects seamlessly
        const len = this.batchPoints.length;
        this.batchPoints = [this.batchPoints[len - 2], this.batchPoints[len - 1]];
    }

    resizeCanvas() {
        this.canvas.width = this.logicalWidth;
        this.canvas.height = this.logicalHeight;
        this.clearCanvas(false);
        this.redrawHistory();
    }

    drawDot(x, y, color, size) {
        this.ctx.save();
        const brushFx = this.rewards ? this.rewards.getEquippedBrushFx() : null;
        if (brushFx && brushFx.id === 'brush_glow' && !this.isEraser) {
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = color;
        } else {
            this.ctx.shadowBlur = 0;
        }
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }

    drawLine(x0, y0, x1, y1, color, size) {
        this.ctx.save();
        const brushFx = this.rewards ? this.rewards.getEquippedBrushFx() : null;
        if (brushFx && brushFx.id === 'brush_glow' && !this.isEraser) {
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = color;
        } else {
            this.ctx.shadowBlur = 0;
        }
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = size;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(x0, y0);
        this.ctx.lineTo(x1, y1);
        this.ctx.stroke();
        this.ctx.restore();
    }

    hexToRgba(hex) {
        let c = (hex || '#ffffff').replace('#', '');
        if (c.length === 3) {
            c = c.split('').map(x => x + x).join('');
        }
        const num = parseInt(c, 16) || 0;
        return [
            (num >> 16) & 255,
            (num >> 8) & 255,
            num & 255,
            255
        ];
    }

    floodFill(startX, startY, fillColorHex, broadcast = true) {
        startX = Math.floor(startX);
        startY = Math.floor(startY);
        const w = this.logicalWidth;
        const h = this.logicalHeight;

        if (startX < 0 || startX >= w || startY < 0 || startY >= h) {
            return;
        }

        const imgData = this.ctx.getImageData(0, 0, w, h);
        const data = imgData.data;

        const startPos = (startY * w + startX) * 4;
        const startR = data[startPos];
        const startG = data[startPos + 1];
        const startB = data[startPos + 2];
        const startA = data[startPos + 3];

        const [fillR, fillG, fillB, fillA] = this.hexToRgba(fillColorHex);

        // Color difference distance check
        const colorDiff = (r1, g1, b1, a1, r2, g2, b2, a2) => {
            return Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2) + Math.abs(a1 - a2);
        };

        // If target area already has the fill color, return early
        if (colorDiff(startR, startG, startB, startA, fillR, fillG, fillB, fillA) < 15) {
            return;
        }

        const tolerance = 42; // Soft edge anti-alias blending tolerance
        const visited = new Uint8Array(w * h);
        const queue = new Int32Array(w * h);
        let head = 0;
        let tail = 0;

        const startIdx = startX + startY * w;
        queue[tail++] = startIdx;
        visited[startIdx] = 1;

        while (head < tail) {
            const idx = queue[head++];
            const cx = idx % w;
            const cy = (idx / w) | 0;
            const p = idx * 4;

            data[p] = fillR;
            data[p + 1] = fillG;
            data[p + 2] = fillB;
            data[p + 3] = fillA;

            // West
            if (cx > 0) {
                const nIdx = idx - 1;
                if (!visited[nIdx]) {
                    const np = nIdx * 4;
                    if (colorDiff(data[np], data[np + 1], data[np + 2], data[np + 3], startR, startG, startB, startA) <= tolerance) {
                        visited[nIdx] = 1;
                        queue[tail++] = nIdx;
                    }
                }
            }
            // East
            if (cx < w - 1) {
                const nIdx = idx + 1;
                if (!visited[nIdx]) {
                    const np = nIdx * 4;
                    if (colorDiff(data[np], data[np + 1], data[np + 2], data[np + 3], startR, startG, startB, startA) <= tolerance) {
                        visited[nIdx] = 1;
                        queue[tail++] = nIdx;
                    }
                }
            }
            // North
            if (cy > 0) {
                const nIdx = idx - w;
                if (!visited[nIdx]) {
                    const np = nIdx * 4;
                    if (colorDiff(data[np], data[np + 1], data[np + 2], data[np + 3], startR, startG, startB, startA) <= tolerance) {
                        visited[nIdx] = 1;
                        queue[tail++] = nIdx;
                    }
                }
            }
            // South
            if (cy < h - 1) {
                const nIdx = idx + w;
                if (!visited[nIdx]) {
                    const np = nIdx * 4;
                    if (colorDiff(data[np], data[np + 1], data[np + 2], data[np + 3], startR, startG, startB, startA) <= tolerance) {
                        visited[nIdx] = 1;
                        queue[tail++] = nIdx;
                    }
                }
            }
        }

        this.ctx.putImageData(imgData, 0, 0);

        // Record in history for Undo
        this.strokeHistory.push({
            type: 'fill',
            x: startX,
            y: startY,
            color: fillColorHex
        });

        if (broadcast && this.canDraw && this.mode === 'MULTIPLAYER') {
            this.network.broadcast({
                type: 'FLOOD_FILL',
                x: startX,
                y: startY,
                color: fillColorHex
            });
        }
    }

    getCanvasBgColor() {
        if (this.rewards) {
            const theme = this.rewards.getEquippedTheme();
            if (theme && theme.bgColor) return theme.bgColor;
        }
        return '#0c101b';
    }

    applyBoardTheme() {
        const container = document.querySelector('.canvas-container');
        if (!container || !this.rewards) return;
        const theme = this.rewards.getEquippedTheme();
        const themeId = theme ? theme.id : 'theme_midnight';
        container.classList.remove('theme-midnight', 'theme-chalkboard', 'theme-blueprint', 'theme-parchment', 'theme-synthwave');
        container.classList.add(themeId.replace('_', '-'));
        this.clearCanvas(false);
        this.redrawHistory();
    }

    clearCanvas(broadcast = true) {
        this.ctx.save();
        this.ctx.fillStyle = this.getCanvasBgColor();
        this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);
        this.ctx.restore();

        if (broadcast && this.canDraw && this.mode === 'MULTIPLAYER') {
            this.network.broadcast({ type: 'CLEAR_CANVAS' });
        }
    }

    /* ----------------------------------------------------
       REWARDS & CUSTOMIZATION SHOP UI
    ---------------------------------------------------- */
    openShop() {
        this.sound.init();
        this.sound.playUiClick();
        this.updateShopUI();
        this.renderShopItems();
        this.modalShop?.classList.remove('hidden');
    }

    closeShop() {
        this.sound.playUiClick();
        this.modalShop?.classList.add('hidden');
    }

    updateShopUI() {
        if (!this.rewards) return;
        const coins = this.rewards.getCoins();
        if (this.headerCoinsCounter) this.headerCoinsCounter.textContent = coins.toLocaleString();
        if (this.shopModalCoinsValue) this.shopModalCoinsValue.textContent = coins.toLocaleString();
    }

    renderShopItems() {
        if (!this.rewards || !this.shopItemsGrid) return;
        this.shopItemsGrid.innerHTML = '';
        const items = this.rewards.catalog[this.currentShopCategory] || [];
        const equipped = this.rewards.getEquipped(this.currentShopCategory);
        const equippedId = equipped ? equipped.id : null;
        const currentCoins = this.rewards.getCoins();

        items.forEach(item => {
            const isUnlocked = this.rewards.isUnlocked(item.id);
            const isEquipped = (item.id === equippedId);
            const canAfford = currentCoins >= item.price;

            const card = document.createElement('div');
            card.className = `shop-item-card ${isEquipped ? 'is-equipped' : ''}`;

            let buttonHtml = '';
            if (isEquipped) {
                buttonHtml = `<button class="btn-shop-action btn-equipped" disabled>Equipped</button>`;
            } else if (isUnlocked) {
                buttonHtml = `<button class="btn-shop-action btn-equip" data-action="equip" data-id="${item.id}" data-category="${this.currentShopCategory}">Equip</button>`;
            } else {
                const disabled = !canAfford ? 'disabled' : '';
                buttonHtml = `<button class="btn-shop-action btn-buy" data-action="buy" data-id="${item.id}" ${disabled}>🪙 ${item.price}</button>`;
            }

            const iconBoxStyle = item.bgColor ? `background: ${item.bgColor}; border: 2px solid ${item.borderColor || '#444'};` : '';

            card.innerHTML = `
                <div class="shop-item-top">
                    <div class="shop-item-icon-box" style="${iconBoxStyle}">
                        ${item.icon || '✨'}
                    </div>
                    <div class="shop-item-info">
                        <h4 class="shop-item-title">${this.escapeHTML(item.name)}</h4>
                        <p class="shop-item-desc">${this.escapeHTML(item.description)}</p>
                    </div>
                </div>
                <div class="shop-item-action-row">
                    <span class="shop-item-price-tag ${item.price === 0 ? 'free' : ''}">
                        ${item.price === 0 ? 'Free' : '🪙 ' + item.price}
                    </span>
                    ${buttonHtml}
                </div>
            `;

            this.shopItemsGrid.appendChild(card);
        });

        // Event delegation for Shop actions
        this.shopItemsGrid.querySelectorAll('.btn-shop-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = btn.dataset.action;
                const itemId = btn.dataset.id;
                const category = btn.dataset.category || this.currentShopCategory;

                if (action === 'buy') {
                    const result = this.rewards.buyItem(itemId);
                    if (result.success) {
                        this.sound.playBuySuccess();
                        this.showNotification(`🎉 Purchased ${result.item.name}!`, 'success');
                        this.applyCustomizationEffects();
                        this.updateShopUI();
                        this.renderShopItems();
                    } else {
                        this.showNotification(result.error || 'Cannot afford item', 'error');
                    }
                } else if (action === 'equip') {
                    const result = this.rewards.equipItem(category, itemId);
                    if (result.success) {
                        this.sound.playEquip();
                        this.showNotification(`Equipped item!`, 'success');
                        this.applyCustomizationEffects();
                        this.updateShopUI();
                        this.renderShopItems();
                    }
                }
            });
        });
    }

    applyCustomizationEffects() {
        this.applyBoardTheme();
        this.updateLobbyPlayerList();
        this.updateLeaderboard();
        // Update network player object
        if (this.network && this.rewards) {
            const me = this.players.find(p => p.id === this.network.playerId);
            if (me) {
                me.avatar = this.rewards.getEquippedAvatar();
                me.title = this.rewards.getEquippedTitle();
                if (this.network.isHost) {
                    this.network.broadcast({
                        type: 'SYNC_PLAYERS',
                        players: this.players
                    });
                }
            }
        }
    }

    undoLastStroke() {
        if (!this.canDraw || this.strokeHistory.length === 0) return;
        this.strokeHistory.pop();
        this.clearCanvas(false);
        this.redrawHistory();

        if (this.mode === 'MULTIPLAYER') {
            this.network.broadcast({
                type: 'UNDO_STROKE',
                history: this.strokeHistory
            });
        }
    }

    redrawHistory() {
        this.strokeHistory.forEach(action => {
            if (action.type === 'fill') {
                this.floodFill(action.x, action.y, action.color, false);
            } else if (action.points && action.points.length > 0) {
                const pts = action.points;
                if (pts.length === 1) {
                    this.drawDot(pts[0].x, pts[0].y, action.color, action.size);
                } else {
                    for (let i = 1; i < pts.length; i++) {
                        this.drawLine(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y, action.color, action.size);
                    }
                }
            }
        });
    }

    downloadDrawing() {
        try {
            const link = document.createElement('a');
            link.download = `doodle-guess-${Date.now()}.png`;
            link.href = this.canvas.toDataURL('image/png');
            link.click();
            this.showNotification('Artwork downloaded as PNG! 🎨', 'success');
        } catch (e) {
            this.showNotification('Failed to download image', 'error');
        }
    }

    /* ----------------------------------------------------
       EVENT LISTENERS & LOBBY CONTROLS
    ---------------------------------------------------- */
    initEventListeners() {
        // Sound toggle
        const btnSound = document.getElementById('btn-sound-toggle');
        if (btnSound) {
            btnSound.addEventListener('click', () => {
                this.sound.init();
                const muted = this.sound.toggleMute();
                document.getElementById('sound-icon').textContent = muted ? '🔇' : '🔊';
                document.getElementById('sound-text').textContent = muted ? 'Sound OFF' : 'Sound ON';
            });
        }

        // How to Play modal
        document.getElementById('btn-help-toggle')?.addEventListener('click', () => {
            this.modalHelp.classList.remove('hidden');
        });
        document.getElementById('btn-close-help')?.addEventListener('click', () => {
            this.modalHelp.classList.add('hidden');
        });

        // Rewards & Shop Modal
        this.btnShopToggle?.addEventListener('click', () => {
            this.openShop();
        });
        this.btnCloseShop?.addEventListener('click', () => {
            this.closeShop();
        });

        this.shopTabButtons?.forEach(btn => {
            btn.addEventListener('click', () => {
                this.sound.playUiClick();
                this.shopTabButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentShopCategory = btn.dataset.category || 'avatars';
                this.renderShopItems();
            });
        });

        // Menu Mode Tabs
        const tabMultiplayer = document.getElementById('tab-btn-multiplayer');
        const tabSolo = document.getElementById('tab-btn-solo');
        const contentMultiplayer = document.getElementById('tab-content-multiplayer');
        const contentSolo = document.getElementById('tab-content-solo');

        tabMultiplayer?.addEventListener('click', () => {
            tabMultiplayer.classList.add('active');
            tabSolo.classList.remove('active');
            contentMultiplayer.classList.remove('hidden');
            contentSolo.classList.add('hidden');
            this.sound.playUiClick();
        });

        tabSolo?.addEventListener('click', () => {
            tabSolo.classList.add('active');
            tabMultiplayer.classList.remove('active');
            contentSolo.classList.remove('hidden');
            contentMultiplayer.classList.remove('hidden');
            contentMultiplayer.classList.add('hidden');
            this.sound.playUiClick();
        });

        // Host / Join sub-toggle
        const subHost = document.getElementById('sub-tab-host');
        const subJoin = document.getElementById('sub-tab-join');
        const formHost = document.getElementById('form-host-room') || document.getElementById('panel-host');
        const formJoin = document.getElementById('form-join-room') || document.getElementById('panel-join');

        subHost?.addEventListener('click', () => {
            subHost.classList.add('active');
            subJoin.classList.remove('active');
            formHost?.classList.remove('hidden');
            formJoin?.classList.add('hidden');
            this.sound.playUiClick();
        });

        subJoin?.addEventListener('click', () => {
            subJoin.classList.add('active');
            subHost.classList.remove('active');
            formJoin?.classList.remove('hidden');
            formHost?.classList.add('hidden');
            this.sound.playUiClick();
        });

        // Host Form Submit & Button Click
        const handleHostRoom = (e) => {
            if (e) e.preventDefault();
            this.sound.init();
            const nameInput = document.getElementById('host-player-name');
            const name = (nameInput && nameInput.value.trim()) || 'PixelArtist';
            const roundsEl = document.getElementById('host-rounds');
            const drawTimeEl = document.getElementById('host-draw-time');
            const rounds = parseInt(roundsEl?.value, 10) || 3;
            const drawTime = parseInt(drawTimeEl?.value, 10) || 60;
            this.maxRounds = rounds;
            this.roundDuration = drawTime;

            const roomCode = this.generateRoomCode();
            this.network.playerName = name;
            this.network.roomCode = roomCode;

            // Instantly transition to the lobby screen so user gets immediate visual feedback!
            this.onHostRoomReady(roomCode, name);

            // Connect networking in background
            this.network.createRoom(roomCode, name);
        };

        const hostForm = document.getElementById('form-host-room') || document.getElementById('panel-host');
        hostForm?.addEventListener('submit', handleHostRoom);
        document.getElementById('btn-submit-host')?.addEventListener('click', (e) => {
            handleHostRoom(e);
        });

        // Join Form Submit & Button Click
        const handleJoinRoom = (e) => {
            if (e) e.preventDefault();
            this.sound.init();
            const nameInput = document.getElementById('join-player-name');
            const name = (nameInput && nameInput.value.trim()) || 'Guesser';
            const codeInput = document.getElementById('join-room-code');
            const code = (codeInput && codeInput.value.trim().toUpperCase()) || '';

            if (!code || code.length < 3) {
                this.showNotification('Please enter a valid room code (e.g. DG849)!', 'error');
                return;
            }

            this.showNotification(`Connecting to room ${code}...`, 'info');
            this.network.joinRoom(code, name);
        };

        const joinForm = document.getElementById('form-join-room') || document.getElementById('panel-join');
        joinForm?.addEventListener('submit', handleJoinRoom);
        document.getElementById('btn-submit-join')?.addEventListener('click', (e) => {
            handleJoinRoom(e);
        });

        // Start Solo Challenge
        document.getElementById('btn-start-solo-guess')?.addEventListener('click', () => {
            this.startSoloGuessMode();
        });

        // Start Free Draw
        document.getElementById('btn-start-free-draw')?.addEventListener('click', () => {
            this.startFreeDrawMode();
        });

        // Lobby Actions
        document.getElementById('btn-copy-code')?.addEventListener('click', () => {
            if (this.network.roomCode) {
                navigator.clipboard.writeText(this.network.roomCode);
                this.showNotification('Room code copied to clipboard! 📋', 'success');
            }
        });

        document.getElementById('btn-copy-link')?.addEventListener('click', () => {
            if (this.network.roomCode) {
                const link = `${window.location.origin}${window.location.pathname}?room=${this.network.roomCode}`;
                navigator.clipboard.writeText(link);
                this.showNotification('Invite link copied! Share with friends 🔗', 'success');
            }
        });

        document.getElementById('btn-share-room')?.addEventListener('click', () => {
            if (this.network.roomCode && navigator.share) {
                const link = `${window.location.origin}${window.location.pathname}?room=${this.network.roomCode}`;
                navigator.share({
                    title: 'Play Doodle Guess with me!',
                    text: `Join my private room (${this.network.roomCode}) on Mini Game Arcade:`,
                    url: link
                }).catch(() => {});
            } else {
                document.getElementById('btn-copy-link')?.click();
            }
        });

        document.getElementById('btn-start-game')?.addEventListener('click', () => {
            if (this.players.length < 1) {
                this.showNotification('Need at least 1 player to start!', 'error');
                return;
            }
            this.startMultiplayerGame();
        });

        document.getElementById('btn-leave-lobby')?.addEventListener('click', () => {
            this.network.disconnect();
            this.showMenuScreen();
        });

        // Drawing Tools
        this.colorButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.colorButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.brushColor = btn.dataset.color;
                this.isEraser = false;
                this.btnEraser?.classList.remove('active');
                this.sound.playUiClick();
            });
        });

        this.sizeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.sizeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.brushSize = parseInt(btn.dataset.size, 10);
                this.isEraser = false;
                this.isFillMode = false;
                this.btnEraser?.classList.remove('active');
                this.btnFill?.classList.remove('active');
                this.canvasContainer?.classList.remove('fill-cursor');
                this.sound.playUiClick();
            });
        });

        this.btnFill?.addEventListener('click', () => {
            this.isFillMode = !this.isFillMode;
            this.btnFill.classList.toggle('active', this.isFillMode);
            this.canvasContainer?.classList.toggle('fill-cursor', this.isFillMode);
            if (this.isFillMode) {
                this.isEraser = false;
                this.btnEraser?.classList.remove('active');
                this.showNotification('Paint Bucket active! Click any enclosed area to fill 🪣', 'info');
            }
            this.sound.playUiClick();
        });

        this.btnEraser?.addEventListener('click', () => {
            this.isEraser = !this.isEraser;
            this.btnEraser.classList.toggle('active', this.isEraser);
            if (this.isEraser) {
                this.isFillMode = false;
                this.btnFill?.classList.remove('active');
                this.canvasContainer?.classList.remove('fill-cursor');
            }
            this.sound.playUiClick();
        });

        this.btnUndo?.addEventListener('click', () => {
            this.undoLastStroke();
            this.sound.playUiClick();
        });

        this.btnClear?.addEventListener('click', () => {
            this.clearCanvas(true);
            this.strokeHistory = [];
            this.sound.playUiClick();
        });

        this.btnDownload?.addEventListener('click', () => {
            this.downloadDrawing();
        });

        // Chat Form Submit
        this.chatForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleChatSubmit();
        });

        // Leave / Back from Active Game
        document.getElementById('btn-leave-game')?.addEventListener('click', () => {
            if (confirm('Leave current game and return to menu?')) {
                clearInterval(this.timerInterval);
                clearInterval(this.soloAnimationTimer);
                this.network.disconnect();
                this.showMenuScreen();
            }
        });
    }

    checkUrlRoomParam() {
        try {
            const params = new URLSearchParams(window.location.search);
            const room = params.get('room');
            if (room) {
                // Switch to Join Tab automatically
                document.getElementById('sub-tab-join')?.click();
                const input = document.getElementById('join-room-code');
                if (input) {
                    input.value = room.toUpperCase();
                    this.showNotification(`Room code ${room.toUpperCase()} loaded! Enter your nickname.`, 'info');
                }
            }
        } catch (e) {}
    }

    generateRoomCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 5; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    showNotification(msg, type = 'info') {
        if (!this.toast) return;
        this.toast.textContent = msg;
        this.toast.className = `toast-popup toast-${type} show`;
        setTimeout(() => {
            this.toast.classList.remove('show');
        }, 3200);
    }

    /* ----------------------------------------------------
       LOBBY & MULTIPLAYER FLOW
    ---------------------------------------------------- */
    onHostRoomReady(roomCode, hostName) {
        this.mode = 'MULTIPLAYER';
        if (hostName) this.network.playerName = hostName;
        this.players = [{
            id: this.network.playerId,
            name: this.network.playerName || 'PixelArtist',
            avatar: this.rewards ? this.rewards.getEquippedAvatar() : '🎮',
            title: this.rewards ? this.rewards.getEquippedTitle() : 'Rookie Doodler',
            score: 0,
            isHost: true,
            hasGuessed: false
        }];

        this.showLobbyScreen(roomCode, true);
        this.updateLobbyPlayerList();
        this.showNotification(`Room ${roomCode} created! Share the code with friends.`, 'success');
    }

    onJoinedRoomSuccess(roomCode) {
        this.mode = 'MULTIPLAYER';
        this.showLobbyScreen(roomCode, false);
        this.showNotification(`Joined room ${roomCode}! Waiting for host to start...`, 'success');
    }

    onHostDisconnected() {
        this.showNotification('Host disconnected. Returning to lobby.', 'error');
        this.showMenuScreen();
    }

    showMenuScreen() {
        this.screenMenu.classList.remove('hidden');
        this.screenGame.classList.add('hidden');
        this.screenLobby.classList.add('hidden');
        this.modalGameOver.classList.add('hidden');
        this.modalRoundSummary.classList.add('hidden');
        this.modalWordSelect.classList.add('hidden');
    }

    showLobbyScreen(roomCode, isHost) {
        this.screenMenu.classList.add('hidden');
        this.screenGame.classList.add('hidden');
        this.screenLobby.classList.remove('hidden');

        document.getElementById('lobby-room-code-display').textContent = roomCode;
        const btnStart = document.getElementById('btn-start-game');
        if (btnStart) {
            btnStart.style.display = isHost ? 'inline-flex' : 'none';
        }
        document.getElementById('lobby-waiting-msg').textContent = isHost ? 
            'You are the Host. Click Start Game when your friends join!' : 
            'Waiting for Host to start the match...';
    }

    updateLobbyPlayerList() {
        const list = document.getElementById('lobby-players-list');
        if (!list) return;
        list.innerHTML = '';

        this.players.forEach(p => {
            const item = document.createElement('div');
            item.className = 'lobby-player-card';
            item.innerHTML = `
                <span class="player-avatar">${p.avatar || '🎮'}</span>
                <span class="player-name">
                    ${this.escapeHTML(p.name)}
                    ${p.title ? `<span class="player-title-badge">${this.escapeHTML(p.title)}</span>` : ''}
                </span>
                ${p.isHost ? '<span class="badge-host">HOST</span>' : ''}
            `;
            list.appendChild(item);
        });

        // Also broadcast updated list if host
        if (this.network.isHost) {
            this.network.broadcast({
                type: 'SYNC_PLAYERS',
                players: this.players
            });
        }
    }

    startMultiplayerGame() {
        this.gameState = 'WORD_SELECT';
        this.roundNumber = 1;
        this.currentDrawerIndex = 0;
        this.nextMultiplayerRound();
    }

    nextMultiplayerRound() {
        if (this.roundNumber > this.maxRounds) {
            this.endMultiplayerGame();
            return;
        }

        // Reset player round flags
        this.players.forEach(p => p.hasGuessed = false);

        // Select next drawer in round-robin fashion
        const drawer = this.players[this.currentDrawerIndex % this.players.length];
        this.currentDrawerId = drawer.id;
        this.currentDrawerIndex++;

        // Broadcast and execute Word Selection
        if (this.network.isHost) {
            const words = this.pickThreeWords();
            const msg = {
                type: 'ROUND_WORD_SELECT',
                roundNumber: this.roundNumber,
                maxRounds: this.maxRounds,
                drawerId: this.currentDrawerId,
                drawerName: drawer.name,
                wordChoices: words
            };
            this.network.broadcast(msg);
            this.handleNetworkMessage(msg);
        }
    }

    pickThreeWords() {
        const shuffled = [...window.ALL_WORDS].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 3);
    }

    startDrawingRound(word) {
        this.currentWord = word.trim().toUpperCase();
        this.gameState = 'DRAWING';
        this.timerSeconds = this.roundDuration;
        this.clearCanvas(false);
        this.strokeHistory = [];
        this.revealedHints = [];

        // Close any modals
        this.modalWordSelect.classList.add('hidden');
        this.modalRoundSummary.classList.add('hidden');

        // Show Game Arena
        this.screenLobby.classList.add('hidden');
        this.screenMenu.classList.add('hidden');
        this.screenGame.classList.remove('hidden');

        const isMeDrawer = (this.network.playerId === this.currentDrawerId);
        this.canDraw = isMeDrawer;

        // Toolbar visibility
        this.toolbar.style.display = isMeDrawer ? 'flex' : 'none';

        // HUD Setup
        this.roundDisplay.textContent = `${this.roundNumber} / ${this.maxRounds}`;
        const drawer = this.players.find(p => p.id === this.currentDrawerId);
        this.drawerStatusText.textContent = isMeDrawer ? 'You are drawing!' : `${drawer ? drawer.name : 'Player'} is drawing`;

        this.updateWordHintDisplay();
        this.updateLeaderboard();
        this.addChatMessage('system', `🔔 Round ${this.roundNumber} started! ${isMeDrawer ? `Your word is: ${this.currentWord}` : `${drawer ? drawer.name : 'Drawer'} is drawing!`}`);
        this.sound.playRoundStart();

        // Start Round Timer
        clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            this.timerSeconds--;
            this.timerDisplay.textContent = this.formatTime(this.timerSeconds);

            if (this.timerSeconds <= 10 && this.timerSeconds > 0) {
                this.sound.playClockTick();
            }

            // Reveal letter hints at 40s and 20s
            if (!isMeDrawer) {
                if (this.timerSeconds === 40 || this.timerSeconds === 20) {
                    this.revealRandomLetterHint();
                }
            }

            if (this.timerSeconds <= 0) {
                clearInterval(this.timerInterval);
                this.onRoundTimeUp();
            }
        }, 1000);
    }

    revealRandomLetterHint() {
        const letters = this.currentWord.split('');
        const unrevealedIndices = [];
        for (let i = 0; i < letters.length; i++) {
            if (letters[i] !== ' ' && !this.revealedHints.includes(i)) {
                unrevealedIndices.push(i);
            }
        }
        if (unrevealedIndices.length > 0) {
            const pick = unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)];
            this.revealedHints.push(pick);
            this.updateWordHintDisplay();
            this.addChatMessage('system', `💡 Hint: A letter was revealed!`);
        }
    }

    updateWordHintDisplay() {
        const isMeDrawer = (this.network.playerId === this.currentDrawerId);
        if (isMeDrawer) {
            this.wordHintDisplay.textContent = this.currentWord;
            this.wordHintDisplay.classList.add('word-revealed');
            this.drawerStatusText.textContent = '✏️ You are drawing!';
        } else {
            this.wordHintDisplay.classList.remove('word-revealed');
            const letters = this.currentWord.split('');
            const display = letters.map((char, index) => {
                if (char === ' ') return '  ';
                if (this.revealedHints.includes(index)) return char;
                return '_';
            }).join(' ');
            this.wordHintDisplay.textContent = display;
            const wordLen = this.currentWord.replace(/\s+/g, '').length;
            const drawer = this.players.find(p => p.id === this.currentDrawerId);
            this.drawerStatusText.textContent = `${drawer ? drawer.name : 'Player'} is drawing (${wordLen} letters)`;
        }
    }

    onRoundTimeUp() {
        this.canDraw = false;
        this.sound.playRoundEnd();
        this.addChatMessage('system', `⌛ Time's up! The secret word was: ${this.currentWord}`);

        // Broadcast to guests if host
        if (this.network.isHost) {
            this.network.broadcast({
                type: 'ROUND_TIME_UP',
                word: this.currentWord
            });
        }

        // Show Round Summary Modal
        document.getElementById('summary-secret-word').textContent = this.currentWord;
        this.modalRoundSummary.classList.remove('hidden');

        setTimeout(() => {
            this.modalRoundSummary.classList.add('hidden');
            if (this.network.isHost) {
                this.roundNumber++;
                this.nextMultiplayerRound();
            }
        }, 4500);
    }

    endMultiplayerGame() {
        clearInterval(this.timerInterval);
        this.gameState = 'GAME_OVER';
        this.canDraw = false;

        // Broadcast match finish to guests
        if (this.network.isHost) {
            this.network.broadcast({
                type: 'GAME_OVER',
                players: this.players
            });
        }

        // Sort players by score
        const sorted = [...this.players].sort((a, b) => b.score - a.score);
        const winner = sorted[0] || { name: 'Nobody', score: 0 };

        document.getElementById('game-over-winner-name').textContent = winner.name;
        document.getElementById('game-over-winner-score').textContent = `${winner.score} pts`;

        const podiumList = document.getElementById('podium-players-list');
        if (podiumList) {
            podiumList.innerHTML = '';
            sorted.forEach((p, rank) => {
                const item = document.createElement('div');
                item.className = 'podium-item';
                const medal = rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `#${rank + 1}`;
                item.innerHTML = `
                    <span class="podium-rank">${medal}</span>
                    <span class="podium-name">${this.escapeHTML(p.name)}</span>
                    <span class="podium-score">${p.score} pts</span>
                `;
                podiumList.appendChild(item);
            });
        }

        this.modalGameOver.classList.remove('hidden');
        this.sound.playCorrectGuess();

        if (this.rewards) {
            if (winner && this.network.playerId === winner.id) {
                this.rewards.addCoins(150, '1st place match champion!');
                this.sound.playCoinReward();
                this.showNotification('🏆 +150 Coins for Match Victory!', 'success');
            } else if (sorted[1] && this.network.playerId === sorted[1].id) {
                this.rewards.addCoins(75, '2nd place runner-up!');
                this.sound.playCoinReward();
                this.showNotification('🥈 +75 Coins Runner-up Bonus!', 'success');
            }
        }
    }

    /* ----------------------------------------------------
       NETWORK MESSAGES HANDLER
    ---------------------------------------------------- */
    handleNetworkMessage(data, fromConn) {
        switch (data.type) {
            case 'PLAYER_JOIN':
                if (this.network.isHost) {
                    // Check if already in list
                    if (!this.players.some(p => p.id === data.playerId)) {
                        this.players.push({
                            id: data.playerId,
                            name: data.name,
                            avatar: data.avatar || '🎮',
                            title: data.title || 'Rookie Doodler',
                            score: 0,
                            isHost: false,
                            hasGuessed: false
                        });
                        this.updateLobbyPlayerList();
                        this.addChatMessage('system', `👋 ${data.name} joined the room!`);
                    }
                }
                break;

            case 'SYNC_PLAYERS':
                this.players = data.players;
                this.updateLobbyPlayerList();
                this.updateLeaderboard();
                break;

            case 'ROUND_WORD_SELECT':
                this.roundNumber = data.roundNumber;
                this.maxRounds = data.maxRounds;
                this.currentDrawerId = data.drawerId;

                // Close lobby and modals, transition to game arena immediately!
                this.screenLobby.classList.add('hidden');
                this.screenMenu.classList.add('hidden');
                this.modalRoundSummary.classList.add('hidden');
                this.modalGameOver.classList.add('hidden');
                this.screenGame.classList.remove('hidden');

                this.roundDisplay.textContent = `${this.roundNumber} / ${this.maxRounds}`;
                const currentDrawer = this.players.find(p => p.id === this.currentDrawerId);
                const isMeDrawer = (this.network.playerId === this.currentDrawerId);
                this.drawerStatusText.textContent = isMeDrawer ? 'You are choosing a word...' : `${currentDrawer ? currentDrawer.name : 'Player'} is choosing...`;
                this.updateLeaderboard();

                if (isMeDrawer) {
                    // I am the drawer! Display 3 word choices
                    this.showWordSelectModal(data.wordChoices);
                } else {
                    this.toolbar.style.display = 'none';
                    this.canDraw = false;
                    this.addChatMessage('system', `🎨 ${data.drawerName} is choosing a word...`);
                }
                break;

            case 'START_ROUND':
                this.currentDrawerId = data.drawerId;
                this.startDrawingRound(data.word);
                break;

            case 'DRAW_BATCH':
                if (this.network.playerId !== this.currentDrawerId) {
                    const pts = data.points;
                    if (pts && pts.length >= 4) {
                        for (let i = 0; i < pts.length - 2; i += 2) {
                            this.drawLine(pts[i], pts[i + 1], pts[i + 2], pts[i + 3], data.color, data.size);
                        }
                    } else if (pts && pts.length === 2) {
                        this.drawDot(pts[0], pts[1], data.color, data.size);
                    }
                }
                break;

            case 'DRAW_DOT':
                if (this.network.playerId !== this.currentDrawerId) {
                    this.drawDot(data.x, data.y, data.color, data.size);
                }
                break;

            case 'DRAW_LINE':
                if (this.network.playerId !== this.currentDrawerId) {
                    this.drawLine(data.x0, data.y0, data.x1, data.y1, data.color, data.size);
                }
                break;

            case 'FLOOD_FILL':
                if (this.network.playerId !== this.currentDrawerId) {
                    this.floodFill(data.x, data.y, data.color, false);
                }
                break;

            case 'CLEAR_CANVAS':
                this.clearCanvas(false);
                break;

            case 'UNDO_STROKE':
                this.strokeHistory = data.history || [];
                this.clearCanvas(false);
                this.redrawHistory();
                break;

            case 'CHAT_MESSAGE':
                this.addChatMessage(data.senderName, data.text);
                break;

            case 'CORRECT_GUESS_BROADCAST':
                this.players = data.players;
                this.updateLeaderboard();
                this.sound.playCorrectGuess();
                this.addChatMessage('correct', `🎉 ${data.guesserName} guessed the word! (+${data.pointsAwarded} pts)`);

                if (this.network.playerId === this.currentDrawerId && this.rewards) {
                    this.rewards.addCoins(25, 'Drawing was guessed!');
                    this.sound.playCoinReward();
                    this.showNotification('🪙 +25 Coins (Artist Bonus)!', 'success');
                }

                if (this.network.isHost) {
                    const guessers = this.players.filter(p => p.id !== this.currentDrawerId);
                    if (guessers.length > 0 && guessers.every(g => g.hasGuessed)) {
                        clearInterval(this.timerInterval);
                        this.onRoundTimeUp();
                    }
                }
                break;

            case 'ROUND_TIME_UP':
                if (!this.network.isHost) {
                    this.currentWord = data.word || this.currentWord;
                    this.onRoundTimeUp();
                }
                break;

            case 'GAME_OVER':
                if (!this.network.isHost) {
                    this.players = data.players || this.players;
                    this.endMultiplayerGame();
                }
                break;
        }
    }

    showWordSelectModal(words) {
        const container = document.getElementById('word-choices-container');
        if (!container) return;
        container.innerHTML = '';

        words.forEach(word => {
            const btn = document.createElement('button');
            btn.className = 'btn btn-word-choice';
            btn.textContent = word;
            btn.addEventListener('click', () => {
                this.modalWordSelect.classList.add('hidden');
                // Broadcast round start to everyone
                this.network.broadcast({
                    type: 'START_ROUND',
                    drawerId: this.network.playerId,
                    word: word
                });
                this.startDrawingRound(word);
            });
            container.appendChild(btn);
        });

        this.modalWordSelect.classList.remove('hidden');
    }

    /* ----------------------------------------------------
       CHAT & GUESSING SYSTEM
    ---------------------------------------------------- */
    handleChatSubmit() {
        const text = this.chatInput.value.trim();
        if (!text) return;
        this.chatInput.value = '';

        // If Solo Guess Mode
        if (this.mode === 'SOLO_GUESS') {
            this.handleSoloGuess(text);
            return;
        }

        // Multiplayer logic
        const me = this.players.find(p => p.id === this.network.playerId);
        const isDrawer = (this.network.playerId === this.currentDrawerId);

        if (this.gameState === 'DRAWING' && !isDrawer && !me?.hasGuessed) {
            const cleanGuess = text.toUpperCase();
            if (cleanGuess === this.currentWord) {
                // Correct guess!
                me.hasGuessed = true;
                const points = Math.max(100, Math.floor(this.timerSeconds * 5));
                me.score += points;

                // Award drawer points too (+50 per correct guesser)
                const drawer = this.players.find(p => p.id === this.currentDrawerId);
                if (drawer) drawer.score += 50;

                this.network.broadcast({
                    type: 'CORRECT_GUESS_BROADCAST',
                    guesserId: me.id,
                    guesserName: me.name,
                    pointsAwarded: points,
                    players: this.players
                });

                this.sound.playCorrectGuess();
                this.addChatMessage('correct', `🎉 You guessed the word! (+${points} pts)`);
                this.updateLeaderboard();

                if (this.rewards) {
                    this.rewards.addCoins(50, 'Correct guess: ' + this.currentWord);
                    this.sound.playCoinReward();
                    this.showNotification('🪙 +50 Coins Earned!', 'success');
                }

                // Check if all non-drawers have guessed
                const guessers = this.players.filter(p => p.id !== this.currentDrawerId);
                if (guessers.every(g => g.hasGuessed)) {
                    clearInterval(this.timerInterval);
                    this.onRoundTimeUp();
                }
                return;
            } else if (this.isCloseMatch(cleanGuess, this.currentWord)) {
                this.addChatMessage('system', `👀 '${text}' is very close!`);
                return;
            }
        }

        // Normal chat message broadcast
        const senderName = me ? me.name : 'Player';
        this.addChatMessage(senderName, text);
        this.network.broadcast({
            type: 'CHAT_MESSAGE',
            senderName: senderName,
            text: text
        });
    }

    isCloseMatch(guess, actual) {
        if (Math.abs(guess.length - actual.length) > 1) return false;
        let diffs = 0;
        const minLen = Math.min(guess.length, actual.length);
        for (let i = 0; i < minLen; i++) {
            if (guess[i] !== actual[i]) diffs++;
        }
        return (diffs === 1 && guess.length === actual.length);
    }

    addChatMessage(sender, text) {
        const item = document.createElement('div');
        item.className = `chat-bubble chat-${sender.toLowerCase()}`;

        if (sender === 'system') {
            item.innerHTML = `<span class="chat-system-text">${this.escapeHTML(text)}</span>`;
        } else if (sender === 'correct') {
            item.innerHTML = `<span class="chat-correct-text">${this.escapeHTML(text)}</span>`;
        } else {
            item.innerHTML = `<strong class="chat-sender">${this.escapeHTML(sender)}:</strong> <span class="chat-text">${this.escapeHTML(text)}</span>`;
        }

        this.chatMessages.appendChild(item);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    updateLeaderboard() {
        if (!this.leaderboardList) return;
        this.leaderboardList.innerHTML = '';

        const sorted = [...this.players].sort((a, b) => b.score - a.score);
        sorted.forEach((p, idx) => {
            const card = document.createElement('div');
            card.className = `player-score-card ${p.id === this.currentDrawerId ? 'is-drawing' : ''} ${p.hasGuessed ? 'has-guessed' : ''}`;
            card.innerHTML = `
                <div class="score-card-left">
                    <span class="player-rank">#${idx + 1}</span>
                    <span class="player-avatar">${p.id === this.currentDrawerId ? '✏️' : (p.avatar || '🎮')}</span>
                    <span class="player-name">
                        ${this.escapeHTML(p.name)}
                        ${p.title ? `<span class="player-title-badge">${this.escapeHTML(p.title)}</span>` : ''}
                    </span>
                </div>
                <span class="player-score">${p.score} pts</span>
            `;
            this.leaderboardList.appendChild(card);
        });
    }

    /* ----------------------------------------------------
       SOLO CHALLENGE & FREE DRAW MODES
    ---------------------------------------------------- */
    startSoloGuessMode() {
        this.mode = 'SOLO_GUESS';
        this.soloScore = 0;
        this.roundNumber = 1;
        this.maxRounds = 5;
        this.soloDoodleIndex = 0;

        this.players = [{
            id: 'solo_player',
            name: 'You',
            avatar: this.rewards ? this.rewards.getEquippedAvatar() : '🎮',
            title: this.rewards ? this.rewards.getEquippedTitle() : 'Rookie Doodler',
            score: 0,
            isHost: true,
            hasGuessed: false
        }];

        this.screenMenu.classList.add('hidden');
        this.screenLobby.classList.add('hidden');
        this.screenGame.classList.remove('hidden');

        this.nextSoloRound();
    }

    nextSoloRound() {
        if (this.roundNumber > this.maxRounds) {
            this.endSoloMode();
            return;
        }

        const doodles = window.SOLO_BOT_DOODLES || [];
        const doodle = doodles[this.soloDoodleIndex % doodles.length];
        this.soloDoodleIndex++;

        this.currentWord = doodle.word.toUpperCase();
        this.canDraw = false;
        this.toolbar.style.display = 'none'; // Guessers don't draw
        this.clearCanvas(false);
        this.revealedHints = [];

        this.roundDisplay.textContent = `${this.roundNumber} / ${this.maxRounds}`;
        this.drawerStatusText.textContent = `🤖 CyberBot is drawing (${doodle.category})`;
        this.updateWordHintDisplay();
        this.updateLeaderboard();

        this.addChatMessage('system', `🤖 Round ${this.roundNumber}! CyberBot is drawing a ${doodle.category}. Type your guess!`);
        this.sound.playRoundStart();

        // Animate stroke sequence
        this.playBotDoodleAnimation(doodle);

        // Timer
        this.timerSeconds = 45;
        this.timerDisplay.textContent = this.formatTime(this.timerSeconds);
        clearInterval(this.timerInterval);

        this.timerInterval = setInterval(() => {
            this.timerSeconds--;
            this.timerDisplay.textContent = this.formatTime(this.timerSeconds);

            if (this.timerSeconds === 30 || this.timerSeconds === 15) {
                this.revealRandomLetterHint();
            }

            if (this.timerSeconds <= 0) {
                clearInterval(this.timerInterval);
                this.sound.playRoundEnd();
                this.addChatMessage('system', `⌛ Time's up! The answer was: ${this.currentWord}`);
                setTimeout(() => {
                    this.roundNumber++;
                    this.nextSoloRound();
                }, 3000);
            }
        }, 1000);
    }

    playBotDoodleAnimation(doodle) {
        clearInterval(this.soloAnimationTimer);
        let strokeIdx = 0;
        let pointIdx = 0;
        const strokes = doodle.strokes || [];

        this.soloAnimationTimer = setInterval(() => {
            if (strokeIdx >= strokes.length) {
                clearInterval(this.soloAnimationTimer);
                return;
            }

            const current = strokes[strokeIdx];
            const pts = current.points;

            if (pointIdx < pts.length) {
                const p = pts[pointIdx];
                const realX = p.x * this.logicalWidth;
                const realY = p.y * this.logicalHeight;

                if (pointIdx === 0) {
                    this.drawDot(realX, realY, current.color, current.size);
                } else {
                    const prev = pts[pointIdx - 1];
                    this.drawLine(prev.x * this.logicalWidth, prev.y * this.logicalHeight, realX, realY, current.color, current.size);
                }
                pointIdx++;
            } else {
                strokeIdx++;
                pointIdx = 0;
            }
        }, 120);
    }

    handleSoloGuess(guessText) {
        const clean = guessText.trim().toUpperCase();
        this.addChatMessage('You', guessText);

        if (clean === this.currentWord) {
            clearInterval(this.timerInterval);
            clearInterval(this.soloAnimationTimer);

            const points = 100 + (this.timerSeconds * 10);
            this.soloScore += points;
            this.players[0].score = this.soloScore;

            this.sound.playCorrectGuess();
            this.addChatMessage('correct', `🎉 Correct! It was ${this.currentWord}! (+${points} pts)`);
            this.updateLeaderboard();

            if (this.rewards) {
                this.rewards.addCoins(30, 'Solo word solved: ' + this.currentWord);
                this.sound.playCoinReward();
                this.showNotification('🪙 +30 Coins Earned!', 'success');
            }

            setTimeout(() => {
                this.roundNumber++;
                this.nextSoloRound();
            }, 2500);
        } else if (this.isCloseMatch(clean, this.currentWord)) {
            this.addChatMessage('system', `👀 '${guessText}' is very close!`);
        }
    }

    endSoloMode() {
        clearInterval(this.timerInterval);
        clearInterval(this.soloAnimationTimer);

        if (this.soloScore > this.soloHighscore) {
            this.soloHighscore = this.soloScore;
            try {
                localStorage.setItem('doodle_guess_solo_highscore', this.soloHighscore.toString());
            } catch (e) {}
        }

        document.getElementById('game-over-winner-name').textContent = 'Solo Challenge Complete!';
        document.getElementById('game-over-winner-score').textContent = `Final Score: ${this.soloScore} pts (Best: ${this.soloHighscore})`;

        const podiumList = document.getElementById('podium-players-list');
        if (podiumList) {
            podiumList.innerHTML = `
                <div class="podium-item">
                    <span class="podium-rank">🏆</span>
                    <span class="podium-name">Your Final Score</span>
                    <span class="podium-score">${this.soloScore} pts</span>
                </div>
            `;
        }

        this.modalGameOver.classList.remove('hidden');
    }

    startFreeDrawMode() {
        this.mode = 'FREE_DRAW';
        this.canDraw = true;
        this.clearCanvas(false);
        this.strokeHistory = [];

        this.screenMenu.classList.add('hidden');
        this.screenLobby.classList.add('hidden');
        this.screenGame.classList.remove('hidden');

        this.toolbar.style.display = 'flex';
        this.timerDisplay.textContent = '∞';
        this.roundDisplay.textContent = 'Free Draw';

        const randomWord = window.ALL_WORDS[Math.floor(Math.random() * window.ALL_WORDS.length)];
        this.wordHintDisplay.textContent = `Prompt: ${randomWord}`;
        this.drawerStatusText.textContent = 'Draw whatever you imagine!';

        this.players = [{ id: 'me', name: 'Artist', score: 0 }];
        this.updateLeaderboard();
        this.addChatMessage('system', `🎨 Free Draw Mode active! Prompt idea: "${randomWord}". Download your artwork when finished.`);
    }

    formatTime(sec) {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }

    escapeHTML(str) {
        if (!str) return '';
        return str.replace(/[&<>'"]/g, tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag));
    }
}

// Auto-boot upon DOM readiness
document.addEventListener('DOMContentLoaded', () => {
    window.doodleGame = new DoodleGuessGame();
});

