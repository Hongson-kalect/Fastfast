import { FastSession, HabitEffect, HabitLog, UserProfile } from "@/interfaces/db.type";
import { getDaysDiff, getLocalTodayStr } from "@/util/timer";
import { uuidv7 } from "@/util/uuidv7";
import { SQLiteDatabase } from "expo-sqlite";
import { fixed, numberLimit } from "./../../util/numberLimit";
import { shield_rewards } from "./user";

// Bảng 4: Phân rã dữ liệu theo ngày dương lịch (Habit Logs) để vẽ Chart và Grid
export const generateString = /*sql*/ `
CREATE TABLE IF NOT EXISTS habit_logs (
    id TEXT NOT NULL PRIMARY KEY,
    log_date TEXT NOT NULL,         -- Định dạng 'YYYY-MM-DD'
    fast_id TEXT,          -- Liên kết đến phiên gốc chịu trách nhiệm số giờ lớn nhất

    type TEXT,             -- 'habit+', 'habit-', 'shield+', 'shield-'

    habit_delta REAL,
    habit_snap REAL,
    shield_detail TEXT, -- [Số shield trừ do nghỉ or cộng do fast, số shield tăng bởi retain, tăng bởi bonus mốc, tăng bởi sự kiện]
    
    shield_delta REAL,
    shield_snap REAL,
    overest INTEGER,
    
    habit_retain REAL,
    retain_delta REAL,

    is_deleted INTEGER DEFAULT 0,   -- Xóa mềm phục vụ đồng bộ
    sync_status TEXT DEFAULT 'pending',
    description TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (fast_id) REFERENCES fast_sessions(id) ON DELETE SET NULL
    --user_id TEXT NOT NULL,
    -- FOREIGN KEY (user_id) REFERENCES user_profile(id) ON DELETE CASCADE,
  );

--CREATE INDEX IF NOT EXISTS idx_habit_logs_user_date ON habit_logs(user_id, log_date);
`;

export const RETAIN_LIMIT = 25;
export const SHIELD_LIMIT = 3;

export const getHabitLogs = async (
  db: SQLiteDatabase,
  days: number = 30,
): Promise<(HabitLog & FastSession)[]> => {
  const today = getLocalTodayStr();
  const startDay = new Date(today);
  startDay.setDate(startDay.getDate() - days);
  const startDate = getLocalTodayStr(startDay);
  const rows = await db.getAllAsync<HabitLog & FastSession>(
    `
  SELECT
    hl.*,

    fs.start_time AS start_time,
    fs.end_time AS end_time,
    fs.target_duration AS target_duration,
    fs.duration AS duration,
    fs.home_data_snapshot AS home_data_snapshot,
    fs.status AS status,
    fs.shield_point_clamable AS shield_point_clamable,
    fs.created_at AS fast_created_at,
    fs.updated_at AS fast_updated_at

  FROM habit_logs hl

  LEFT JOIN fast_sessions fs
    ON hl.fast_id = fs.id

  WHERE hl.log_date >= ?
    AND hl.is_deleted = 0
    AND (fs.is_deleted = 0 OR fs.id IS NULL)

  ORDER BY hl.log_date DESC, hl.created_at DESC;
  `,
    [startDate],
  );
  // const rows = await db.getAllAsync<HabitLog>(`SELECT * FROM habit_logs;`);
  return rows;
};

export const getLastHabitLog = async (
  db: SQLiteDatabase,
): Promise<HabitLog | null> => {
  const today = getLocalTodayStr();
  const rows = await db.getFirstAsync<HabitLog>(
    `SELECT * FROM habit_logs ORDER BY updated_at DESC LIMIT 1;`,
  );
  return rows;
};

export type AddHabitType = {
  log_date?: string;
  fast_id?: string;
  habit_detla?: number;
  habit_snap?: number;
  shield_delta?: number;
  shield_snap?: number;

  retain?: number;
  retain_delta?: number;

  shield_milestone?: number;

  lastLog?: HabitLog | null;
};

