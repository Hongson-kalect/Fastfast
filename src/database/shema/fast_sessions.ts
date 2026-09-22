import { FastSession, HabitLog, UserProfile } from "@/interfaces/db.type";
import { StreakCheckResult } from "@/interfaces/home.type";
import { fixed, numberLimit } from "@/util/numberLimit";
import {
  applyClearStreak,
  applyHabitReward,
  applyShieldReward,
  applyStreakDate,
  applyStreakReward,
  createStreakContext,
  getYesterdayStr,
  saveStreakContext,
  StreakContext,
} from "@/util/streak";
import { getDaysDiff, getLocalTodayStr } from "@/util/timer";
import { uuidv7 } from "@/util/uuidv7";
import { SQLiteDatabase } from "expo-sqlite";
import {
  addHabitLogs,
  calculatePenaltyEffect,
  calculateStreakPenalties,
  getLastHabitLog,
  reduceHabit,
  reduceShield,
  RETAIN_LIMIT,
  SHIELD_LIMIT,
} from "./habit_logs";
import { clearStreak, getUserProfile, shield_rewards } from "./user";

// Bảng 3: Phiên nhịn ăn gốc (Fast Sessions)
export const generateString = /*sql*/ `
CREATE TABLE IF NOT EXISTS fast_sessions (
    id TEXT PRIMARY KEY,               -- UUID v7 sinh từ Client
    start_time INTEGER NOT NULL,       -- millisecond timestamp
    end_time INTEGER,                  -- millisecond timestamp, Null khi đang fast
    submit_time INTEGER,               -- millisecond timestamp, thời điểm user xác nhận hoàn thành, Null khi đang fast
    target_duration INTEGER,           -- Mục tiêu nhịn (đơn vị: GIỜ, ví dụ: 16, 18, 20)
    duration INTEGER,           -- 🌟 THÊM: Thời gian nhịn thực tế (đơn vị: GIÂY), NULL nếu đang chạy
    home_data_snapshot TEXT,           -- JSON string lưu chỉ số sinh học
    is_deleted INTEGER DEFAULT 0,       -- Xóa mềm cho Local-first: 0 = False, 1 = True
    sync_status TEXT DEFAULT 'pending', -- 'synced', 'pending'
    status TEXT DEFAULT 'active',       -- 'active', 'completed', 'failed'
    shield_point_clamable INTEGER DEFAULT 1,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);
`;

export const getFastSessions = async (
  db: SQLiteDatabase,
): Promise<FastSession[]> => {
  const rows = await db.getAllAsync<FastSession>(
    `SELECT * FROM fast_sessions where is_deleted = 0 order by updated_at desc;`,
  );
  return rows;
};

export type FastStatsSummary = {
  // Thống kê tổng quan
  total_hours: number;
  avg_hours: number;
  max_hours: number;
  total_sessions: number;

  // Phân bố theo Level (Giờ nhịn)
  above_16: number;
  above_20: number;
  above_24: number;
  above_36: number;
  above_48: number;
  above_72: number;
};

/**
 * Lấy toàn bộ chỉ số thống kê & phân bố level nhịn ăn trong 1 Query duy nhất
 */
