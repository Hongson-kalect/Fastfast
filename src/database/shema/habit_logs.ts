import { HabitLog } from "@/interfaces/db.type";
import { getLocalTodayStr } from "@/util/timer";
import { uuidv7 } from "@/util/uuidv7";
import { SQLiteDatabase } from "expo-sqlite";

// Bảng 4: Phân rã dữ liệu theo ngày dương lịch (Habit Logs) để vẽ Chart và Grid
export const generateString = /*sql*/ `
CREATE TABLE IF NOT EXISTS habit_logs (
    id TEXT NOT NULL PRIMARY KEY,
    log_date TEXT NOT NULL,         -- Định dạng 'YYYY-MM-DD'
    fast_id TEXT,          -- Liên kết đến phiên gốc chịu trách nhiệm số giờ lớn nhất

    type TEXT NOT NULL,             -- 'habit+', 'habit-', 'shield+', 'shield-'

    habit_delta REAL,
    habit_snap REAL,
    habit_retain REAL,

    shield_delta REAL,
    shield_snap REAL,

    is_deleted INTEGER DEFAULT 0,   -- Xóa mềm phục vụ đồng bộ
    sync_status TEXT DEFAULT 'pending',
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (fast_id) REFERENCES fast_sessions(id) ON DELETE CASCADE
    --user_id TEXT NOT NULL,
    -- FOREIGN KEY (user_id) REFERENCES user_profile(id) ON DELETE CASCADE,
  );

--CREATE INDEX IF NOT EXISTS idx_habit_logs_user_date ON habit_logs(user_id, log_date);
`;

export const getHabitLogs = async (
  db: SQLiteDatabase,
  days: number = 30,
): Promise<HabitLog[]> => {
  const today = getLocalTodayStr();
  const startDay = new Date(today);
  startDay.setDate(startDay.getDate() - days);
  const startDate = getLocalTodayStr(startDay);
  const rows = await db.getAllAsync<HabitLog>(
    `SELECT * FROM habit_logs WHERE log_date >= ?;`,
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
  type: "habit+" | "habit-" | "shield+" | "shield-";
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

  const lastLog = await getLastHabitLog(db);
  if (!data.habit_snap || !data.shield_snap) {
    habit_data.habit_snap =
      (lastLog?.habit_snap || 0) + (habit_data.habit_detla || 0);
    habit_data.shield_snap =
      (lastLog?.shield_snap || 0) + (habit_data.shield_detla || 0);
  }
  if (lastLog?.habit_snap === 100) {
    // habit giảm
    if (habit_data.habit_detla) {
      if (habit_data.habit_detla < 0) retain = 0;
      else
        retain = (lastLog?.habit_retain || 0) + (habit_data.habit_detla || 0);
    }
  }
  // Khi người dùng đang fast, hoàn toàn có thể thêm ghi chú cho ngày
  // const currentLog = await db.getFirstAsync<HabitLog>(`SELECT * FROM habit_logs WHERE log_date = ? AND fast_id = ?`, [data.log_date, data.fast_id]);

  // if(currentLog){
  //   await db.runAsync(`UPDATE habit_logs SET hours_in_day = ?,  hours_in_fast = ? WHERE log_date = ? AND fast_id = ?`, [data.hours_in_day, data.hour_in_fast, data.log_date, data.fast_id]);
  // }else{
  //   await db.runAsync(`INSERT INTO habit_logs (log_date, fast_id, hours_in_day, hours_in_fast) VALUES (?, ?, ?, ?)`, [data.log_date, data.fast_id, data.hours_in_day, data.hour_in_fast]);
  // }
  await db.runAsync(
    `INSERT INTO habit_logs (id, log_date, fast_id, habit_delta, habit_snap, shield_delta, shield_snap, retain) VALUES (?, ?, ?, ?, ?,?,?)`,
    [
      id,
      log_date,
      data.fast_id || null,
      habit_data.habit_detla || 0,
      habit_data.habit_snap || 0,
      habit_data.shield_detla || 0,
      habit_data.shield_snap || 0,
      retain,
    ],
  );
};

export const reduceShield =async (db: SQLiteDatabase, lastHabitLog:HabitLog, reduce:number)=>{
  const today = getLocalTodayStr()
  const id =uuidv7()

  await db.runAsync(`INSERT INTO habit_logs 
    (id, log_date, fast_id, habit_delta, habit_snap, shield_delta, shield_snap, retain) 
    VALUES (?, ?, ?, ?, ?,?,?)`,
    [id, today, null, 0, lastHabitLog.habit_snap, -reduce, lastHabitLog.shield_snap - reduce, lastHabitLog.habit_retain]);

  const lastHabit = await getLastHabitLog(db);
  return lastHabit
}

export const reduceHabit = async (db: SQLiteDatabase, lastHabitLog:HabitLog, reduce:number)=>{
  const today = getLocalTodayStr()
  const id =uuidv7()

  await db.runAsync(`INSERT INTO habit_logs 
    (id, log_date, fast_id, habit_delta, habit_snap, shield_delta, shield_snap, retain) 
    VALUES (?, ?, ?, ?, ?,?,?)`,
    [id, today, null, -reduce, lastHabitLog.habit_snap - reduce, 0, lastHabitLog.shield_snap, 0]);

  const lastHabit = await getLastHabitLog(db);
  return lastHabit
}
