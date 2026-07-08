import { DailyLog } from "@/interfaces/db.type";
import { SQLiteDatabase } from "expo-sqlite";

// Bảng 4: Phân rã dữ liệu theo ngày dương lịch (Daily Logs) để vẽ Chart và Grid
export const generateString = /*sql*/ `
CREATE TABLE IF NOT EXISTS daily_logs (
    log_date TEXT NOT NULL,         -- Định dạng 'YYYY-MM-DD'
    fast_id TEXT NOT NULL,          -- Liên kết đến phiên gốc chịu trách nhiệm số giờ lớn nhất
    hours_in_day REAL DEFAULT 0.0,  -- Số giờ nhịn thực tế đóng góp trong ngày dương lịch này (Tối đa 24h)
    mood_level INTEGER CHECK (mood_level BETWEEN 1 AND 5), -- Mức độ cảm xúc từ 1 đến 5
    note TEXT,
    image_uri TEXT,                 -- Đường dẫn ảnh lưu cục bộ trong ngày (nếu có)
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
): Promise<DailyLog[] | null> => {
  const rows = await db.getAllAsync<DailyLog>(`SELECT * FROM daily_logs;`);
  return rows;
};
