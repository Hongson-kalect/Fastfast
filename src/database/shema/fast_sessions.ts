import { FastSession, HabitLog, UserProfile } from "@/interfaces/db.type";
import { fixed } from "@/util/numberLimit";
import { getDaysDiff, getLocalTodayStr } from "@/util/timer";
import { uuidv7 } from "@/util/uuidv7";
import { SQLiteDatabase } from "expo-sqlite";
import {
  addHabitLogs,
  calculateStreakPenalties,
  getLastHabitLog,
  reduceHabit,
  reduceShield,
} from "./habit_logs";
import {
  clearStreak,
  getUserProfile,
  increaseStreak,
  shield_rewards,
  updateStreakDate,
} from "./user";

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

export const getFastSessionByIds = async (
  db: SQLiteDatabase,
  fast_ids: string[],
) => {
  try {
    const rows = await db.getAllAsync<FastSession>(
      `SELECT * FROM fast_sessions WHERE id IN (${fast_ids.join(",")});`,
    );
    return rows;
  } catch (e) {
    console.log("error on getFastSessionByIds", e);
    return null;
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

export const finishLastSession = async (
  db: SQLiteDatabase,
  data: {
    id: string;
    endTime: number;
  },
) => {
  try {
    const { id, endTime } = data;

    let result = {
      lastSession: null as FastSession | null,
      habitLog: null as HabitLog | null,
      profile: null as UserProfile | null,
    };

    await db.withTransactionAsync(async () => {
      const session = await db.getFirstAsync<FastSession>(
        `SELECT * FROM fast_sessions WHERE id = ?;`,
        [id],
      );

      if (!session) {
        throw new Error("FastSession not found");
      }

      // Chặn finish lại một session đã được xử lý
      if (session.status !== "active") {
        result = {
          lastSession: session,
          habitLog: await getLastHabitLog(db),
          profile: await getUserProfile(db),
        };
        return;
      }

      const startTime = session.start_time;
      if (endTime <= startTime) {
        throw new Error("Invalid endTime");
      }

      const duration = Math.floor((endTime - startTime) / 1000);
      const isTooQuick = duration < TOO_QUICK_DURATION;
      const isCompleted = duration >= MIN_FAST_DURATION;

      if (isTooQuick) {
        await db.runAsync(
          `UPDATE fast_sessions
           SET status = 'failed',
               end_time = ?,
               submit_time = ?,
               duration = ?,
               is_deleted = 1
           WHERE id = ?
             AND status = 'active';`,
          [endTime, Date.now(), duration, id],
        );

        const profile = await getUserProfile(db);
        const habitLog = await getLastHabitLog(db);

        if (!profile) {
          throw new Error("UserProfile not found");
        }
        await reconcileStreakAfterInvalidFast(
          db,
          profile,
          habitLog,
          getLocalTodayStr(),
        );

        result = {
          lastSession: null,
          habitLog: await getLastHabitLog(db),
          profile: await getUserProfile(db),
        };

        return;
      }

      const oldProfile = await getUserProfile(db);
      const oldHabitLog = await getLastHabitLog(db);

      if (!oldProfile) {
        throw new Error("UserProfile not found");
      }

      if (!isCompleted) {
        await db.runAsync(
          `UPDATE fast_sessions
           SET end_time = ?,
               submit_time = ?,
               duration = ?,
               status = 'failed'
           WHERE id = ?
             AND status = 'active';`,
          [endTime, Date.now(), duration, id],
        );

        await reconcileStreakAfterInvalidFast(
          db,
          oldProfile,
          oldHabitLog,
          getLocalTodayStr(),
        );

        result = {
          lastSession: await db.getFirstAsync<FastSession>(
            `SELECT * FROM fast_sessions WHERE id = ?;`,
            [id],
          ),
          habitLog: await getLastHabitLog(db),
          profile: await getUserProfile(db),
        };

        return;
      }

      const hours = duration / 3600;
      const habitDelta = fixed(3.0 + (hours - 16) * 0.2);
      const sessionShieldGain = Math.max(0, Math.floor(hours / 24) - 1);
      const oldHabitScore = oldHabitLog?.habit_snap || 0;
      const newHabitScore = fixed(oldHabitScore + habitDelta);

      let milestoneShieldGain = 0;
      let lowClaimable = oldProfile.low_shield_clamable;
      let midClaimable = oldProfile.mid_shield_clamable;
      let fullClaimable = oldProfile.full_shield_clamable;

      if (newHabitScore >= shield_rewards[0] && lowClaimable) {
        milestoneShieldGain += 1;
        lowClaimable = 0;
      }

      if (newHabitScore >= shield_rewards[1] && midClaimable) {
        milestoneShieldGain += 1;
        midClaimable = 0;
      }

      if (newHabitScore >= shield_rewards[2] && fullClaimable) {
        milestoneShieldGain += 1;
        fullClaimable = 0;
      }
      await db.runAsync(
        `UPDATE fast_sessions
         SET end_time = ?,
             submit_time = ?,
             duration = ?,
             status = 'completed'
         WHERE id = ?
           AND status = 'active';`,
        [endTime, Date.now(), duration, id],
      );
      const newHabitLog = await addHabitLogs(db, {
        fast_id: id,
        log_date: getLocalTodayStr(new Date(endTime)),
        habit_detla: habitDelta,
        shield_delta: sessionShieldGain,
        shield_milestone: milestoneShieldGain,
        habit_snap: newHabitScore,
      });
      const totalShieldGain = sessionShieldGain + milestoneShieldGain;

      await db.runAsync(
        `UPDATE user_profile
         SET total_shield_clamable = total_shield_clamable + ?,
             low_shield_clamable = ?,
             mid_shield_clamable = ?,
             full_shield_clamable = ?,
             updated_at = strftime('%s', 'now')
         WHERE id = ?;`,
        [
          totalShieldGain,
          lowClaimable,
          midClaimable,
          fullClaimable,
          oldProfile.id,
        ],
      );
      const startDate = getLocalTodayStr(new Date(startTime));
      const endDate = getLocalTodayStr(new Date(endTime));
      const streakGain = oldProfile.streak_date
        ? Math.max(getDaysDiff(oldProfile.streak_date, endDate), 0)
        : 0;

      const updatedProfileByStreak = await increaseStreak(
        db,
        (await getUserProfile(db)) || oldProfile,
        streakGain,
        0,
      );

      const finalProfile = await updateStreakDate(
        db,
        updatedProfileByStreak!,
        endDate,
      );

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const yesterdayStr = getLocalTodayStr(yesterday);

      if (endDate < yesterdayStr) {
        await reconcileStreakAfterCompletedFast(
          db,
          finalProfile!,
          await getLastHabitLog(db),
          endDate,
          getLocalTodayStr(),
        );
      }

      result = {
        lastSession: await db.getFirstAsync<FastSession>(
          `SELECT * FROM fast_sessions WHERE id = ?;`,
          [id],
        ),
        habitLog: await getLastHabitLog(db),
        profile: await getUserProfile(db),
      };
    });

    return result;
  } catch (error) {
    console.error("error on finishLastSession:", error);

    return {
      lastSession: null,
      habitLog: null,
      profile: null,
    };
  }
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
) => {
  try {
    await db.runAsync(
      `UPDATE fast_sessions SET target_duration = ? WHERE id = ?;`,
      [targetDuration, id],
    );

    const res = await getLastFastSession(db);
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
  todayStr: string
) => {
  if (!lastFast || lastFast.end_time) {
    return { isFastFail: false, referenceDate: previousLoginDate };
  }

  const currentFastHours = (Date.now() - lastFast.start_time) / (60 * 60 * 1000);
  const hasTarget = Boolean(lastFast.target_duration && lastFast.target_duration > 0);

  let isFastFail = false;

  if (currentFastHours > MAX_FAST_HOURS) {
    isFastFail = true;
  } else if (hasTarget) {
    const targetEndTime = lastFast.start_time + lastFast.target_duration! * 3600 * 1000;
    const targetDayStr = getLocalTodayStr(new Date(targetEndTime));
    const effectiveLastActiveDate = targetDayStr > previousLoginDate ? targetDayStr : previousLoginDate;

    if (getDaysDiff(effectiveLastActiveDate, todayStr) > 1) {
      isFastFail = true;
    }
  }

  return {
    isFastFail,
    referenceDate: previousLoginDate,
  };
};