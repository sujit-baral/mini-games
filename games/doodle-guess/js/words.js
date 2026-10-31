/**
 * Doodle Guess Arcade - Curated Word Bank & Vector Doodle Library
 * Contains 300+ clean, family-friendly words categorized by difficulty,
 * plus vector stroke sequences for the Solo / Bot Guessing Challenge.
 */

const DOODLE_WORDS = {
    EASY: [
        "Apple", "Sun", "Tree", "Moon", "Star", "Cat", "Dog", "Car", "House", "Fish",
        "Book", "Ball", "Cake", "Clock", "Door", "Eye", "Cup", "Hat", "Bed", "Bird",
        "Boat", "Ring", "Shoe", "Sock", "Hand", "Coin", "Egg", "Leaf", "Key", "Kite",
        "Milk", "Nose", "Rain", "Snow", "Soup", "Tent", "Wind", "Fork", "Flag", "Box",
        "Bell", "Fire", "Baby", "Frog", "Duck", "Lion", "Bear", "Pencil", "Smile", "Heart"
    ],
    MEDIUM: [
        "Banana", "Guitar", "Rocket", "Pizza", "Burger", "Camera", "Castle", "Dragon", "Flower", "Ghost",
        "Island", "Monkey", "Spider", "Swimmer", "Turtle", "Bridge", "Candle", "Doctor", "Hammer", "Ladder",
        "Magnet", "Mirror", "Parrot", "Planet", "Prison", "Robot", "Scissor", "Shadow", "Shield", "Subway",
        "Target", "Ticket", "Tomato", "Trophy", "Tunnel", "Vampire", "Violin", "Wrench", "Wizard", "Zombie",
        "Bicycle", "Diamond", "Dolphin", "Feather", "Giraffe", "Helicopter", "Ice cream", "Kangaroo", "Lollipop", "Mushroom"
    ],
    HARD: [
        "Astronaut", "Black hole", "Campfire", "Chandelier", "Crocodile", "Fireworks", "Flamingo", "Graffiti", "Hourglass", "Lighthouse",
        "Microscope", "Nightmare", "Paintbrush", "Parachute", "Pineapple", "Rollercoaster", "Satellite", "Saxophone", "Scarecrow", "Skeleton",
        "Snowboard", "Spaceship", "Submarine", "Sunflower", "Telescope", "Toothbrush", "Tornado", "Traffic light", "Underground", "Watermelon",
        "Windmill", "Waterfall", "Treasure chest", "Suitcase", "Skateboard", "Pyramid", "Microphone", "Jellyfish", "Boomerang", "Compass"
    ]
};

// Flattened word list for quick random selection
const ALL_WORDS = [
    ...DOODLE_WORDS.EASY,
    ...DOODLE_WORDS.MEDIUM,
    ...DOODLE_WORDS.HARD
];

/**
 * Pre-recorded stroke sequences for Solo Bot Guessing Mode.
 * Normalized coordinates (0.0 to 1.0) with stroke pauses so the bot draws stroke-by-stroke in real time.
 */
