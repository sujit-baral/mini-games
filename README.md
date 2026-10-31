# 🕹️ Mini Game Arcade

A fast, responsive, ad-free, and privacy-first HTML5 browser arcade featuring instant-play mini-games. Built with vanilla **HTML5 Canvas 2D**, **CSS3**, the **Web Audio API**, and **WebRTC P2P Data Channels** — 100% client-side, zero build bloat, and ready for one-click static or serverless deployment to **Vercel** with optional **Neon Postgres** cloud sync.

---

## 🎮 Playable Games in the Catalog

| Game | Category | Mode | Controls | Route |
| :--- | :--- | :--- | :--- | :--- |
| **🎨 Doodle Guess Arcade** | Multiplayer & Party | P2P Multiplayer / Solo Bot | Mouse / Touch Drawing & Chat | [`games/doodle-guess/`](games/doodle-guess/index.html) |
| **🍉 Fruit Slice Arcade** | Action & Reflex | Solo Classic / Zen / Frenzy | Mouse Drag / Touch Swipe | [`games/fruit-slice/`](games/fruit-slice/index.html) |
| **🧱 Cyber Brick Breaker** | Retro Arcade | Solo Multi-Level | Mouse / Touch / Arrow Keys | [`games/brick-breaker/`](games/brick-breaker/index.html) |
| **🧠 Cyber Memory Match** | Puzzle & Logic | Solo Timed Challenge | Mouse / Touch / Arrow Keys + Space | [`games/memory-match/`](games/memory-match/index.html) |

---

## ✨ Features & Architecture

### 1. Multiplayer & Real-Time Networking
* **WebRTC P2P (PeerJS)**: Serverless, browser-to-browser data channels with sub-50ms latency.
* **Micro-Batched Coordinate Streaming**: 40Hz micro-batching (`DRAW_BATCH`) with integer compression cuts network payload by 75%.
* **Private Rooms & Instant Invite**: Generate 5-character room codes and one-click shareable URLs (`?room=CODE`).
* **Lobby & Game Synchronization**: Host selects round parameters, coordinates word selection modals, broadcasts real-time chat, and renders podium leaderboards.

### 2. Rich Canvas Drawing Engine
* **Pinpoint Aspect-Ratio Mapping**: Mathematically corrected coordinate transformer eliminates cursor drift on all screen aspect ratios, responsive sizes, and zoom levels.
* **Paint Bucket Flood Fill (MS Paint style)**: Zero-allocation queue (`Int32Array`), soft-edge tolerance, and real-time P2P fill replication.
* **Drawing Tools**: Multiple brush sizes, rich color palette, eraser, instant canvas clearing, multi-level undo history, and PNG download.
* **Solo Bot Challenge**: Built-in animated vector sketching engine where an AI bot draws strokes in real-time for solo practice.

### 3. Arcade Rewards & Customization Shop
* **Arcade Coins Economy (🪙)**: Earn coins by guessing words, sketching, winning match podiums, or solving solo puzzles. Starter bonus of 200 coins for all new players!
* **Character Avatars**: Unlock and equip custom icons (🤖 Cyber Droid, 🎨 Pixel Artist, 🐱 Ninja Cat, 🦊 Astro Fox, 👑 Golden Monarch, 🧙 Void Sorcerer, 🦄 Cyber Unicorn) displayed in lobbies and scoreboards.
* **Dynamic Board Themes**: Customize your drawing canvas with themes like **Slate Chalkboard**, **Architect Blueprint**, **Vintage Parchment**, and **Synthwave Cyber**.
* **Special Brush FX**: Luminescent **Neon Glow** laser lines and **Rainbow Prism** shifting color trails.
* **Player Titles**: Display prestige badges like *Rookie Doodler*, *Canvas Virtuoso*, and *Arcade Legend*.

### 4. Zero-Lag Database Sync (Neon Postgres Ready)
* **Offline-First & Instant**: Coins and unlocks load instantaneously ($0\text{ ms}$) from browser `localStorage`.
* **Serverless Cloud Sync**: Built-in background sync to **Neon Postgres** via Vercel serverless API routes (`/api/rewards/sync`, `/api/rewards/profile`).
* **Graceful Fallback**: Works 100% out-of-the-box in local/static mode even if no database is connected.

### 5. Audio & Design System
* **100% Procedural Web Audio**: Zero external `.mp3` or `.wav` dependencies. All arcade chimes, slice swooshes, brick impacts, draw scratches, and victory fanfares are synthesized dynamically.
* **Zero Copyrighted Assets**: Custom SVG artwork and pure procedural vector graphics.
* **Privacy by Design**: No cookies, no trackers, no third-party advertisements.

---

## 📁 Project Directory Structure

