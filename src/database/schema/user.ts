import { logDbError } from "@/utils/dbError";
import { UserProfile } from "@/interfaces/db.type";
import { uuidv7 } from "@/utils/uuidv7";
import { SQLiteDatabase } from "expo-sqlite";

export const shield_rewards = [35, 70, 100];
// Bảng 2: Thông tin người dùng (User Profile)
export const generateString = /*sql*/ `
CREATE TABLE IF NOT EXISTS user_profile (
    id TEXT PRIMARY KEY, -- UUID v7 sinh từ Client
    name TEXT,
    account_type TEXT DEFAULT 'free',
    account_type_sync_at INTEGER DEFAULT NULL,
    account_type_expried_at INTEGER DEFAULT NULL,
    image_uri TEXT,

    -- Thêm các trường Thống kê Kỷ lục (Cache)
    current_streak INTEGER DEFAULT 0,
    max_streak INTEGER DEFAULT 0,
    active_days INTEGER DEFAULT 0,
    streak_date TEXT,                -- 'YYYY-MM-DD' ngày streak cuối, để tính cộng streak
    last_login_date TEXT,                -- 'YYYY-MM-DD' ngày cuối đăng nhập, để tính auto fast fail

    total_shield_used INTEGER DEFAULT 0,
    total_shield_clamable INTEGER DEFAULT 0,
    total_shield_wasted INTEGER DEFAULT 0,
    
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

// Mặc định bản ghi seed cơ bản
const seedProfile = {
  id: uuidv7(),
  name: "Fasting Hero",
  account_type: "free",
  image_uri: null,
  current_streak: 0,
  max_streak: 0,
  streak_date: null,
  full_habit_at: null,
  low_shield_clamable: 1,
  mid_shield_clamable: 1,
  full_shield_clamable: 1,
  upload_url: null,
  backup_url: null,
  sync_status: "synced",
};

export const userSeedData = /*sql*/ `
INSERT OR IGNORE INTO user_profile (
    id,
    name,
    account_type,
    image_uri,
    current_streak,
    max_streak,
    streak_date,
    full_habit_at,
    low_shield_clamable,
    mid_shield_clamable,
    full_shield_clamable,
    upload_url,
    backup_url,
    sync_status
) VALUES (
    '${seedProfile.id}',
    '${seedProfile.name}',
    '${seedProfile.account_type}',
    ${seedProfile.image_uri},
    ${seedProfile.current_streak},
    ${seedProfile.max_streak},
    ${seedProfile.streak_date},
    ${seedProfile.full_habit_at},
    ${seedProfile.low_shield_clamable},
    ${seedProfile.mid_shield_clamable},
    ${seedProfile.full_shield_clamable},
    ${seedProfile.upload_url},
    ${seedProfile.backup_url},
    '${seedProfile.sync_status}'
);
`;

// Chỉ lấy profile gần nhất, có thể dùng khi có update nhẹ bên trong
export const getUserProfile = async (
  db: SQLiteDatabase,
): Promise<UserProfile | null> => {
  // Vì local thường chỉ có 1 user active, ta lấy bản ghi mới nhất hoặc duy nhất
  try{

    const row = await db.getFirstAsync<UserProfile>(
      `SELECT * FROM user_profile ORDER BY updated_at DESC LIMIT 1;`,
    );
    if (!row) return null;
    
    return {
      ...row,
    };
  }
  catch (e){
    logDbError("get user profile error", e);
    return null;
  }
};

export const togglePremium = async(db:SQLiteDatabase, isPremium: boolean)=>{
  const sync_at = isPremium ? Date.now() : null;

  await db.runAsync("update user_profile set account_type = ?, account_type_sync_at = ?",[isPremium, sync_at]);
  return getUserProfile(db);
}