export const getFastStatsSummary = async (
  db: SQLiteDatabase,
): Promise<FastStatsSummary> => {
  const query = /*sql*/ `
    SELECT 
      -- 1. Các chỉ số tổng quan
      COALESCE(SUM(hours), 0) AS total_hours,
      COALESCE(AVG(hours), 0) AS avg_hours,
      COALESCE(MAX(hours), 0) AS max_hours,
      COUNT(*) AS total_sessions,

      -- 2. Phân bố theo mốc Level (Conditional Aggregation)
      COUNT(CASE WHEN hours >= 16 AND hours < 20 THEN 1 END) AS above_16,
      COUNT(CASE WHEN hours >= 20 AND hours < 24 THEN 1 END) AS above_20,
      COUNT(CASE WHEN hours >= 24 AND hours < 36 THEN 1 END) AS above_24,
      COUNT(CASE WHEN hours >= 36 AND hours < 48 THEN 1 END) AS above_36,
      COUNT(CASE WHEN hours >= 48 AND hours < 72 THEN 1 END) AS above_48,
      COUNT(CASE WHEN hours >= 72 THEN 1 END) AS above_72
    FROM (
      SELECT (duration / 3600.0) AS hours
      FROM fast_sessions
      WHERE is_deleted = 0 
        AND status = 'completed'
        AND duration IS NOT NULL
    ) AS completed_sessions;
  `;
  try {
    const res = await db.getFirstAsync<FastStatsSummary>(query);
    return (
      res || {
        total_hours: 0,
        avg_hours: 0,
        max_hours: 0,
        total_sessions: 0,
        above_16: 0,
        above_20: 0,
        above_24: 0,
        above_36: 0,
        above_48: 0,
        above_72: 0,
      }
    );
  } catch (e) {
    console.log("error on getFastStatsSummary", e);
    return {
      total_hours: 0,
      avg_hours: 0,
      max_hours: 0,
      total_sessions: 0,
      above_16: 0,
      above_20: 0,
      above_24: 0,
      above_36: 0,
      above_48: 0,
      above_72: 0,
    };
  }
};

export const getLastFastSession = async (
  db: SQLiteDatabase,
): Promise<FastSession | null> => {
  try {
    const row = await db.getFirstAsync<FastSession>(
      `SELECT * FROM fast_sessions where is_deleted = 0 AND status <> 'failed' ORDER BY updated_at DESC LIMIT 1;`,
    );
    return row;
  } catch (e) {
    console.log("error on getLastFastSession", e);
    return null;
  }
};

export const getSessionById = async (
  db: SQLiteDatabase,
  id: string,
): Promise<FastSession | null> => {
  try {
    const row = await db.getFirstAsync<FastSession>(
      `SELECT * FROM fast_sessions where is_deleted = 0 AND id = ? ORDER BY updated_at DESC LIMIT 1;`,
      [id],
    );
    return row;
  } catch (e) {
    console.log("error on getActiveSession", e);
    return null;
  }
};

export const getFastSessionByIds = async (
  db: SQLiteDatabase,
  fast_ids: string[],
) => {
  try {
    if (!fast_ids.length) return [];

    const placeholders = fast_ids.map(() => "?").join(",");

    const rows = await db.getAllAsync<FastSession>(
      `SELECT * FROM fast_sessions
       WHERE id IN (${placeholders})`,
      fast_ids,
    );

    return rows;
  } catch (e) {
    console.log("error on getFastSessionByIds", e);
    return [];
  }
};

export const getYearFastSession = async (
  db: SQLiteDatabase,
  year: number,
): Promise<FastSession | null> => {
  try {
    const row = await db.getFirstAsync<FastSession>(
      `SELECT * FROM fast_sessions WHERE is_deleted = 0 AND strftime('%Y', start_time) = ${year} ORDER BY updated_at DESC;`,
    );
    return row;
  } catch (e) {
    console.log("error on getYearFastSession", e);
    return null;
  }
};

export const TOO_QUICK_DURATION = 30 * 60; // 30 phút, ví dụ
export const MIN_FAST_DURATION = 16 * 3600; // 16 giờ, ví dụ
export const MAX_FAST_HOURS = 100;

type FinishFastResult = {
  lastSession: FastSession | null;
  habitLog: HabitLog | null;
  profile: UserProfile | null;
  streak: StreakCheckResult | null;
};

