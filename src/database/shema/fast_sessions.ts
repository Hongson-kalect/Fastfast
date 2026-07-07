import { FastSession } from "@/interfaces/db.type";
import { SQLiteDatabase } from "expo-sqlite";

// Bảng 3: Phiên nhịn ăn gốc (Fast Sessions)
export const generateString = /*sql*/ `
CREATE TABLE IF NOT EXISTS fast_sessions (
    id TEXT PRIMARY KEY, -- UUID v7 sinh từ Client
    user_id TEXT NOT NULL,
    start_time INTEGER NOT NULL, -- Epoch timestamp (giây)
    end_time INTEGER,            -- Epoch timestamp (giây), NULL nếu đang nhịn
    target_duration INTEGER,     -- Mục tiêu: 16, 18, 20, 48...
    home_data_snapshot TEXT,     -- JSON string lưu trạng thái các chỉ số sinh học lúc kết thúc
    rating TEXT,                 -- Đánh giá nhanh (ví dụ: 'Excellent', 'Good', 'Failed')
    is_deleted INTEGER DEFAULT 0, -- Xóa mềm cho Local-first: 0 = False, 1 = True
    sync_status TEXT DEFAULT 'pending', -- 'synced', 'pending'
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (user_id) REFERENCES user_profile(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_fast_sessions_user ON fast_sessions(user_id);
`;

export const getFastSessions = async (
  db: SQLiteDatabase,
): Promise<FastSession[] | null> => {
  const rows = await db.getAllAsync<FastSession>(
    `SELECT * FROM fast_sessions;`,
  );
  return rows;
};
