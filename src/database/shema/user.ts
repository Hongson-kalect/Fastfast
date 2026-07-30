import { FastSession, UserProfile } from "@/interfaces/db.type";
import { getLocalTodayStr } from "@/util/timer";
import { SQLiteDatabase } from "expo-sqlite";
import { getLastFastSession } from "./fast_sessions";

// Bảng 2: Thông tin người dùng (User Profile)
export const generateString = /*sql*/ `
CREATE TABLE IF NOT EXISTS user_profile (
    id TEXT PRIMARY KEY, -- UUID v7 sinh từ Client
    name TEXT,
    account_type TEXT DEFAULT 'free',
    image_uri TEXT,
    -- Thêm các trường Thống kê Kỷ lục (Cache)
    current_streak INTEGER DEFAULT 0,
    streak_date TEXT,                         -- 'YYYY-MM-DD' ngày streak cuối, để tính cộng streak
    max_streak INTEGER DEFAULT 0,
    last_fast_completed_at INTEGER,           -- Unix timestamp của phiên fast hoàn thành mới nhất
    rest_point INTEGER,           -- 'YYYY-MM-DD' quá ngày này thì mất streak
    
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
export const getProfileOnOpen = async (
  db: SQLiteDatabase
): Promise<UserProfile | null> => {
  // 1. Lấy Profile hiện tại từ DB
  const currentProfile = await getUserProfile(db)
  const currentFast = await getLastFastSession(db)

  if (!currentProfile) return null;

  // 2. Tính toán trạng thái Streak mới qua Pure Function
  const { profile: updatedProfile, currentFast: updatedFast, isFastChanged, isProfileChanged, restPointUsed } = checkAndUpdateStreakAndFast({userProfile:currentProfile, currentFast});

  // 3. Nếu không có thay đổi (ví dụ: đã vào app hôm nay rồi), trả về luôn không cần ghi DB
  if (isFastChanged) {
    // update fast;
  }
  if (isProfileChanged) {
    // update profile;
  }

  // 4. Nếu có thay đổi -> UPDATE vào DB
  // await db.runAsync(
  //   `UPDATE user_profile 
  //    SET current_streak = ?, 
  //        max_streak = ?, 
  //        streak_date = ?, 
  //        next_expected_streak_date = ?, 
  //        sync_status = 'pending', 
  //        updated_at = strftime('%s', 'now') 
  //    WHERE id = ?;`,
  //   [
  //     updatedProfile.current_streak,
  //     updatedProfile.max_streak,
  //     updatedProfile.streak_date,
  //     updatedProfile.next_expected_streak_date,
  //     updatedProfile.id,
  //   ]
  // );

  return updatedProfile;
};

export const getLocalTomorrowStr = (): string => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return getLocalTodayStr(tomorrow);
};

export const getDaysDifference = (dateStr1: string, dateStr2: string): number => {
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  const diffTime = d2.getTime() - d1.getTime();
  return Math.floor(diffTime / (1000 * 3600 * 24));
};

export interface CheckStreakAndFastInput {
  userProfile: UserProfile;
  currentFast: FastSession | null;
}

export interface CheckStreakAndFastResult {
  profile: UserProfile;
  currentFast: FastSession | null; // Nếu fast bị ngắt/hủy thì trả về null
  isProfileChanged: boolean;
  isFastChanged: boolean;
  restPointUsed:number
}

const MAX_FAST_HOURS_LIMIT = 240; // 10 ngày
export const checkAndUpdateStreakAndFast = ({
  userProfile,
  currentFast,
}: CheckStreakAndFastInput): CheckStreakAndFastResult => {
  const todayStr = getLocalTodayStr();
  // Toàn bộ Timestamp đồng bộ dùng MILI-GIÂY (ms)
  const nowTimestamp = Date.now(); 

  let updatedProfile = { ...userProfile };
  let updatedFast = currentFast ? { ...currentFast } : null;

  let isProfileChanged = false;
  let isFastChanged = false;

  const {
    current_streak = 0,
    max_streak = 0,
    streak_date,
    rest_point = 0,
  } = updatedProfile;


  // ==========================================================
  // 1. Validate active fast (Timestamp: Mili-giây)
  // ==========================================================

  let fastExpectedDate: string | null = null;
  let restPointUsed = 0;

  if (updatedFast && updatedFast.status === "active") {
    // 1 giờ = 3,600,000 ms
    const elapsedHours = (nowTimestamp - updatedFast.start_time) / 3_600_000;

    if (elapsedHours > MAX_FAST_HOURS_LIMIT) {
      updatedFast.status = "failed";
      updatedFast.is_deleted = 1;

      updatedFast = null;
      isFastChanged = true;
    } else if (updatedFast.target_duration) {
      // target_duration (giờ) * 3,600,000 ms -> targetTimestamp (ms)
      const targetTimestamp =
        updatedFast.start_time + updatedFast.target_duration * 3_600_000;

      // targetTimestamp đã là ms nên new Date() nhận chuẩn trực tiếp
      fastExpectedDate = getLocalTodayStr(new Date(targetTimestamp));
    }
  }


  // ==========================================================
  // 2. First launch
  // ==========================================================

  if (!streak_date) {
    updatedProfile = {
      ...updatedProfile,
      current_streak: 1,
      max_streak: Math.max(max_streak, 1),
      streak_date: todayStr,
      updated_at: nowTimestamp,
      sync_status: "pending",
    };

    return {
      profile: updatedProfile,
      currentFast: updatedFast,
      isProfileChanged: true,
      isFastChanged,
      restPointUsed
    };
  }


  // ==========================================================
  // 3. Calculate days passed
  // ==========================================================

  const streakCount = getDaysDifference(streak_date, todayStr);

  // Already checked today
  if (streakCount <= 0) {
    return {
      profile: updatedProfile,
      currentFast: updatedFast,
      isProfileChanged,
      isFastChanged,
      restPointUsed
    };
  }


  // ==========================================================
  // 4. Calculate expected date
  // ==========================================================

  let expectedDate = streak_date;

  if (fastExpectedDate) {
    expectedDate =
      expectedDate > fastExpectedDate ? expectedDate : fastExpectedDate;
  }

  const diff = getDaysDifference(expectedDate, todayStr);

  let newStreak = current_streak;
  let newRestPoint = rest_point;


  // ==========================================================
  // 5. Inside protection window
  // ==========================================================

  if (diff <= 1) {
    newStreak += streakCount;
  }


  // ==========================================================
  // 6. Need recovery points
  // ==========================================================

  else {
    const needRest = diff - 1;

    if (newRestPoint >= needRest) {
      newRestPoint -= needRest;
      newStreak += streakCount;
      restPointUsed = needRest;
    } else {
      // Break streak -> Reset về 1
      newStreak = 1;

      // KHÔNG reset rest_point
      newRestPoint = rest_point;
    }
  }


  updatedProfile = {
    ...updatedProfile,
    current_streak: newStreak,
    max_streak: Math.max(max_streak, newStreak),
    streak_date: todayStr,
    rest_point: newRestPoint,
    updated_at: nowTimestamp,
    sync_status: "pending",
  };

  isProfileChanged = true;

  return {
    profile: updatedProfile,
    currentFast: updatedFast,
    isProfileChanged,
    isFastChanged,
    restPointUsed
  };
};
