import { FastSession, UserProfile } from "@/interfaces/db.type";
import { getLocalTodayStr } from "@/util/timer";
import { SQLiteDatabase } from "expo-sqlite";
import { getLastFastSession } from "./fast_sessions";

export const shield_rewards = [35,70,100]
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
    streak_date TEXT,                         -- 'YYYY-MM-DD' ngày streak cuối, để tính cộng streak
    
    full_habit_at TEXT,              -- 'YYYY-MM-DD'
    low_shield_clamable INTEGER,     -- Khi đạt 1 ngưỡng (35%), nếu ngưỡng này còn thì nhận 1 shield
    mid_shield_clamable INTEGER,     -- Khi đạt 1 ngưỡng (70%), nếu ngưỡng này còn thì nhận 1 shield
    full_shield_clamable INTEGER,    -- Khi đạt (100%), nếu ngưỡng này còn thì nhận 1 shield
    
    upload_url TEXT,
    backup_url TEXT,
    sync_status TEXT DEFAULT 'synced', -- 'synced', 'pending', 'failed'
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);
`;

// Chỉ lấy profile gần nhất, có thể dùng khi có update nhẹ bên trong
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

// Kiểm trả streak và trả về profile mới
export const increaseStreak =async (db: SQLiteDatabase, profile: UserProfile, streakNumber: number) => {
  const today = getLocalTodayStr()
  const newStreak = profile.current_streak + streakNumber
  await db.runAsync(`UPDATE user_profile SET current_streak = ${newStreak}, max_streak = ${Math.max(profile.max_streak, newStreak)}, streak_date = '${today}' , updated_at = strftime('%s', 'now') WHERE id = '${profile.id}'`);
  const newProfile = await getUserProfile(db)
  return newProfile
}

export const clearStreak = async(db: SQLiteDatabase, profile: UserProfile) =>{
  const today = getLocalTodayStr()
  await db.runAsync(`UPDATE user_profile SET current_streak = 1,  streak_date = '${today}' , updated_at = strftime('%s', 'now') WHERE id = '${profile.id}'`);
  const newProfile = await getUserProfile(db)
  return newProfile
}