```
Mini-Games/
├── index.html                  # Arcade hub with real-time search & filters
├── about.html                  # About & platform overview
├── contact.html                # Contact & support page
├── privacy.html                # Privacy policy (zero tracking)
├── terms.html                  # Terms of service
├── package.json                # Project scripts & dependencies
├── vercel.json                 # Vercel deployment headers & clean routes
├── qa_test_suite.js            # Automated 8-suite production test runner
│
├── api/                        # Vercel Serverless Functions (Neon DB)
│   └── rewards/
│       ├── sync.js             # User wallet & inventory upsert
│       └── profile.js          # User cloud profile fetch
│
├── db/
│   └── schema.sql              # Neon Postgres SQL table definitions & indexes
│
├── css/
│   ├── main.css                # Global design system & theme variables
│   └── home.css                # Arcade hub cards & animations
│
├── js/
│   ├── games-data.js           # Central games catalog registry
│   ├── home.js                 # Homepage search, filter, and wallet controller
│   └── rewards.js              # Arcade rewards, shop catalog & sync manager
│
└── games/
    ├── doodle-guess/           # Multiplayer drawing & word guessing game
    │   ├── index.html
    │   ├── style.css
    │   └── js/
    │       ├── audio.js        # Procedural sound synthesizer
    │       ├── words.js        # Word bank & vector bot sketches
    │       ├── p2p.js          # WebRTC P2P data channel networking
    │       └── game.js         # Game state machine & canvas drawing engine
    │
    ├── fruit-slice/            # Fruit slicing action game
    ├── brick-breaker/          # Cyber brick breaker arcade
    └── memory-match/           # Cyber memory match card puzzle
```

---

## 🚀 Running Locally

### Option 1: Using Node / npx (Recommended)
```bash
npx -y serve .
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Option 2: Using Python
```bash
# Python 3
python -m http.server 8000
```
Open [http://localhost:8000](http://localhost:8000).

### Option 3: Direct Browser Launch
Open `index.html` directly in any modern browser.

---

## 🌐 Deploying to Vercel & Connecting Neon DB

### 1. Deploy to Vercel
1. Push this repository to GitHub, GitLab, or Bitbucket.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. Vercel automatically detects the static frontend and `/api` serverless routes.
4. Click **Deploy**. Your arcade is instantly live with global edge CDN and free SSL!

### 2. Optional: Connect Neon Postgres
To enable cross-device cloud persistence for the Rewards & Customization Shop:
1. Create a free serverless Postgres database on [Neon.tech](https://neon.tech) (or via the Vercel Marketplace Neon integration).
2. Run the SQL schema script in [`db/schema.sql`](db/schema.sql) in your Neon SQL console.
3. In your Vercel Project Settings, add the environment variable:
   ```env
   DATABASE_URL=postgres://user:password@ep-xyz.neon.tech/neondb?sslmode=require
   ```
4. Redeploy. Your arcade will automatically sync player balances, unlocked avatars, board skins, and titles to Neon Postgres!

---

## ➕ Adding a New Game to the Arcade

Adding a new game takes less than 5 minutes:

1. **Create the Game Directory**:
   ```
   games/my-game/
   ├── index.html
   ├── style.css
   └── js/game.js
   ```

2. **Register the Game in [`js/games-data.js`](js/games-data.js)**:
   ```javascript
   {
       id: 'my-game',
       title: 'My Game',
       slug: 'my-game',
       category: 'action', // 'action', 'arcade', 'puzzle', 'multiplayer'
       categoryName: 'Action & Reflex',
       badge: 'New',
       route: 'games/my-game/index.html',
       description: 'Exciting description of mechanics and gameplay.',
       controls: '🖱️ Mouse / 📱 Touch',
       tags: ['action', 'fast'],
       svgIllustration: `<svg viewBox="0 0 400 240">...</svg>`
   }
   ```

3. **Done!** The homepage automatically renders the new game card, indexes it for live search, and filters it under its category without touching any HTML.

---

## 🧪 Testing & Quality Assurance

Run the automated 8-suite production verification test:
```bash
npm test
# or
node qa_test_suite.js
```

### What the QA Test Suite Verifies:
1. **Asset Integrity**: Verifies existence and non-zero byte size of all HTML, CSS, JS, and SQL assets.
2. **Catalog Registry**: Validates route schemas and checks every link against disk paths.
3. **Internal Navigation**: Checks all href targets across every navigation header and footer.
4. **Fruit Slice Physics**: Verifies ballistic trajectories and blade slice hit detection.
5. **Brick Breaker Collisions**: Tests AABB bounding box collision reflection math.
6. **Memory Match State**: Tests card grid generation, pair matching, and victory conditions.
7. **Doodle Guess Engine**: Validates 140+ word bank entries, vector sketch coordinates, and typo detection.
8. **Rewards Economy Engine**: Verifies coin additions, purchase transactions, board theme equipping, insufficient funds guards, and Neon DB SQL schema syntax.

---

## 📄 License

MIT License — free for personal, educational, and commercial use.
