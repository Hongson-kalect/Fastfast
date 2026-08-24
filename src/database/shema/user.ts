import { UserProfile } from "@/interfaces/db.type";
import { getLocalTodayStr } from "@/util/timer";
import { uuidv7 } from "@/util/uuidv7";
import { SQLiteDatabase } from "expo-sqlite";

export const shield_rewards = [35, 70, 100];
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
    active_days INTEGER DEFAULT 0,
    streak_date TEXT,                -- 'YYYY-MM-DD' ngày streak cuối, để tính cộng streak

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

const today = new Date().toISOString().split("T")[0]; // Format 'YYYY-MM-DD'
const nowTimestamp = Math.floor(Date.now() / 1000);

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
      // learning_languages: JSON.parse(row.learning_languages || '[]'),
      // learning_languages: JSON.parse(row.learning_languages || '[]'),
    };
  }
  catch (e){
    console.log('get user profile error', e);
    return null;
  }
};

// Kiểm trả streak và trả về profile mới
export const increaseStreak = async (
  db: SQLiteDatabase,
  profile: UserProfile,
  streakNumber: number,
  reduceShieldNumber?:number
) => {
  try{

    const today = getLocalTodayStr();
    const newStreak = profile.current_streak + streakNumber;
    await db.runAsync(
      `UPDATE user_profile SET current_streak = ${newStreak}, active_days = ${profile.active_days + streakNumber}, max_streak = ${Math.max(profile.max_streak, newStreak)}, streak_date = '${today}', total_shield_used = ${profile.total_shield_used + (reduceShieldNumber||0)} , updated_at = strftime('%s', 'now') WHERE id = '${profile.id}'`,
    );
    const newProfile = await getUserProfile(db);
    return newProfile!;
  }
  catch (e){
    console.log('increaseStreak error', e);
    return null;
  }
};

export const gainShield = async (db: SQLiteDatabase, num:number,  habit:number, userProfile?: UserProfile) => {
  let profile = userProfile || await getUserProfile(db);

  if(!profile) return null;

  let shield_mileStone_gain = 0
  let low_shield_clamable = profile.low_shield_clamable;
  let mid_shield_clamable = profile.mid_shield_clamable;
  let full_shield_clamable = profile.full_shield_clamable;

  if(habit >= shield_rewards[0] && !!profile.low_shield_clamable) {
    shield_mileStone_gain+=1
    low_shield_clamable = 0
  }
  if(habit >= shield_rewards[1] && !!profile.mid_shield_clamable) {shield_mileStone_gain+=1; mid_shield_clamable = 0}
  if(habit >= shield_rewards[2] && !!profile.full_shield_clamable) {shield_mileStone_gain+=1; full_shield_clamable = 0}

  try{
    db.runAsync(`UPDATE user_profile SET total_shield_used = ${profile.total_shield_used + num+shield_mileStone_gain},
      low_shield_clamable = ${low_shield_clamable},
      mid_shield_clamable = ${mid_shield_clamable},
      full_shield_clamable = ${full_shield_clamable},
      updated_at = strftime('%s', 'now') WHERE id = '${profile.id}'`)
      const newProfile = await getUserProfile(db);
      return {
        profile: newProfile!,
        habitShield: num,
        mileStoneShield: shield_mileStone_gain  ,
        lowShieldClamable: low_shield_clamable,
        midShieldClamable: mid_shield_clamable,
        fullShieldClamable: full_shield_clamable
      }
  }
  catch (e){
    console.log('gainShield error', e);
    return {
      profile: null,
      habitShield: 0,
      mileStoneShield: 0,
      lowShieldClamable: 1,
midShieldClamable: 1,
fullShieldClamable: 1,
    };
  }}

export const clearStreak = async (
  db: SQLiteDatabase,
  profile: UserProfile,
  reduceHabitNumber: number = 0,
  reduceShieldNumber:number = 0,
  currentHabitSnap: number = 0,
) => {
  try {
    const today = getLocalTodayStr();
    // Tính habit score mới sau khi giảm
    const newHabit = Math.max(0, currentHabitSnap - reduceHabitNumber);

    // Mốc shield_rewards = [35, 70, 100]
    // Nếu newHabit rớt xuống dưới mốc nào -> bật lại claimable = 1 (true)
    const lowClaimable = newHabit < shield_rewards[0] ? 1 : profile.low_shield_clamable;
    const midClaimable = newHabit < shield_rewards[1] ? 1 : profile.mid_shield_clamable;
    const fullClaimable = newHabit < shield_rewards[2] ? 1 : profile.full_shield_clamable;

    await db.runAsync(
      `UPDATE user_profile 
       SET current_streak = 1, 
           active_days = ?, 
           streak_date = ?, 
           total_shield_used = ?, 
           current_habit_snap = ?,
           low_shield_clamable = ?,
           mid_shield_clamable = ?,
           full_shield_clamable = ?,
           updated_at = strftime('%s', 'now') 
       WHERE id = ?`,
      [
        profile.active_days + 1,
        today,
        profile.total_shield_used + reduceShieldNumber,
        newHabit,
        lowClaimable,
        midClaimable,
        fullClaimable,
        profile.id,
      ],
    );

    const newProfile = await getUserProfile(db);
    return newProfile;
  } catch (e) {
    console.log("clearStreak error", e);
    return null;
  }
};