export const finishLastSession = async ({
  db,
  id,
  endTime,
}: {
  db: SQLiteDatabase;
  id: string;
  endTime: number;
}): Promise<FinishFastResult> => {
  let result: {
    lastSession: FastSession | null;
    profile: UserProfile | null;
    habitLog: HabitLog | null;
    streak: StreakCheckResult | null;
  } = {
    lastSession: null,
    profile: null,
    habitLog: null,
    streak: null,
  };
  await db.withTransactionAsync(async () => {
    // --------------------------------------------------
    // 1. Load session
    // --------------------------------------------------

    const lastFast = await getSessionById(db, id);

    if (!lastFast) {
      return;
    }

    // Idempotency
    if (lastFast.end_time) {
      result.lastSession = lastFast;
      return;
    }

    // --------------------------------------------------
    // 2. Calculate duration / status
    // --------------------------------------------------

    const duration = Math.floor((endTime - lastFast.start_time) / 1000);

    const status = getFastFinishStatus(duration);

    // --------------------------------------------------
    // 3. Load streak state
    // --------------------------------------------------

    const profile = await getUserProfile(db);
    const habitLog = await getLastHabitLog(db);

    if (!profile) {
      throw new Error("UserProfile not found");
    }

    const streak = createStreakContext(profile, habitLog);

    console.log("prev handleFast: ", { profile, habitLog, streak });

    // --------------------------------------------------
    // 4. Too quick
    // --------------------------------------------------

    if (status === "too_quick") {
      const returnLastFast = await handleTooQuickFast(
        db,
        lastFast,
        endTime,
        duration,
        streak,
      );

      await saveStreakContext(db, streak);

      result = {
        lastSession: returnLastFast,
        profile: streak.profile,
        habitLog: streak.habitLog,
        streak: streak.stats,
      };
      return;
    }

    // --------------------------------------------------
    // 5. Failed
    // --------------------------------------------------

    if (status === "failed") {
      const returnLastFast = await handleFailedFast(
        db,
        lastFast,
        endTime,
        duration,
        streak,
      );

      await saveStreakContext(db, streak);

      result = {
        lastSession: returnLastFast,
        profile: streak.profile,
        habitLog: streak.habitLog,
        streak: streak.stats,
      };
      return;
    }

    // --------------------------------------------------
    // 6. Completed
    // --------------------------------------------------

    const { lastSession, habitLog: returnHabitLog } = await handleCompletedFast(
      db,
      lastFast,
      endTime,
      duration,
      streak,
    );

    result = {
      lastSession: lastSession,
      profile: streak.profile,
      habitLog: returnHabitLog,
      streak: streak.stats,
    };
    return;
  });

  return result;
};

const getFastFinishStatus = (duration: number) => {
  if (duration < TOO_QUICK_DURATION) {
    return "too_quick";
  } else if (duration < MIN_FAST_DURATION) {
    return "failed";
  } else {
    return "completed";
  }
};

const handleTooQuickFast = async (
  db: SQLiteDatabase,
  session: FastSession,
  endTime: number,
  duration: number,
  streak: StreakContext,
) => {
  await db.runAsync(
    `UPDATE fast_sessions
     SET status = 'failed',
         end_time = ?,
         submit_time = ?,
         duration = ?,
         is_deleted = 1
     WHERE id = ?
       AND status = 'active';`,
    [endTime, Date.now(), duration, session.id],
  );

  return await getSessionById(db, session.id);
};

const handleFailedFast = async (
  db: SQLiteDatabase,
  session: FastSession,
  endTime: number,
  duration: number,
  streak: StreakContext,
) => {
  await db.runAsync(
    `UPDATE fast_sessions
     SET end_time = ?,
         submit_time = ?,
         duration = ?,
         status = 'failed'
     WHERE id = ?
       AND status = 'active';`,
    [endTime, Date.now(), duration, session.id],
  );

  return await getSessionById(db, session.id);
};

