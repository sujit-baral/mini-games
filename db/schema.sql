-- =================================================================
-- MINI GAME ARCADE - NEON POSTGRES DATABASE SCHEMA
-- Compatible with Neon Serverless Postgres on Vercel
-- =================================================================

-- 1. Users & Player Profiles
CREATE TABLE IF NOT EXISTS arcade_users (
    user_id VARCHAR(64) PRIMARY KEY,
    username VARCHAR(32) NOT NULL DEFAULT 'Player',
    coins INT NOT NULL DEFAULT 200,
    equipped_avatar VARCHAR(32) NOT NULL DEFAULT 'avatar_gamer',
    equipped_theme VARCHAR(32) NOT NULL DEFAULT 'theme_midnight',
    equipped_brush_fx VARCHAR(32) NOT NULL DEFAULT 'brush_classic',
    equipped_title VARCHAR(32) NOT NULL DEFAULT 'title_rookie',
    total_earned INT NOT NULL DEFAULT 200,
    words_guessed INT NOT NULL DEFAULT 0,
    matches_won INT NOT NULL DEFAULT 0,
    solo_solved INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. User Unlocked Inventory
CREATE TABLE IF NOT EXISTS user_inventory (
    user_id VARCHAR(64) REFERENCES arcade_users(user_id) ON DELETE CASCADE,
    item_id VARCHAR(64) NOT NULL,
    category VARCHAR(32) NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, item_id)
);

-- 3. Reward Transactions Ledger (Audit Trail)
CREATE TABLE IF NOT EXISTS reward_transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES arcade_users(user_id) ON DELETE CASCADE,
    amount INT NOT NULL,
    reason VARCHAR(128) NOT NULL,
    balance_after INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Fast Query Indexes
CREATE INDEX IF NOT EXISTS idx_users_coins ON arcade_users(coins DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_user ON user_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON reward_transactions(user_id, created_at DESC);