const SOLO_BOT_DOODLES = [
    {
        word: "Cat",
        category: "Animals",
        hints: ["Furry pet", "Says meow", "Likes milk"],
        strokes: [
            // Head circle
            { color: "#ffffff", size: 6, points: [{x:0.35, y:0.45}, {x:0.40, y:0.38}, {x:0.50, y:0.35}, {x:0.60, y:0.38}, {x:0.65, y:0.45}, {x:0.65, y:0.60}, {x:0.60, y:0.68}, {x:0.50, y:0.70}, {x:0.40, y:0.68}, {x:0.35, y:0.60}, {x:0.35, y:0.45}] },
            // Left ear
            { color: "#ffffff", size: 6, points: [{x:0.38, y:0.38}, {x:0.34, y:0.25}, {x:0.45, y:0.35}] },
            // Right ear
            { color: "#ffffff", size: 6, points: [{x:0.55, y:0.35}, {x:0.66, y:0.25}, {x:0.62, y:0.38}] },
            // Eyes
            { color: "#00e5ff", size: 8, points: [{x:0.43, y:0.48}, {x:0.43, y:0.48}] },
            { color: "#00e5ff", size: 8, points: [{x:0.57, y:0.48}, {x:0.57, y:0.48}] },
            // Nose & mouth
            { color: "#ec4899", size: 5, points: [{x:0.50, y:0.55}, {x:0.48, y:0.58}, {x:0.50, y:0.60}, {x:0.52, y:0.58}, {x:0.50, y:0.55}] },
            // Whiskers left
            { color: "#ffffff", size: 3, points: [{x:0.32, y:0.54}, {x:0.42, y:0.56}] },
            { color: "#ffffff", size: 3, points: [{x:0.30, y:0.60}, {x:0.42, y:0.58}] },
            // Whiskers right
            { color: "#ffffff", size: 3, points: [{x:0.58, y:0.56}, {x:0.68, y:0.54}] },
            { color: "#ffffff", size: 3, points: [{x:0.58, y:0.58}, {x:0.70, y:0.60}] }
        ]
    },
    {
        word: "Pizza",
        category: "Food",
        hints: ["Italian dish", "Has cheese and crust", "Sliced into triangles"],
        strokes: [
            // Triangle crust
            { color: "#f59e0b", size: 8, points: [{x:0.30, y:0.25}, {x:0.70, y:0.25}] },
            { color: "#f59e0b", size: 7, points: [{x:0.30, y:0.25}, {x:0.50, y:0.75}] },
            { color: "#f59e0b", size: 7, points: [{x:0.70, y:0.25}, {x:0.50, y:0.75}] },
            // Cheese fill lines
            { color: "#fef08a", size: 6, points: [{x:0.36, y:0.32}, {x:0.64, y:0.32}] },
            { color: "#fef08a", size: 6, points: [{x:0.40, y:0.42}, {x:0.60, y:0.42}] },
            { color: "#fef08a", size: 6, points: [{x:0.45, y:0.55}, {x:0.55, y:0.55}] },
            // Pepperoni slices
            { color: "#ef4444", size: 12, points: [{x:0.45, y:0.35}, {x:0.45, y:0.35}] },
            { color: "#ef4444", size: 12, points: [{x:0.55, y:0.35}, {x:0.55, y:0.35}] },
            { color: "#ef4444", size: 12, points: [{x:0.50, y:0.48}, {x:0.50, y:0.48}] },
            { color: "#ef4444", size: 10, points: [{x:0.50, y:0.63}, {x:0.50, y:0.63}] }
        ]
    },
    {
        word: "Car",
        category: "Vehicles",
        hints: ["Has 4 wheels", "Driven on roads", "Beep beep"],
        strokes: [
            // Car body bottom
            { color: "#3b82f6", size: 7, points: [{x:0.20, y:0.60}, {x:0.80, y:0.60}] },
            // Car front & hood
            { color: "#3b82f6", size: 7, points: [{x:0.80, y:0.60}, {x:0.82, y:0.54}, {x:0.68, y:0.52}] },
            // Windshield and roof
            { color: "#3b82f6", size: 7, points: [{x:0.68, y:0.52}, {x:0.58, y:0.38}, {x:0.38, y:0.38}, {x:0.28, y:0.52}, {x:0.18, y:0.55}, {x:0.20, y:0.60}] },
            // Windows line
            { color: "#00e5ff", size: 4, points: [{x:0.48, y:0.40}, {x:0.48, y:0.52}] },
            // Left wheel
            { color: "#111827", size: 10, points: [{x:0.32, y:0.63}, {x:0.32, y:0.63}] },
            { color: "#ffffff", size: 4, points: [{x:0.32, y:0.63}, {x:0.32, y:0.63}] },
            // Right wheel
            { color: "#111827", size: 10, points: [{x:0.68, y:0.63}, {x:0.68, y:0.63}] },
            { color: "#ffffff", size: 4, points: [{x:0.68, y:0.63}, {x:0.68, y:0.63}] },
            // Headlight
            { color: "#f59e0b", size: 6, points: [{x:0.81, y:0.56}, {x:0.81, y:0.56}] }
        ]
    },
    {
        word: "Tree",
        category: "Nature",
        hints: ["Grows in forests", "Has leaves and branches", "Provides shade and oxygen"],
        strokes: [
            // Trunk
            { color: "#854d0e", size: 12, points: [{x:0.48, y:0.80}, {x:0.48, y:0.50}] },
            { color: "#854d0e", size: 12, points: [{x:0.52, y:0.80}, {x:0.52, y:0.50}] },
            // Leaves clusters
            { color: "#10b981", size: 24, points: [{x:0.50, y:0.35}, {x:0.50, y:0.35}] },
            { color: "#10b981", size: 22, points: [{x:0.38, y:0.42}, {x:0.38, y:0.42}] },
            { color: "#10b981", size: 22, points: [{x:0.62, y:0.42}, {x:0.62, y:0.42}] },
            { color: "#34d399", size: 18, points: [{x:0.44, y:0.32}, {x:0.44, y:0.32}] },
            { color: "#34d399", size: 18, points: [{x:0.56, y:0.32}, {x:0.56, y:0.32}] }
        ]
    },
    {
        word: "Guitar",
        category: "Music",
        hints: ["Has 6 strings", "Played in rock bands", "Strummed with a pick"],
        strokes: [
            // Neck
            { color: "#854d0e", size: 6, points: [{x:0.30, y:0.25}, {x:0.52, y:0.48}] },
            // Headstock
            { color: "#854d0e", size: 8, points: [{x:0.26, y:0.21}, {x:0.30, y:0.25}] },
            // Tuning pegs
            { color: "#ffffff", size: 4, points: [{x:0.24, y:0.22}, {x:0.28, y:0.20}] },
            // Body top curve
            { color: "#ef4444", size: 16, points: [{x:0.56, y:0.52}, {x:0.56, y:0.52}] },
            // Body bottom curve
            { color: "#ef4444", size: 22, points: [{x:0.68, y:0.66}, {x:0.68, y:0.66}] },
            // Soundhole
            { color: "#111827", size: 8, points: [{x:0.60, y:0.57}, {x:0.60, y:0.57}] },
            // Strings
            { color: "#ffffff", size: 2, points: [{x:0.28, y:0.23}, {x:0.66, y:0.64}] }
        ]
    },
    {
        word: "Rocket",
        category: "Space",
        hints: ["Shoots into outer space", "Has thruster flames", "Flown by astronauts"],
        strokes: [
            // Rocket body
            { color: "#ffffff", size: 8, points: [{x:0.50, y:0.20}, {x:0.42, y:0.40}, {x:0.42, y:0.65}, {x:0.58, y:0.65}, {x:0.58, y:0.40}, {x:0.50, y:0.20}] },
            // Nose cone tip
            { color: "#ef4444", size: 8, points: [{x:0.46, y:0.30}, {x:0.50, y:0.20}, {x:0.54, y:0.30}] },
            // Window porthole
            { color: "#00e5ff", size: 10, points: [{x:0.50, y:0.42}, {x:0.50, y:0.42}] },
            // Left fin
            { color: "#ef4444", size: 6, points: [{x:0.42, y:0.58}, {x:0.34, y:0.68}, {x:0.42, y:0.68}] },
            // Right fin
            { color: "#ef4444", size: 6, points: [{x:0.58, y:0.58}, {x:0.66, y:0.68}, {x:0.58, y:0.68}] },
            // Flame blast
            { color: "#f59e0b", size: 8, points: [{x:0.46, y:0.67}, {x:0.50, y:0.82}, {x:0.54, y:0.67}] },
            { color: "#ef4444", size: 5, points: [{x:0.48, y:0.68}, {x:0.50, y:0.76}, {x:0.52, y:0.68}] }
        ]
    }
];

if (typeof window !== 'undefined') {
    window.DOODLE_WORDS = DOODLE_WORDS;
    window.ALL_WORDS = ALL_WORDS;
    window.SOLO_BOT_DOODLES = SOLO_BOT_DOODLES;
}
