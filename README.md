# 🕹️ Mini Game Arcade

A fast, responsive, and ad-free HTML5 browser arcade featuring instant-play mini-games. Built with vanilla **HTML5 Canvas 2D**, **CSS3**, and the **Web Audio API** — 100% client-side, zero build dependencies, and ready for one-click static deployment to Vercel.

---

## 🎮 Playable Games in the Catalog

| Game | Category | Controls | Route |
| :--- | :--- | :--- | :--- |
| **🍉 Fruit Slice Arcade** | Action & Reflex | Mouse Drag / Touch Swipe | [`games/fruit-slice/`](games/fruit-slice/index.html) |
| **🧱 Cyber Brick Breaker** | Retro Arcade | Mouse / Touch / Arrow Keys | [`games/brick-breaker/`](games/brick-breaker/index.html) |
| **🧠 Cyber Memory Match** | Puzzle & Logic | Mouse / Touch / Arrow Keys + Space | [`games/memory-match/`](games/memory-match/index.html) |

---

## ✨ Features & Architecture

- **Clean Multi-Page Architecture**:
  - `index.html`: Responsive homepage with live search, category filtering, and game showcase grid.
  - `about.html`, `contact.html`, `privacy.html`, `terms.html`: Accessible static pages with clear navigation.
  - `games/<game-id>/`: Isolated, dedicated playable routes with individual controls, HUDs, and state managers.
- **Dynamic Extensibility**: Game catalog is centrally driven by `js/games-data.js`. Adding a new game requires no HTML edits to the homepage.
- **Zero Copyright Assets**: 100% procedural vector graphics and custom SVG artwork.
- **Procedural Sound Synthesizer**: All audio is synthesized via the Web Audio API with local mute toggles.
- **Privacy First**: Zero trackers, zero cookies. Scores saved locally using browser `localStorage`.
- **Responsive & Accessible**: Works seamlessly on mobile phones (touch swipes), tablets, and desktops (mouse & keyboard).

---

## 🚀 How to Run Locally

### Option 1: Using Node / npx (Recommended)
```bash
npx -y serve .
```
Then open `http://localhost:3000` in your browser.

### Option 2: Using Python
```bash
# Python 3
python -m http.server 8000
```
Then open `http://localhost:8000`.

### Option 3: Direct Browser Launch
Open `index.html` directly in any web browser.

---

## ➕ How to Add a New Game

Adding a new game to **Mini Game Arcade** is designed to take less than 5 minutes:

### Step 1: Create the Game Directory
Create a new folder under `games/<your-game-slug>/`:
```
games/my-new-game/
├── index.html
├── style.css
└── js/
    └── game.js
```

### Step 2: Build the Dedicated Game Page
In your `index.html`, include a back link to return to the Arcade home:
```html
<header class="arcade-header">
    <a href="../../index.html" class="btn-back">← Arcade Home</a>
    <h1>My New Game</h1>
</header>
<main>
    <canvas id="game-canvas"></canvas>
</main>
```

### Step 3: Register the Game in `js/games-data.js`
Open `js/games-data.js` and append your game object to the `ARCADE_GAMES` array:
```javascript
{
    id: 'my-new-game',
    title: 'My New Game',
    slug: 'my-new-game',
    category: 'action', // 'action', 'arcade', 'puzzle', etc.
    categoryName: 'Action & Reflex',
    badge: 'New',
    route: 'games/my-new-game/index.html',
    description: 'Short 1-2 sentence description explaining gameplay.',
    controls: '🖱️ Mouse / 📱 Touch',
    tags: ['action', 'fast', 'arcade'],
    svgIllustration: `<svg viewBox="0 0 400 240">...</svg>`
}
```

### Step 4: Done!
Reload the homepage (`index.html`). Your new game will automatically appear in the grid, be searchable by title and tags, filter under its category, and link directly to your playable page!

---

## 🌐 How to Deploy to Vercel

1. Push this folder to a GitHub, GitLab, or Bitbucket repository.
2. Go to [vercel.com/new](https://vercel.com/new).
3. Import your repository.
4. Leave **Build Command** and **Output Directory** empty (Vercel auto-detects static sites).
5. Click **Deploy**. Your arcade is instantly live with global CDN delivery and free SSL!

---

## 🧪 Testing & Verification

Run the automated headless test suite:
```bash
npm test
# or
npm run build
```
Validates file presence, link integrity, games registry schema, ballistic physics, and collision math.
