/**
 * Arcade Rewards, Economy & Customization Manager
 * High-performance, zero-latency store backed by LocalStorage with asynchronous Neon DB cloud sync.
 * Supports character avatars, canvas board themes, drawing brush effects, and player titles.
 */

(function(root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.ArcadeRewards = factory();
    }
}(typeof self !== 'undefined' ? self : this, function() {
    'use strict';

    const STORAGE_KEY = 'arcade_rewards_state_v1';

    const SHOP_CATALOG = {
        avatars: [
            { id: 'avatar_gamer', name: 'Retro Gamer', icon: '🎮', price: 0, description: 'Default arcade joystick avatar' },
            { id: 'avatar_bot', name: 'Cyber Droid', icon: '🤖', price: 100, description: 'Futuristic AI sketching assistant' },
            { id: 'avatar_artist', name: 'Pixel Artist', icon: '🎨', price: 150, description: 'Master of palettes and brushes' },
            { id: 'avatar_ninja', name: 'Ninja Cat', icon: '🐱', price: 200, description: 'Silent sketches in the dark' },
            { id: 'avatar_fox', name: 'Astro Fox', icon: '🦊', price: 250, description: 'Cosmic explorer of puzzles' },
            { id: 'avatar_crown', name: 'Golden Monarch', icon: '👑', price: 350, description: 'Royalty of the sketch arena' },
            { id: 'avatar_wizard', name: 'Void Sorcerer', icon: '🧙', price: 450, description: 'Conjures magical illusions' },
            { id: 'avatar_unicorn', name: 'Cyber Unicorn', icon: '🦄', price: 600, description: 'Legendary rainbow champion' }
        ],
        themes: [
            { id: 'theme_midnight', name: 'Midnight Void', icon: '🌑', price: 0, description: 'Deep space dark canvas (Default)', bgColor: '#0c101b', borderColor: '#23304a', isLight: false },
            { id: 'theme_chalkboard', name: 'Slate Chalkboard', icon: '🟩', price: 150, description: 'Classic green chalkboard texture', bgColor: '#14261c', borderColor: '#2d4d38', isLight: false },
            { id: 'theme_blueprint', name: 'Architect Blueprint', icon: '📐', price: 200, description: 'Engineering gridline background', bgColor: '#0b1b33', borderColor: '#1c427a', isLight: false },
            { id: 'theme_parchment', name: 'Vintage Parchment', icon: '📜', price: 250, description: 'Aged warm sepia sketchbook paper', bgColor: '#e6decb', borderColor: '#a38d6b', isLight: true },
            { id: 'theme_synthwave', name: 'Synthwave Cyber', icon: '🔮', price: 350, description: '80s retro neon purple dreamscape', bgColor: '#170c2a', borderColor: '#5e239d', isLight: false }
        ],
        brushFx: [
            { id: 'brush_classic', name: 'Classic Solid', icon: '✏️', price: 0, description: 'Crisp, clean vector strokes' },
            { id: 'brush_glow', name: 'Neon Glow', icon: '🌟', price: 200, description: 'Luminescent laser glow around lines' },
            { id: 'brush_rainbow', name: 'Rainbow Prism', icon: '🌈', price: 300, description: 'Prismatic shifting rainbow trail' }
        ],
        titles: [
            { id: 'title_rookie', name: 'Rookie Doodler', icon: '🌱', price: 0, description: 'Just starting the sketching journey' },
            { id: 'title_guesser', name: 'Quick Guesser', icon: '⚡', price: 75, description: 'Identifies drawings before anyone else' },
            { id: 'title_speed', name: 'Speed Demon', icon: '🏎️', price: 150, description: 'Lightning-fast reflexes' },
            { id: 'title_artist', name: 'Canvas Virtuoso', icon: '🖌️', price: 300, description: 'Craftsman of beautiful strokes' },
            { id: 'title_legend', name: 'Arcade Legend', icon: '🏆', price: 500, description: 'True champion of the arcade' }
        ]
    };

    class RewardsManager {
        constructor() {
            this.state = this.loadState();
            this.listeners = [];
            this.catalog = SHOP_CATALOG;
            this.isSyncing = false;
        }

        loadState() {
            const defaultState = {
                coins: 200, // 200 starter welcome bonus!
                unlocked: ['avatar_gamer', 'theme_midnight', 'brush_classic', 'title_rookie'],
                equipped: {
                    avatar: 'avatar_gamer',
                    theme: 'theme_midnight',
                    brushFx: 'brush_classic',
                    title: 'title_rookie'
                },
                stats: {
                    totalEarned: 200,
                    wordsGuessed: 0,
                    matchesWon: 0,
                    soloSolved: 0
                },
                userId: this.getOrCreateUserId(),
                lastSyncedAt: null
            };

            try {
                const raw = localStorage.getItem(STORAGE_KEY);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    return {
                        ...defaultState,
                        ...parsed,
                        equipped: { ...defaultState.equipped, ...(parsed.equipped || {}) },
                        stats: { ...defaultState.stats, ...(parsed.stats || {}) },
                        unlocked: Array.isArray(parsed.unlocked) ? parsed.unlocked : defaultState.unlocked
                    };
                }
            } catch (err) {
                console.warn('Could not read rewards state from localStorage:', err);
            }
            return defaultState;
        }

        saveState() {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
            } catch (err) {
                console.warn('Could not write rewards state to localStorage:', err);
            }
            this.notify();
            this.scheduleCloudSync();
        }

        getOrCreateUserId() {
            try {
                let id = localStorage.getItem('arcade_user_uuid');
                if (!id) {
                    id = 'usr_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
                    localStorage.setItem('arcade_user_uuid', id);
                }
                return id;
            } catch (e) {
                return 'usr_guest_' + Date.now();
            }
        }

        getCoins() {
            return this.state.coins || 0;
        }

        addCoins(amount, reason = '') {
            if (amount <= 0) return;
            this.state.coins = (this.state.coins || 0) + amount;
            this.state.stats.totalEarned = (this.state.stats.totalEarned || 0) + amount;
            this.saveState();
            return {
                coins: this.state.coins,
                amountAdded: amount,
                reason: reason
            };
        }

        isUnlocked(itemId) {
            return this.state.unlocked.includes(itemId);
        }

        canAfford(itemId) {
            const item = this.findItem(itemId);
            if (!item) return false;
            return this.state.coins >= item.price;
        }

        findItem(itemId) {
            for (const category of Object.keys(this.catalog)) {
                const found = this.catalog[category].find(i => i.id === itemId);
                if (found) {
                    return { ...found, category };
                }
            }
            return null;
        }

        buyItem(itemId) {
            if (this.isUnlocked(itemId)) {
                return { success: true, alreadyOwned: true };
            }

            const item = this.findItem(itemId);
            if (!item) {
                return { success: false, error: 'Item not found in catalog' };
            }

            if (this.state.coins < item.price) {
                return { success: false, error: `Need ${item.price - this.state.coins} more coins!` };
            }

            this.state.coins -= item.price;
            this.state.unlocked.push(itemId);
            // Automatically equip upon purchase
            this.state.equipped[item.category] = itemId;
            this.saveState();

            return {
                success: true,
                item: item,
                remainingCoins: this.state.coins
            };
        }

        equipItem(category, itemId) {
            if (!this.isUnlocked(itemId)) {
                return { success: false, error: 'Item is not unlocked yet' };
            }
            if (!this.state.equipped) {
                this.state.equipped = {};
            }
            this.state.equipped[category] = itemId;
            this.saveState();
            return { success: true, category, itemId };
        }

        getEquipped(category) {
            const id = this.state.equipped ? this.state.equipped[category] : null;
            if (id) {
                const item = this.findItem(id);
                if (item) return item;
            }
            // Return first item in category as fallback
            return this.catalog[category] && this.catalog[category][0] ? this.catalog[category][0] : null;
        }

        getEquippedAvatar() {
            const eq = this.getEquipped('avatars');
            return eq ? eq.icon : '🎮';
        }

        getEquippedTitle() {
            const eq = this.getEquipped('titles');
            return eq ? eq.name : 'Rookie Doodler';
        }

        getEquippedTheme() {
            return this.getEquipped('themes') || this.catalog.themes[0];
        }

        getEquippedBrushFx() {
            return this.getEquipped('brushFx') || this.catalog.brushFx[0];
        }

        subscribe(callback) {
            this.listeners.push(callback);
            return () => {
                this.listeners = this.listeners.filter(cb => cb !== callback);
            };
        }

        notify() {
            this.listeners.forEach(cb => {
                try {
                    cb(this.state);
                } catch (e) {
                    console.error('Rewards callback error:', e);
                }
            });
        }

        /**
         * Asynchronous Cloud Sync (Neon Postgres Ready)
         * Debounced to avoid repeated network calls.
         */
        scheduleCloudSync() {
            if (this.syncTimer) clearTimeout(this.syncTimer);
            this.syncTimer = setTimeout(() => {
                this.syncWithCloud();
            }, 3000);
        }

        async syncWithCloud() {
            if (this.isSyncing) return;
            try {
                this.isSyncing = true;
                const payload = {
                    userId: this.state.userId,
                    coins: this.state.coins,
                    unlocked: this.state.unlocked,
                    equipped: this.state.equipped,
                    stats: this.state.stats
                };

                const res = await fetch('/api/rewards/sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data && data.success) {
                        this.state.lastSyncedAt = Date.now();
                    }
                }
            } catch (err) {
                // Offline or serverless endpoint not active yet - gracefully ignored
            } finally {
                this.isSyncing = false;
            }
        }
    }

    return new RewardsManager();
}));
