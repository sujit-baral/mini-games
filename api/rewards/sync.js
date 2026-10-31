// Vercel Serverless Function: Sync user rewards & inventory with Neon Postgres
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { userId, coins, unlocked, equipped, stats } = req.body || {};

    if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
    }

    const dbUrl = process.env.DATABASE_URL;

    // Graceful fallback if Neon Postgres is not connected yet
    if (!dbUrl) {
        return res.status(200).json({
            success: true,
            storage: 'local_fallback',
            message: 'DATABASE_URL not set in environment. Saved in client LocalStorage.'
        });
    }

    try {
        const { neon } = await import('@neondatabase/serverless');
        const sql = neon(dbUrl);

        // 1. Upsert user profile
        await sql`
            INSERT INTO arcade_users (
                user_id, coins, equipped_avatar, equipped_theme, equipped_brush_fx, equipped_title,
                total_earned, words_guessed, matches_won, solo_solved, updated_at
            ) VALUES (
                ${userId}, 
                ${coins || 0}, 
                ${equipped?.avatar || 'avatar_gamer'}, 
                ${equipped?.theme || 'theme_midnight'}, 
                ${equipped?.brushFx || 'brush_classic'}, 
                ${equipped?.title || 'title_rookie'},
                ${stats?.totalEarned || 0},
                ${stats?.wordsGuessed || 0},
                ${stats?.matchesWon || 0},
                ${stats?.soloSolved || 0},
                NOW()
            )
            ON CONFLICT (user_id) DO UPDATE SET
                coins = EXCLUDED.coins,
                equipped_avatar = EXCLUDED.equipped_avatar,
                equipped_theme = EXCLUDED.equipped_theme,
                equipped_brush_fx = EXCLUDED.equipped_brush_fx,
                equipped_title = EXCLUDED.equipped_title,
                total_earned = EXCLUDED.total_earned,
                words_guessed = EXCLUDED.words_guessed,
                matches_won = EXCLUDED.matches_won,
                solo_solved = EXCLUDED.solo_solved,
                updated_at = NOW();
        `;

        // 2. Upsert unlocked inventory items
        if (Array.isArray(unlocked) && unlocked.length > 0) {
            for (const itemId of unlocked) {
                await sql`
                    INSERT INTO user_inventory (user_id, item_id, category, unlocked_at)
                    VALUES (${userId}, ${itemId}, 'customization', NOW())
                    ON CONFLICT (user_id, item_id) DO NOTHING;
                `;
            }
        }

        return res.status(200).json({
            success: true,
            storage: 'neon_postgres',
            syncedAt: new Date().toISOString()
        });
    } catch (err) {
        console.error('Neon DB Sync Error:', err);
        return res.status(500).json({
            error: 'Database sync error',
            message: err.message
        });
    }
}

