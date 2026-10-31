// Vercel Serverless Function: Fetch user profile & inventory from Neon Postgres
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { userId } = req.query || {};

    if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
    }

    const dbUrl = process.env.DATABASE_URL;

    if (!dbUrl) {
        return res.status(200).json({
            success: true,
            storage: 'local_fallback',
            message: 'DATABASE_URL not set in environment.'
        });
    }

    try {
        const { neon } = await import('@neondatabase/serverless');
        const sql = neon(dbUrl);

        const users = await sql`SELECT * FROM arcade_users WHERE user_id = ${userId} LIMIT 1`;
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = users[0];
        const inventory = await sql`SELECT item_id FROM user_inventory WHERE user_id = ${userId}`;

        return res.status(200).json({
            success: true,
            user: {
                userId: user.user_id,
                username: user.username,
                coins: user.coins,
                equipped: {
                    avatar: user.equipped_avatar,
                    theme: user.equipped_theme,
                    brushFx: user.equipped_brush_fx,
                    title: user.equipped_title
                },
                stats: {
                    totalEarned: user.total_earned,
                    wordsGuessed: user.words_guessed,
                    matchesWon: user.matches_won,
                    soloSolved: user.solo_solved
                },
                unlocked: inventory.map(i => i.item_id)
            }
        });
    } catch (err) {
        console.error('Neon DB Profile Fetch Error:', err);
        return res.status(500).json({
            error: 'Database fetch error',
            message: err.message
        });
    }
}