const handleCompletedFast = async (
  db: SQLiteDatabase,
  session: FastSession,
  endTime: number,
  duration: number,
  streak: StreakContext,
) => {
  const reward = calculateFastReward(duration, streak.profile, streak.habitLog);

  // ----------------------------------------
  // Update FastSession
  // ----------------------------------------

  await db.runAsync(
    `UPDATE fast_sessions
     SET end_time = ?,
         submit_time = ?,
         duration = ?,
         status = 'completed'
     WHERE id = ?
       AND status = 'active';`,
    [endTime, Date.now(), duration, session.id],
  );

  const sessionUpdated = await getSessionById(db, session.id);

  // ----------------------------------------
  // Habit history
  // ----------------------------------------

  const lastLog = await addHabitLogs(db, {
    fast_id: session.id,
    log_date: getLocalTodayStr(new Date(endTime)),
    ...reward,
  });

  streak.habitLog = lastLog;

  // ----------------------------------------
  // Update current streak context
  // ----------------------------------------

  applyHabitReward(streak, reward);

  applyShieldReward(streak, reward);

  applyStreakReward(streak, endTime);

  return {
    lastSession: sessionUpdated,
    habitLog: lastLog,
  };
};

export const calculateFastReward = (
  duration: number,
  profile: UserProfile,
  habitLog: HabitLog | null,
) => {
  const hours = duration / 3600;

  // ─────────────────────────────
  // Fast reward
  // ─────────────────────────────

  const inputHabitDelta = fixed(3.0 + (hours - 16) * 0.2);

  const sessionShieldGain = Math.max(0, Math.floor(hours / 24) - 1);

  const oldHabitScore = habitLog?.habit_snap || 0;
  const oldRetain = habitLog?.habit_retain || 0;
  const oldShieldScore = habitLog?.shield_snap || 0;

  // ─────────────────────────────
  // Habit / Retain
  // ─────────────────────────────

  let habitDelta = inputHabitDelta;
  let newHabitScore = oldHabitScore;

  let retainDelta = 0;
  let newRetain = oldRetain;

  let bonusShieldGain = 0;

  if (inputHabitDelta < 0) {
    // Habit giảm → không ảnh hưởng retain
    newHabitScore = fixed(oldHabitScore + inputHabitDelta);
  } else if (oldHabitScore >= 100) {
    // Habit đã đầy → chuyển reward sang retain
    habitDelta = 0;

    retainDelta = inputHabitDelta;
    newRetain = oldRetain + retainDelta;

    // Retain đủ một vòng
    if (newRetain >= RETAIN_LIMIT) {
      newRetain = 1;
      bonusShieldGain = 1;
    }
  } else {
    // Habit chưa đầy → cộng bình thường
    newHabitScore = fixed(oldHabitScore + inputHabitDelta);
  }

  // ─────────────────────────────
  // Milestone shield
  // ─────────────────────────────

  let milestoneShieldGain = 0;

  let lowClaimable = profile.low_shield_clamable;
  let midClaimable = profile.mid_shield_clamable;
  let fullClaimable = profile.full_shield_clamable;

  if (newHabitScore >= shield_rewards[0] && lowClaimable) {
    milestoneShieldGain++;
    lowClaimable = 0;
  }

  if (newHabitScore >= shield_rewards[1] && midClaimable) {
    milestoneShieldGain++;
    midClaimable = 0;
  }

  if (newHabitScore >= shield_rewards[2] && fullClaimable) {
    milestoneShieldGain++;
    fullClaimable = 0;
  }

  // ─────────────────────────────
  // Total shield
  // ─────────────────────────────

  const totalShieldGain =
    sessionShieldGain + milestoneShieldGain + bonusShieldGain;

  const newShieldScore = numberLimit(
    oldShieldScore + totalShieldGain,
    0,
    SHIELD_LIMIT,
  );

  return {
    // Habit
    habitDelta,
    newHabitScore,

    // Retain
    retainDelta,
    newRetain,

    // Shield
    sessionShieldGain,
    milestoneShieldGain,
    bonusShieldGain,
    totalShieldGain,
    newShieldScore,

    // Milestone state
    lowClaimable,
    midClaimable,
    fullClaimable,
  };
};

