/**
 * Mini Game Arcade - Homepage Controller
 * Handles dynamic game card rendering, real-time search, category filtering, and empty states.
 */

class ArcadeHomeController {
    constructor() {
        this.games = window.ARCADE_GAMES || [];
        this.activeCategory = 'all';
        this.searchQuery = '';

        this.gridEl = document.getElementById('games-grid');
        this.searchInput = document.getElementById('search-games');
        this.resultsCountEl = document.getElementById('results-count');
        this.filterButtons = document.querySelectorAll('.btn-filter');

        this.init();
    }

    init() {
        // Setup Search Listener
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.trim().toLowerCase();
                this.render();
            });
        }

        // Setup Category Filter Buttons
        if (this.filterButtons) {
            this.filterButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    this.filterButtons.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.activeCategory = btn.getAttribute('data-category') || 'all';
                    this.render();
                });
            });
        }

        // Initial render
        this.render();
        this.updateRewardsUI();
    }

    updateRewardsUI() {
        const counter = document.getElementById('home-coins-counter');
        if (counter && window.ArcadeRewards) {
            counter.textContent = window.ArcadeRewards.getCoins().toLocaleString();
            window.ArcadeRewards.subscribe((state) => {
                counter.textContent = (state.coins || 0).toLocaleString();
            });
        }
    }

    getFilteredGames() {
        return this.games.filter(game => {
            // Category match
            const matchesCategory = (this.activeCategory === 'all') || (game.category === this.activeCategory);

            // Search query match (title, description, tags, categoryName)
            if (!this.searchQuery) return matchesCategory;

            const inTitle = game.title.toLowerCase().includes(this.searchQuery);
            const inDesc = game.description.toLowerCase().includes(this.searchQuery);
            const inCat = game.categoryName.toLowerCase().includes(this.searchQuery);
            const inTags = game.tags && game.tags.some(tag => tag.toLowerCase().includes(this.searchQuery));

            return matchesCategory && (inTitle || inDesc || inCat || inTags);
        });
    }

    render() {
        if (!this.gridEl) return;

        const filtered = this.getFilteredGames();

        // Update count text
        if (this.resultsCountEl) {
            this.resultsCountEl.textContent = `Showing ${filtered.length} of ${this.games.length} games`;
        }

        if (filtered.length === 0) {
            this.gridEl.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">🔍</span>
                    <h3>No matching games found</h3>
                    <p>No games matched "${this.escapeHtml(this.searchQuery)}". Try clearing your search or selecting another category.</p>
                    <button class="btn btn-secondary" onclick="window.arcadeHome.resetFilters()">
                        <span>Reset Filters</span>
                    </button>
                </div>
            `;
            return;
        }

        this.gridEl.innerHTML = filtered.map(game => `
            <article class="game-card" id="card-${game.id}">
                <div class="card-thumbnail">
                    ${game.svgIllustration}
                    <span class="card-badge ${game.badge === 'New' ? 'badge-new' : ''}">${game.badge}</span>
                </div>
                <div class="card-body">
                    <span class="card-category">${this.escapeHtml(game.categoryName)}</span>
                    <h3 class="card-title">${this.escapeHtml(game.title)}</h3>
                    <p class="card-description">${this.escapeHtml(game.description)}</p>
                    <div class="card-meta">
                        <span>🎮 ${this.escapeHtml(game.controls)}</span>
                    </div>
                </div>
                <div class="card-footer">
                    <a href="${game.route}" class="btn btn-primary btn-play-card" aria-label="Play ${this.escapeHtml(game.title)}">
                        <span>▶ PLAY NOW</span>
                    </a>
                </div>
            </article>
        `).join('');
    }

    resetFilters() {
        this.activeCategory = 'all';
        this.searchQuery = '';
        if (this.searchInput) this.searchInput.value = '';
        if (this.filterButtons) {
            this.filterButtons.forEach(btn => {
                btn.classList.toggle('active', btn.getAttribute('data-category') === 'all');
            });
        }
        this.render();
    }

    escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.arcadeHome = new ArcadeHomeController();
});