export const addHabitLogs = async (
  db: SQLiteDatabase,
  data: {
    log_date?: string;
    fast_id?: string;} & HabitEffect,
) => {
  const id = uuidv7();
  const logDate = data.log_date || getLocalTodayStr();

  const {
    habitDelta,
    newHabitScore: habitSnap,
    retainDelta,
    totalShieldGain: shieldDelta,
    newShieldScore: shieldSnap,
    milestoneShieldGain,
    bonusShieldGain,
    sessionShieldGain,
    newRetain: retainSnap,
  } = data;

  let shieldDetail = null;
  if (sessionShieldGain || milestoneShieldGain || bonusShieldGain) {
    shieldDetail = {
      session: sessionShieldGain,
      milestone: milestoneShieldGain,
      bonus: bonusShieldGain,
    };
  }

  await db.runAsync(
    `INSERT INTO habit_logs (
      id,
      log_date,
      fast_id,
      habit_delta,
      habit_snap,
      retain_delta,
      shield_delta,
      shield_snap,
      habit_retain,
      shield_detail
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      logDate,
      data.fast_id || null,

      numberLimit(habitDelta, 0, 100),
      numberLimit(habitSnap, 0, 100),

      retainDelta,

      shieldDelta,
      numberLimit(shieldSnap, 0, SHIELD_LIMIT),

      numberLimit(retainSnap, 0, RETAIN_LIMIT),

      shieldDetail && JSON.stringify(shieldDetail),
    ],
  );

  return await db.getFirstAsync<HabitLog>(
    `SELECT * FROM habit_logs WHERE id = ?`,
    [id],
  );
};

export const reduceShield = async (
  db: SQLiteDatabase,
  lastHabitLog: HabitLog,
  reduce: number,
) => {
  const today = getLocalTodayStr();
  const id = uuidv7();
  try {
    await db.runAsync(
      `INSERT INTO habit_logs 
    (id, log_date, fast_id, habit_delta, habit_snap, shield_delta, shield_snap, habit_retain) 
    VALUES (?, ?, ?, ?, ?,?,?,?)`,
      [
        id,
        today,
        null,
        0,
        lastHabitLog.habit_snap,
        -reduce,
        lastHabitLog.shield_snap - reduce,
        lastHabitLog.habit_retain || 0,
      ],
    );

    const lastHabit = await getLastHabitLog(db);
    return lastHabit;
  } catch (e) {
    console.log("error on reduceShield", e);
    return null;
  }
};
export const reduceHabit = async (
  db: SQLiteDatabase,
  lastHabitLog: HabitLog,
  reduce: number,
  days: number,
) => {
  const today = getLocalTodayStr();
  const id = uuidv7();
  try {
    await db.runAsync(
      `INSERT INTO habit_logs 
      (id, log_date, fast_id, habit_delta, habit_snap, shield_delta, shield_snap, habit_retain, overest) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        today,
        null,
        -reduce,
        Math.max(fixed(lastHabitLog.habit_snap - reduce), 0),
        -lastHabitLog.shield_snap,
        0,
        0,
        days,
      ],
    );

    const lastHabit = await getLastHabitLog(db);
    return lastHabit;
  } catch (e) {
    console.log("error on reduceHabit", e);
    return null;
  }
};

export const getShieldUsedLog = async (
  db: SQLiteDatabase,
  year: number,
): Promise<HabitLog[]> => {
  try {
    // Ngày bắt đầu: '2026-01-01'
    const startDate = `${year}-01-01`;

    // Ngày kết thúc: Ngày 1/1 năm sau + thêm 7 ngày (tức ngày 2027-01-08)
    // Dùng date() của SQLite để tự động tính toán chính xác tuyệt đối
    const query = `
      SELECT * FROM habit_logs 
      WHERE shield_delta < 0 
        AND log_date >= ? 
        AND log_date <= date(?, '+1 year', '+7 days')
      ORDER BY log_date ASC
    `;

    // Dùng Parameterized Query (?) để chống SQL Injection & tối ưu performance
    const rows = await db.getAllAsync<HabitLog>(query, [startDate, startDate]);
    return rows;
  } catch (e) {
    console.log("error on getShieldUsed", e);
    return [];
  }
};

// Helper 2: Calculate Gap, Shield & Habit Penalties
export const calculateStreakPenalties = (
  referenceDate: string,
  todayStr: string,
  currentShield: number,
) => {
  const gap = getDaysDiff(referenceDate, todayStr);
  const shieldNeed = Math.max(gap - 1, 0);

  if (gap <= 1) {
    return {
      gap,
      reduceShieldNumber: 0,
      reduceHabitNumber: 0,
      overRestDays: 0,
      isStreakSavedByShield: false,
    };
  }

  if (currentShield >= shieldNeed) {
    return {
      gap,
      reduceShieldNumber: shieldNeed,
      reduceHabitNumber: 0,
      overRestDays: 0,
      isStreakSavedByShield: true,
    };
  }

  // Khái niệm overRestDays -= currentShield
  const overRestDays = shieldNeed - currentShield;
  const reduceHabitNumber =
    5 + Math.round(Math.pow(overRestDays, 1 + overRestDays / 19) * 10) / 10;

  return {
    gap,
    reduceShieldNumber: currentShield, // Trừ sạch khiên hiện có
    reduceHabitNumber,
    overRestDays,
    isStreakSavedByShield: false,
  };
};

