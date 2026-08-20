import { DailyLog } from "@/interfaces/db.type";
import { getLocalTodayStr } from "@/util/timer";
import { SQLiteDatabase } from "expo-sqlite";

// Bảng 4: Phân rã dữ liệu theo ngày dương lịch (Daily Logs) để vẽ Chart và Grid
export const generateString = /*sql*/ `
CREATE TABLE IF NOT EXISTS daily_logs (
    log_date TEXT NOT NULL,         -- Định dạng 'YYYY-MM-DD'
    fast_id TEXT NOT NULL,          -- Liên kết đến phiên gốc chịu trách nhiệm số giờ lớn nhất
    hours_in_day REAL DEFAULT 0.0,  -- Số giờ nhịn thực tế đóng góp trong ngày dương lịch này (Tối đa 24h)
    elapsed_hours REAL DEFAULT 0.0,    -- Ghi luôn 1 trường để tránh phải query bảng bên kia liên tục chỉ để lấy 1 trường
    hours_in_fast REAL DEFAULT 0.0,    -- Ghi luôn 1 trường để tránh phải query bảng bên kia liên tục chỉ để lấy 1 trường
    is_deleted INTEGER DEFAULT 0,   -- Xóa mềm phục vụ đồng bộ
    sync_status TEXT DEFAULT 'pending',
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now')),
    PRIMARY KEY (log_date, fast_id), -- Khóa chính phức hợp để xử lý các phiên nhịn ăn dài ngày (48h/72h)
    FOREIGN KEY (fast_id) REFERENCES fast_sessions(id) ON DELETE CASCADE
    --user_id TEXT NOT NULL,
    -- FOREIGN KEY (user_id) REFERENCES user_profile(id) ON DELETE CASCADE,
  );

--CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON daily_logs(user_id, log_date);
`;

export const getDailyLogs = async (
  db: SQLiteDatabase,
  days: number = 30,
): Promise<DailyLog[]> => {
  const today = getLocalTodayStr();
  const startDay = new Date(today);
  startDay.setDate(startDay.getDate() - days);
  const startDate = getLocalTodayStr(startDay);
  const rows = await db.getAllAsync<DailyLog>(
    `SELECT * FROM daily_logs WHERE log_date >= ?;`,
    [startDate],
  );
  // const rows = await db.getAllAsync<DailyLog>(`SELECT * FROM daily_logs;`);
  return rows;
};

export const getTodayLog = async (
  db: SQLiteDatabase,
): Promise<DailyLog | null> => {
  const today = getLocalTodayStr();
  const rows = await db.getFirstAsync<DailyLog>(
    `SELECT * FROM daily_logs WHERE log_date = ?`,
    [today],
  );
  return rows;
};

export const addDailyLogs = async (
  db: SQLiteDatabase,
  data: {
    log_date: string;
    fast_id: string;
    hours_in_day: number;
    elapsed_times: number;
    hour_in_fast: number;
  },
) => {
  await db.runAsync(
    `INSERT INTO daily_logs (log_date, fast_id, hours_in_day, elapsed_hours, hours_in_fast) VALUES (?, ?, ?, ?, ?)`,
    [
      data.log_date,
      data.fast_id,
      data.hours_in_day,
      data.elapsed_times,
      data.hour_in_fast,
    ],
  );
};