const reconcileStreakAfterInvalidFast = async (
  db: SQLiteDatabase,
  profile: UserProfile,
  habitLog: HabitLog | null,
  todayStr: string,
) => {
  const referenceDate = profile.streak_date || profile.last_login_date;

  if (!referenceDate) {
    return;
  }

  const currentShield = habitLog?.shield_snap || 0;

  const {
    gap,
    reduceShieldNumber,
    reduceHabitNumber,
    overRestDays,
    isStreakSavedByShield,
  } = calculateStreakPenalties(referenceDate, todayStr, currentShield);

  if (gap <= 1) {
    return;
  }

  if (isStreakSavedByShield) {
    if (habitLog && reduceShieldNumber > 0) {
      await reduceShield(db, habitLog, reduceShieldNumber);
    }

    return;
  }

  await clearStreak(
    db,
    profile,
    reduceHabitNumber,
    reduceShieldNumber,
    habitLog?.habit_snap || 0,
  );

  if (habitLog) {
    await reduceHabit(db, habitLog, reduceHabitNumber, overRestDays);
  }
};

const reconcileStreakAfterCompletedFast = async (
  db: SQLiteDatabase,
  profile: UserProfile,
  habitLog: HabitLog | null,
  endDate: string,
  todayStr: string,
) => {
  const currentShield = habitLog?.shield_snap || 0;

  const {
    gap,
    reduceShieldNumber,
    reduceHabitNumber,
    overRestDays,
    isStreakSavedByShield,
  } = calculateStreakPenalties(endDate, todayStr, currentShield);

  if (gap <= 1) {
    return;
  }

  if (isStreakSavedByShield) {
    if (habitLog && reduceShieldNumber > 0) {
      await reduceShield(db, habitLog, reduceShieldNumber);
    }

    return;
  }

  await clearStreak(
    db,
    profile,
    reduceHabitNumber,
    reduceShieldNumber,
    habitLog?.habit_snap || 0,
  );

  if (habitLog) {
    await reduceHabit(db, habitLog, reduceHabitNumber, overRestDays);
  }
};

export const startNewSession = async (
  db: SQLiteDatabase,
  time: number,
  targetDuration: number | null = null,
) => {
  const id = uuidv7();
  try {
    await db.runAsync(
      `INSERT INTO fast_sessions (id, start_time, target_duration) VALUES (?, ?, ?);`,
      [id, time, targetDuration],
    );

    const res = await getLastFastSession(db);
    return res;
  } catch (e) {
    console.log("error on startNewSession", e);
    return null;
  }
};

export const updateSessionTarget = async (
  db: SQLiteDatabase,
  id: string,
  targetDuration: number | null,
): Promise<FastSession | null> => {
  try {
    await db.runAsync(
      `UPDATE fast_sessions SET target_duration = ? WHERE id = ?;`,
      [targetDuration, id],
    );

    const res = await db.getFirstAsync<FastSession>(
      `SELECT * FROM fast_sessions WHERE id = ?;`,
      [id],
    );
    return res;
  } catch (e) {
    console.log("error on updateSessionTarget", e);
    return null;
  }
};

export const deleteSession = async (db: SQLiteDatabase, id: string) => {
  console.log("xóa chít mợ m, ", id);
  try {
    await db.runAsync(`Update fast_sessions SET is_deleted = 1 WHERE id = ?;`, [
      id,
    ]);
  } catch (e) {
    console.log("error on deleteSession", e);
  }
};

export const fastFail = async (
  db: SQLiteDatabase,
  fastSession: FastSession,
) => {
  try {
    await db.runAsync(
      `Update fast_sessions SET status = 'failed', shield_point_clamable = 0 WHERE id = ?;`,
      [fastSession.id],
    );
    return await getLastFastSession(db);
  } catch (e) {
    console.log("error on fastFail", e);
    return null;
  }
};

