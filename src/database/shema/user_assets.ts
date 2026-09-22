export const generateString = /*sql*/ `
CREATE TABLE IF NOT EXISTS user_asset (
    id TEXT PRIMARY KEY,

    user_id TEXT NOT NULL,

    asset_id TEXT NOT NULL,

    source TEXT NOT NULL DEFAULT 'purchase',

    purchased_at TEXT DEFAULT NULL,
    expires_at TEXT DEFAULT NULL,

    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    updated_at TEXT NOT NULL DEFAULT (DATETIME('now')),

    UNIQUE (user_id, asset_id)
);
`;