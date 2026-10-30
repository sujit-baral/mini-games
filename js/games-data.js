/**
 * Mini Game Arcade - Master Games Registry
 * Defines all playable games, metadata, search terms, categories, and original SVG illustrations.
 * To add a new game, simply append a new object to this array.
 */

const ARCADE_GAMES = [
    {
        id: 'fruit-slice',
        title: 'Fruit Slice Arcade',
        slug: 'fruit-slice',
        category: 'action',
        categoryName: 'Action & Reflex',
        badge: 'Popular',
        route: 'games/fruit-slice/index.html',
        description: 'Slash flying fruits, chain explosive combos, and dodge ticking bombs across Classic (3 lives) and Arcade (60s frenzy) modes.',
        controls: '🖱️ Mouse Drag or 📱 Touch Swipe',
        tags: ['slice', 'fruit', 'reflex', 'arcade', 'action', 'blade'],
        tech: 'HTML5 Canvas &bull; Web Audio',
        svgIllustration: `
            <svg viewBox="0 0 400 240" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Fruit Slice Arcade Illustration">
                <defs>
                    <linearGradient id="fsBg" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stop-color="#2a170f"/>
                        <stop offset="100%" stop-color="#120a06"/>
                    </linearGradient>
                    <radialGradient id="melonGrad" cx="40%" cy="40%" r="60%">
                        <stop offset="0%" stop-color="#ff3d67"/>
                        <stop offset="85%" stop-color="#d81b43"/>
                        <stop offset="100%" stop-color="#22543d"/>
                    </radialGradient>
                    <linearGradient id="bladeGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stop-color="#ffffff"/>
                        <stop offset="50%" stop-color="#00e5ff"/>
                        <stop offset="100%" stop-color="rgba(0, 229, 255, 0)"/>
                    </linearGradient>
                </defs>
                <rect width="400" height="240" fill="url(#fsBg)"/>
                
                <!-- Dojo plank lines -->
                <line x1="130" y1="0" x2="130" y2="240" stroke="rgba(255, 183, 77, 0.08)" stroke-width="2"/>
                <line x1="270" y1="0" x2="270" y2="240" stroke="rgba(255, 183, 77, 0.08)" stroke-width="2"/>

                <!-- Splatter droplet effects -->
                <circle cx="160" cy="90" r="14" fill="rgba(255, 42, 84, 0.4)"/>
                <circle cx="178" cy="75" r="6" fill="#ff2a54"/>
                <circle cx="150" cy="115" r="8" fill="#ff2a54"/>
                <circle cx="250" cy="150" r="18" fill="rgba(255, 152, 0, 0.35)"/>
                <circle cx="270" cy="170" r="7" fill="#ff9800"/>

                <!-- Sliced Watermelon Half 1 -->
                <g transform="translate(160, 110) rotate(-22)">
                    <path d="M -50 0 A 50 50 0 0 1 50 0 Z" fill="#22543d"/>
                    <path d="M -44 0 A 44 44 0 0 1 44 0 Z" fill="#c6f6d5"/>
                    <path d="M -38 0 A 38 38 0 0 1 38 0 Z" fill="url(#melonGrad)"/>
                    <circle cx="-16" cy="-14" r="2.5" fill="#111"/>
                    <circle cx="0" cy="-22" r="2.5" fill="#111"/>
                    <circle cx="16" cy="-14" r="2.5" fill="#111"/>
                </g>

                <!-- Sliced Watermelon Half 2 -->
                <g transform="translate(225, 150) rotate(18)">
                    <path d="M -45 0 A 45 45 0 0 0 45 0 Z" fill="#22543d"/>
                    <path d="M -39 0 A 39 39 0 0 0 39 0 Z" fill="#c6f6d5"/>
                    <path d="M -34 0 A 34 34 0 0 0 34 0 Z" fill="url(#melonGrad)"/>
                    <circle cx="-14" cy="12" r="2.5" fill="#111"/>
                    <circle cx="0" cy="18" r="2.5" fill="#111"/>
                    <circle cx="14" cy="12" r="2.5" fill="#111"/>
                </g>

                <!-- Flying Orange -->
                <g transform="translate(290, 85)">
                    <circle cx="0" cy="0" r="26" fill="#ff9800"/>
                    <circle cx="-8" cy="-8" r="8" fill="rgba(255, 255, 255, 0.25)"/>
                    <ellipse cx="-4" cy="-24" rx="8" ry="4" fill="#4caf50" transform="rotate(-20)"/>
                </g>

                <!-- Blade Swoosh -->
                <path d="M 60 190 Q 200 130 330 60" stroke="url(#bladeGrad)" stroke-width="7" stroke-linecap="round" fill="none"/>
                <path d="M 90 180 Q 200 130 310 70" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" fill="none"/>

                <!-- Sparks -->
                <circle cx="210" cy="125" r="4" fill="#ffffff"/>
                <circle cx="200" cy="118" r="2" fill="#ffd54f"/>
                <circle cx="225" cy="132" r="2" fill="#00e5ff"/>
            </svg>
        `
    },
    {
        id: 'brick-breaker',
        title: 'Cyber Brick Breaker',
        slug: 'brick-breaker',
        category: 'arcade',
        categoryName: 'Retro Arcade',
        badge: 'New',
        route: 'games/brick-breaker/index.html',
        description: 'Shatter neon cyber grids with precision paddle deflection, catch multiball drops, and conquer escalating difficulty tiers.',
        controls: '🖱️ Mouse, 📱 Touch Drag, or ⌨️ Arrow Keys',
        tags: ['brick', 'breaker', 'retro', 'arcade', 'paddle', 'ball'],
        tech: 'HTML5 Canvas &bull; Web Audio',
        svgIllustration: `
            <svg viewBox="0 0 400 240" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Cyber Brick Breaker Illustration">
                <defs>
                    <linearGradient id="bbBg" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stop-color="#0d1424"/>
                        <stop offset="100%" stop-color="#05080f"/>
                    </linearGradient>
                    <linearGradient id="padGlow" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stop-color="#00e5ff"/>
                        <stop offset="50%" stop-color="#ffffff"/>
                        <stop offset="100%" stop-color="#00e5ff"/>
                    </linearGradient>
                </defs>
                <rect width="400" height="240" fill="url(#bbBg)"/>

                <!-- Cyber Grid Lines -->
                <g stroke="rgba(0, 229, 255, 0.06)" stroke-width="1">
                    <line x1="0" y1="60" x2="400" y2="60"/>
                    <line x1="0" y1="120" x2="400" y2="120"/>
                    <line x1="0" y1="180" x2="400" y2="180"/>
                    <line x1="80" y1="0" x2="80" y2="240"/>
                    <line x1="160" y1="0" x2="160" y2="240"/>
                    <line x1="240" y1="0" x2="240" y2="240"/>
                    <line x1="320" y1="0" x2="320" y2="240"/>
                </g>

                <!-- Neon Bricks -->
                <!-- Row 1: Magenta -->
                <rect x="50" y="35" width="45" height="15" rx="3" fill="#e91e63"/>
                <rect x="105" y="35" width="45" height="15" rx="3" fill="#e91e63"/>
                <rect x="160" y="35" width="45" height="15" rx="3" fill="#e91e63"/>
                <rect x="215" y="35" width="45" height="15" rx="3" fill="#e91e63"/>
                <rect x="270" y="35" width="45" height="15" rx="3" fill="#e91e63"/>
                <rect x="325" y="35" width="45" height="15" rx="3" fill="#e91e63"/>

                <!-- Row 2: Orange -->
                <rect x="50" y="58" width="45" height="15" rx="3" fill="#ff9800"/>
                <rect x="105" y="58" width="45" height="15" rx="3" fill="#ff9800"/>
                <!-- Shattered brick gap at 160 -->
                <rect x="215" y="58" width="45" height="15" rx="3" fill="#ff9800"/>
                <rect x="270" y="58" width="45" height="15" rx="3" fill="#ff9800"/>
                <rect x="325" y="58" width="45" height="15" rx="3" fill="#ff9800"/>

                <!-- Row 3: Cyan & Green -->
                <rect x="50" y="81" width="45" height="15" rx="3" fill="#00e676"/>
                <rect x="105" y="81" width="45" height="15" rx="3" fill="#00e676"/>
                <rect x="270" y="81" width="45" height="15" rx="3" fill="#00e5ff"/>
                <rect x="325" y="81" width="45" height="15" rx="3" fill="#00e5ff"/>

                <!-- Shattered Voxel Sparks -->
                <rect x="165" y="55" width="5" height="5" fill="#ff9800" transform="rotate(25 165 55)"/>
                <rect x="180" y="65" width="4" height="4" fill="#ffeb3b" transform="rotate(45 180 65)"/>
                <rect x="155" y="72" width="6" height="4" fill="#ff9800" transform="rotate(-15 155 72)"/>

                <!-- Ball with motion streak -->
                <line x1="175" y1="110" x2="190" y2="145" stroke="rgba(0, 229, 255, 0.4)" stroke-width="4"/>
                <circle cx="175" cy="105" r="8" fill="#ffffff" filter="drop-shadow(0 0 8px #00e5ff)"/>

                <!-- Glowing Paddle -->
                <rect x="135" y="195" width="110" height="15" rx="7" fill="url(#padGlow)" filter="drop-shadow(0 0 10px #00e5ff)"/>
            </svg>
        `
    },
    {
        id: 'memory-match',
        title: 'Cyber Memory Match',
        slug: 'memory-match',
        category: 'puzzle',
        categoryName: 'Puzzle & Logic',
        badge: 'New',
        route: 'games/memory-match/index.html',
        description: 'Test your cognitive recall with 3D neon flip cards, 3 difficulty tiers (12, 16, 20 cards), move tracking, and accuracy rankings.',
        controls: '🖱️ Mouse, 📱 Touch Tap, or ⌨️ Arrow Keys + Space',
        tags: ['memory', 'match', 'cards', 'puzzle', 'brain', 'logic', 'cyber'],
        tech: 'HTML5 3D CSS &bull; Web Audio',
        svgIllustration: `
            <svg viewBox="0 0 400 240" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Cyber Memory Match Illustration">
                <defs>
                    <linearGradient id="mmBg" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stop-color="#140d24"/>
                        <stop offset="100%" stop-color="#070a14"/>
                    </linearGradient>
                    <linearGradient id="cardBackGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stop-color="#1c263c"/>
                        <stop offset="100%" stop-color="#0e1524"/>
                    </linearGradient>
                    <linearGradient id="cardFrontGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stop-color="#21183c"/>
                        <stop offset="100%" stop-color="#0f0c22"/>
                    </linearGradient>
                </defs>
                <rect width="400" height="240" fill="url(#mmBg)"/>

                <!-- Subtle Hex or Starfield backdrop -->
                <g stroke="rgba(179, 136, 255, 0.08)" stroke-width="1" fill="none">
                    <circle cx="200" cy="120" r="90"/>
                    <circle cx="200" cy="120" r="130"/>
                </g>

                <!-- Hidden Card (Left) -->
                <g transform="translate(65, 55) rotate(-6)">
                    <rect width="75" height="100" rx="10" fill="url(#cardBackGrad)" stroke="rgba(0, 229, 255, 0.35)" stroke-width="2"/>
                    <rect x="8" y="8" width="59" height="84" rx="6" fill="none" stroke="rgba(0, 229, 255, 0.2)" stroke-width="1" stroke-dasharray="4 3"/>
                    <text x="37" y="58" font-size="24" text-anchor="middle" fill="#00e5ff" opacity="0.8">💠</text>
                </g>

                <!-- Revealed Matching Card 1 (Center Left - Atomic Core) -->
                <g transform="translate(155, 45) scale(1.05)">
                    <rect width="75" height="100" rx="10" fill="url(#cardFrontGrad)" stroke="#b388ff" stroke-width="2.5" filter="drop-shadow(0 0 12px rgba(179, 136, 255, 0.5))"/>
                    <ellipse cx="37" cy="46" rx="22" ry="7" fill="none" stroke="#b388ff" stroke-width="2"/>
                    <ellipse cx="37" cy="46" rx="22" ry="7" fill="none" stroke="#b388ff" stroke-width="2" transform="rotate(60 37 46)"/>
                    <ellipse cx="37" cy="46" rx="22" ry="7" fill="none" stroke="#b388ff" stroke-width="2" transform="rotate(120 37 46)"/>
                    <circle cx="37" cy="46" r="6" fill="#ffffff" filter="drop-shadow(0 0 6px #b388ff)"/>
                    <text x="37" y="85" font-size="9" font-family="sans-serif" font-weight="bold" text-anchor="middle" fill="#d1c4e9">MATCH!</text>
                </g>

                <!-- Revealed Matching Card 2 (Center Right - Atomic Core) -->
                <g transform="translate(245, 55) rotate(4)">
                    <rect width="75" height="100" rx="10" fill="url(#cardFrontGrad)" stroke="#b388ff" stroke-width="2.5" filter="drop-shadow(0 0 12px rgba(179, 136, 255, 0.5))"/>
                    <ellipse cx="37" cy="46" rx="22" ry="7" fill="none" stroke="#b388ff" stroke-width="2"/>
                    <ellipse cx="37" cy="46" rx="22" ry="7" fill="none" stroke="#b388ff" stroke-width="2" transform="rotate(60 37 46)"/>
                    <ellipse cx="37" cy="46" rx="22" ry="7" fill="none" stroke="#b388ff" stroke-width="2" transform="rotate(120 37 46)"/>
                    <circle cx="37" cy="46" r="6" fill="#ffffff" filter="drop-shadow(0 0 6px #b388ff)"/>
                    <text x="37" y="85" font-size="9" font-family="sans-serif" font-weight="bold" text-anchor="middle" fill="#d1c4e9">MATCH!</text>
                </g>

                <!-- Hidden Card (Right) -->
                <g transform="translate(330, 75) rotate(10)">
                    <rect width="75" height="100" rx="10" fill="url(#cardBackGrad)" stroke="rgba(0, 229, 255, 0.35)" stroke-width="2"/>
                    <rect x="8" y="8" width="59" height="84" rx="6" fill="none" stroke="rgba(0, 229, 255, 0.2)" stroke-width="1" stroke-dasharray="4 3"/>
                    <text x="37" y="58" font-size="24" text-anchor="middle" fill="#00e5ff" opacity="0.8">💠</text>
                </g>

                <!-- Neon Connection Sparkle -->
                <line x1="230" y1="95" x2="250" y2="95" stroke="#00e676" stroke-width="3" stroke-linecap="round" filter="drop-shadow(0 0 8px #00e676)"/>
                <circle cx="240" cy="95" r="4" fill="#ffffff"/>
            </svg>
        `
    }
];

if (typeof window !== 'undefined') {
    window.ARCADE_GAMES = ARCADE_GAMES;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ARCADE_GAMES };
}

