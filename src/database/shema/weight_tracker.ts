import { WeightLog } from "@/interfaces/db.type";
import { getLocalTodayStr } from "@/util/timer";
import { uuidv7 } from "@/util/uuidv7";
import { SQLiteDatabase } from "expo-sqlite";

export const generateString = /*sql*/ `
CREATE TABLE IF NOT EXISTS weight_logs (
    id TEXT PRIMARY KEY,               -- UUID v7 sinh từ Client cho từng lần leo lên cân
    weight REAL NOT NULL,              -- Số cân nặng lưu dạng số thực (ví dụ: 65.5)
    log_date TEXT NOT NULL,            -- Định dạng 'YYYY-MM-DD' để phục vụ việc nhóm (GROUP BY) khi vẽ chart
    sync_status TEXT DEFAULT 'pending', -- 'synced', 'pending'
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);
-- Tạo index trên log_date của bảng cân nặng để lúc GROUP BY lấy cân nặng cuối cùng chạy siêu nhanh
CREATE INDEX IF NOT EXISTS idx_weight_tracker_date ON weight_logs(log_date);
`;

export const getWeightLogs = async (
  db: SQLiteDatabase,
  days: number = 30,
): Promise<WeightLog[]> => {
  const today = getLocalTodayStr();
  const startDay = new Date(today);
  startDay.setDate(startDay.getDate() - days);
  const startDate = getLocalTodayStr(startDay);
  const rows = await db.getAllAsync<WeightLog>(
    `SELECT * FROM weight_logs WHERE log_date >= ?;`,
    [startDate],
  );
  // const rows = await db.getAllAsync<DailyLog>(`SELECT * FROM daily_logs;`);
  return rows;
};

export const getCurrentWeight = async (
  db: SQLiteDatabase,
): Promise<WeightLog | null> => {
  const row = await db.getFirstAsync<WeightLog>(
    `SELECT * FROM weight_logs Order by created_at DESC LIMIT 1`,
  );
  return row;
};
export const updateWeight = async (db: SQLiteDatabase, weight: number) => {
  const today = getLocalTodayStr();
  const id = uuidv7();

  await db.runAsync(
    `INSERT INTO weight_logs (id, weight, log_date) VALUES (?,?,?)`,
    [id, weight, today],
  );
  const row = await db.getFirstAsync<WeightLog>(
    `SELECT * FROM weight_logs WHERE id = ?`,
    [id],
  );
  return row;
};
