export const generateString = /*sql*/ `
CREATE TABLE IF NOT EXISTS user_achievement (
    id TEXT PRIMARY KEY,

    user_id TEXT NOT NULL,

    achievement_id TEXT NOT NULL,

    current_value REAL NOT NULL DEFAULT 0,

    unlocked_at TEXT DEFAULT NULL,

    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    updated_at TEXT NOT NULL DEFAULT (DATETIME('now')),

    UNIQUE (user_id, achievement_id)
);
`;

export const itemGenerateString = /*sql*/ `
CREATE TABLE IF NOT EXISTS user_achievement_milestone (
    id TEXT PRIMARY KEY,

    user_id TEXT NOT NULL,

    achievement_item_id TEXT NOT NULL,

    value REAL DEFAULT NULL,

    unlocked_at TEXT NOT NULL DEFAULT (DATETIME('now')),

    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    updated_at TEXT NOT NULL DEFAULT (DATETIME('now')),

    UNIQUE (user_id, achievement_item_id)
);
`;