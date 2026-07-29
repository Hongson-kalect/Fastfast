import { UserProfile } from "@/interfaces/db.type";
import { SQLiteDatabase } from "expo-sqlite";

// Bảng 2: Thông tin người dùng (User Profile)
export const generateString = /*sql*/ `
CREATE TABLE IF NOT EXISTS user_profile (
    id TEXT PRIMARY KEY, -- UUID v7 sinh từ Client
    name TEXT,
    account_type TEXT DEFAULT 'free',
    image_uri TEXT,
    -- Thêm các trường Thống kê Kỷ lục (Cache)
    current_streak INTEGER DEFAULT 0,
    max_streak INTEGER DEFAULT 0,
    last_fast_completed_at INTEGER,           -- Unix timestamp của phiên fast hoàn thành mới nhất
    streak_date TEXT,                         -- 'YYYY-MM-DD' ngày streak cuối, để tính cộng streak
    next_expected_streak_date TEXT,           -- 'YYYY-MM-DD' quá ngày này thì mất streak
    
    upload_url TEXT,
    backup_url TEXT,
    sync_status TEXT DEFAULT 'synced', -- 'synced', 'pending', 'failed'
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);
`;


export const getUserProfile = async (
  db: SQLiteDatabase,
): Promise<UserProfile | null> => {
  // Vì local thường chỉ có 1 user active, ta lấy bản ghi mới nhất hoặc duy nhất
  const row = await db.getFirstAsync<UserProfile>(
    `SELECT * FROM user_profile ORDER BY updated_at DESC LIMIT 1;`,
  );
  if (!row) return null;

  return {
    ...row,
    // learning_languages: JSON.parse(row.learning_languages || '[]'),
    // learning_languages: JSON.parse(row.learning_languages || '[]'),
  };
};