export const calculatePenaltyEffect = (
  referenceDate: string,
  profile: UserProfile,
  habitLog: HabitLog | null,
) => {
  const todayStr = getLocalTodayStr();
  const gap = getDaysDiff(referenceDate, todayStr);
  const shieldNeed = Math.max(gap - 1, 0);

  const oldHabitScore = habitLog?.habit_snap || 0;
  const oldRetain = habitLog?.habit_retain || 0;
  const oldShieldScore = habitLog?.shield_snap || 0;

  // Không có penalty
  if (gap <= 1) {
    return {
      gap,

      // Habit
      habitDelta: 0,
      newHabitScore: oldHabitScore,

      // Retain
      retainDelta: 0,
      newRetain: oldRetain,

      // Shield
      shieldDelta: 0,
      newShieldScore: oldShieldScore,

      // Không có shield reward
      totalShieldGain: 0,
      sessionShieldGain: 0,
      milestoneShieldGain: 0,
      bonusShieldGain: 0,

      // Milestone state giữ nguyên
      lowClaimable: profile.low_shield_clamable,
      midClaimable: profile.mid_shield_clamable,
      fullClaimable: profile.full_shield_clamable,

      overRestDays: 0,
      isStreakSavedByShield: false,
    };
  }

  // ─────────────────────────────
  // Shield dùng để bảo vệ streak
  // ─────────────────────────────

  const reduceShieldNumber = Math.min(
    oldShieldScore,
    shieldNeed,
  );

  const overRestDays =
    shieldNeed - reduceShieldNumber;

  let habitDelta = 0;

  if (overRestDays > 0) {
    habitDelta =
      -(
        5 +
        Math.round(
          Math.pow(
            overRestDays,
            1 + overRestDays / 19,
          ) * 10,
        ) / 10
      );
  }

  // ─────────────────────────────
  // Habit
  // ─────────────────────────────

  const newHabitScore = numberLimit(
    fixed(oldHabitScore + habitDelta),
    0,
    100,
  );

  // ─────────────────────────────
  // Retain
  // ─────────────────────────────

  let newRetain = oldRetain;
  let retainDelta = 0;

  /*
   * Khi Habit bị giảm:
   * retain cũng bị clear/reduce.
   *
   * Nếu business rule của bạn là clear toàn bộ:
   */
  if (habitDelta < 0) {
    retainDelta = -oldRetain;
    newRetain = 0;
  }

  // ─────────────────────────────
  // Milestone claimable
  // ─────────────────────────────

  let lowClaimable = profile.low_shield_clamable;
  let midClaimable = profile.mid_shield_clamable;
  let fullClaimable = profile.full_shield_clamable;

  /*
   * Habit tụt dưới milestone → cho phép nhận lại.
   */

  if (newHabitScore === 0) {
    lowClaimable = 1;
  }

  if (newHabitScore < shield_rewards[0]) {
    midClaimable = 1;
  }

  if (newHabitScore < shield_rewards[1]) {
    fullClaimable = 1;
  }


  // ─────────────────────────────
  // Shield
  // ─────────────────────────────

  const shieldDelta = - reduceShieldNumber;

  const newShieldScore = numberLimit(
    oldShieldScore + shieldDelta,
    0,
    SHIELD_LIMIT,
  );

  return {
    gap,

    // Habit
    habitDelta,
    newHabitScore,

    // Retain
    retainDelta,
    newRetain,

    // Shield
    shieldDelta,
    newShieldScore,

    // Không phải reward
    totalShieldGain: 0,
    sessionShieldGain: 0,
    milestoneShieldGain: 0,
    bonusShieldGain: 0,

    // Milestone state
    lowClaimable,
    midClaimable,
    fullClaimable,

    // Penalty metadata
    overRestDays,
    isStreakSavedByShield:
      overRestDays === 0,
  };
};
