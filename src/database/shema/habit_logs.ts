import { FastSession, HabitLog } from "@/interfaces/db.type";
import { getLocalTodayStr } from "@/util/timer";
import { uuidv7 } from "@/util/uuidv7";
import { SQLiteDatabase } from "expo-sqlite";
import { numberLimit } from "./../../util/numberLimit";

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
  shield_detla?: number;

  habit_snap?: number;
  shield_snap?: number;
};
export const addHabitLogs = async (db: SQLiteDatabase, data: AddHabitType) => {
  const id = uuidv7();
  const log_date = data.log_date || getLocalTodayStr();

  const habit_data = { ...data };
  let retain = 0;
  let bonusShield = 0;
  let habitDetla = data.habit_detla || 0;
  let retainDelta = 0;

  const lastLog = await getLastHabitLog(db);
  if (!data.habit_snap || !data.shield_snap) {
    habit_data.habit_snap =lastLog?.habit_snap || 0;
    habit_data.shield_snap =lastLog?.shield_snap || 0
  }

  if (lastLog?.habit_snap === 100) {
    // habit giảm
    if (habit_data.habit_detla) {
      if (habit_data.habit_detla < 0) retain = 0;
      else {
        retain = (lastLog?.habit_retain || 0) + (habit_data.habit_detla || 0);

        habitDetla = 0;
        retainDelta = habit_data.habit_detla;
      }

      if (retain >= RETAIN_LIMIT) {
        retain = 1; // Khi đủ 1 vòng thì retain sẽ về 1 thay vì về 0
        bonusShield = 1;
      }
    }
  }

  habit_data.habit_snap=(habit_data?.habit_snap ||0) + (habit_data?.habit_detla || 0);
  habit_data.shield_snap=(habit_data?.shield_snap ||0) + (habit_data?.shield_detla || 0)+bonusShield;
  habit_data.shield_detla = habitDetla + bonusShield;


  let shield_detail = null;

  if (habit_data.shield_detla || bonusShield) {
    shield_detail = JSON.stringify([
      habit_data.shield_detla || 0,
      bonusShield || 0,
    ]);
  }

  const wastedShield = habit_data.shield_snap
    ? habit_data.shield_snap - SHIELD_LIMIT
    : 0;

  // Khi người dùng đang fast, hoàn toàn có thể thêm ghi chú cho ngày
  // const currentLog = await db.getFirstAsync<HabitLog>(`SELECT * FROM habit_logs WHERE log_date = ? AND fast_id = ?`, [data.log_date, data.fast_id]);

  // if(currentLog){
  //   await db.runAsync(`UPDATE habit_logs SET hours_in_day = ?,  hours_in_fast = ? WHERE log_date = ? AND fast_id = ?`, [data.hours_in_day, data.hour_in_fast, data.log_date, data.fast_id]);
  // }else{
  //   await db.runAsync(`INSERT INTO habit_logs (log_date, fast_id, hours_in_day, hours_in_fast) VALUES (?, ?, ?, ?)`, [data.log_date, data.fast_id, data.hours_in_day, data.hour_in_fast]);
  // }
  console.log("retain 5", retain, numberLimit(retain, 0, RETAIN_LIMIT));

  try {
    await db.runAsync(
      `INSERT INTO habit_logs (id, log_date, fast_id, habit_delta, habit_snap, retain_delta, shield_delta, shield_snap, habit_retain, shield_detail) VALUES (?, ?, ?, ?, ?,?,?,?,?,?)`,
      [
        id,
        log_date,
        data.fast_id || null,
        numberLimit(habitDetla || 0, 0, 100),
        numberLimit(habit_data.habit_snap || 0, 0, 100),
        retainDelta,
        habit_data.shield_detla || 0,
        numberLimit(habit_data.shield_snap || 0, 0, SHIELD_LIMIT),
        numberLimit(retain, 0, RETAIN_LIMIT),
        shield_detail,
      ],
    );

    const res = await getLastHabitLog(db);
    console.log("res", res);
    return { newHabitLog: res, wastedShield: wastedShield };
  } catch (e) {
    console.log("e", e);
    return { newHabitLog: null, wastedShield: wastedShield };
  }
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
    VALUES (?, ?, ?, ?, ?,?,?)`,
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
      VALUES (?, ?, ?, ?, ?,?,?,?)`,
      [
        id,
        today,
        null,
        -reduce,
        Math.max(lastHabitLog.habit_snap - reduce, 0),
        0,
        lastHabitLog.shield_snap,
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