export const deleteFast = async (db: SQLiteDatabase, id: string) => {
  try {
    await db.runAsync(`Update fast_sessions SET is_deleted = 1 WHERE id = ?;`, [
      id,
    ]);
  } catch (e) {
    console.log("error on deleteFast", e);
  }
};

export const evaluateFastStatus = (
  lastFast: FastSession | null,
  previousLoginDate: string,
  todayStr: string,
) => {
  if (!lastFast || lastFast.end_time) {
    return { isFastFail: false, referenceDate: previousLoginDate };
  }

  const currentFastHours =
    (Date.now() - lastFast.start_time) / (60 * 60 * 1000);
  const hasTarget = Boolean(
    lastFast.target_duration && lastFast.target_duration > 0,
  );

  let isFastFail = false;

  if (currentFastHours > MAX_FAST_HOURS) {
    isFastFail = true;
  } else if (hasTarget) {
    const targetEndTime =
      lastFast.start_time + lastFast.target_duration! * 3600 * 1000;
    const targetDayStr = getLocalTodayStr(new Date(targetEndTime));
    const effectiveLastActiveDate =
      targetDayStr > previousLoginDate ? targetDayStr : previousLoginDate;

    if (getDaysDiff(effectiveLastActiveDate, todayStr) > 1) {
      isFastFail = true;
    }
  }

  return {
    isFastFail,
    referenceDate: previousLoginDate,
  };
};

export const reconcileStreak = async (
  db: SQLiteDatabase,
  lastFast: FastSession | null,
  profile: UserProfile | null,
  habitLog: HabitLog | null,
) => {
  const todayStr = getLocalTodayStr();

  if (!profile) {
    return {
      profile,
      habitLog,
      streak: null,
    };
  }

  // Không có streak checkpoint
  if (!profile.streak_date) {
    return {
      profile,
      habitLog,
      streak: null,
    };
  }

  const streak = createStreakContext(profile, habitLog);

  // --------------------------------------------------
  // 1. Get reference date
  // --------------------------------------------------

  const referenceDate = lastFast?.end_time
    ? getLocalTodayStr(new Date(lastFast.end_time))
    : profile.streak_date;

  // --------------------------------------------------
  // 2. Calculate penalty
  // --------------------------------------------------

  const currentShield = streak.habitLog?.shield_snap || 0;

  const { gap, overRestDays, isStreakSavedByShield, ...data } =
    calculatePenaltyEffect(referenceDate, streak.profile, streak.habitLog);

  // --------------------------------------------------
  // 3. No gap
  // --------------------------------------------------

  if (gap <= 1) {
    return {
      profile: streak.profile,
      habitLog: streak.habitLog,
      streak: null,
    };
  }

  const returnedHabitLog = await addHabitLogs(db, {
    log_date: todayStr,
    ...data,
  });

  streak.stats.habit.currentPercent = returnedHabitLog?.habit_snap || 0;
  streak.stats.shield.current = returnedHabitLog?.shield_snap || 0;
  streak.stats.retain.current = returnedHabitLog?.habit_retain || 0;

  applyStreakDate(streak, getYesterdayStr(todayStr));

  // --------------------------------------------------
  // 4. Shield saves streak
  // --------------------------------------------------
  if (data.shieldDelta) {
    streak.profile.total_shield_used =
      (streak.profile.total_shield_used || 0) + data.shieldDelta;
  }

  if (isStreakSavedByShield) {
    await saveStreakContext(db, streak);

    return {
      profile: streak.profile,
      habitLog: returnedHabitLog,
      streak: streak.stats,
    };
  }

  // --------------------------------------------------
  // 5. Streak lost
  // --------------------------------------------------

  applyClearStreak(streak);

  await saveStreakContext(db, streak);

  return {
    profile: streak.profile,
    habitLog: returnedHabitLog,
    streak: streak.stats,
  };
};
