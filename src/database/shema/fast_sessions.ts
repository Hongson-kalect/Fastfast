import { FastSession } from "@/interfaces/db.type";
import { uuidv7 } from "@/util/uuidv7";
import { SQLiteDatabase } from "expo-sqlite";

// Bảng 3: Phiên nhịn ăn gốc (Fast Sessions)
export const generateString = /*sql*/ `
CREATE TABLE IF NOT EXISTS fast_sessions (
    id TEXT PRIMARY KEY,               -- UUID v7 sinh từ Client
    start_time INTEGER NOT NULL,       -- Epoch timestamp (giây)
    end_time INTEGER,                  -- Epoch timestamp (giây), NULL nếu đang chạy
    target_duration INTEGER,           -- Mục tiêu nhịn (đơn vị: GIỜ, ví dụ: 16, 18, 20)
    duration INTEGER,           -- 🌟 THÊM: Thời gian nhịn thực tế (đơn vị: GIÂY), NULL nếu đang chạy
    home_data_snapshot TEXT,           -- JSON string lưu chỉ số sinh học
    is_deleted INTEGER DEFAULT 0,       -- Xóa mềm cho Local-first: 0 = False, 1 = True
    sync_status TEXT DEFAULT 'pending', -- 'synced', 'pending'
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);
`;

export const getFastSessions = async (
  db: SQLiteDatabase,
): Promise<FastSession[] | null> => {
  const rows = await db.getAllAsync<FastSession>(
    `SELECT * FROM fast_sessions;`,
  );
  return rows;
};

export type FastCountType = {
  above_16: number;
  above_20: number;
  above_24: number;
  above_36: number;
  above_48: number;
  above_72: number;
};

export const getFastCount = async (
  db: SQLiteDatabase,
): Promise<FastCountType> => {
  const res = await db.getFirstAsync<FastCountType>(
    `SELECT 
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
      AND duration IS NOT NULL
) AS completed_sessions;`,
  );

  return (
    res || {
      above_16: 0,
      above_20: 0,
      above_24: 0,
      above_36: 0,
      above_48: 0,
      above_72: 0,
    }
  );
};

export const getLastFastSession = async (
  db: SQLiteDatabase,
): Promise<FastSession | null> => {
  const row = await db.getFirstAsync<FastSession>(
    `SELECT * FROM fast_sessions ORDER BY updated_at DESC LIMIT 1;`,
  );
  return row;
};

export const getYearFastSession = async (
  db: SQLiteDatabase,
  year: number,
): Promise<FastSession | null> => {
  const row = await db.getFirstAsync<FastSession>(
    `SELECT * FROM fast_sessions WHERE strftime('%Y', start_time) = ${year} ORDER BY updated_at DESC LIMIT 1;`,
  );
  return row;
};

export const finishLastSession = async (
  db: SQLiteDatabase,
  id: string,
  time: number,
  duration: number,
) => {
  await db.runAsync(
    `UPDATE fast_sessions SET end_time = ?, duration = ? WHERE id = ?;`,
    [time, duration, id],
  );
};

export const startNewSession = async (
  db: SQLiteDatabase,
  time: number,
  targetDuration: number | null = null,
) => {
  const id = uuidv7();
  db.runAsync(
    `INSERT INTO fast_sessions (id, start_time, target_duration) VALUES (?, ?, ?);`,
    [id, time, targetDuration],
  );

  const res = await getLastFastSession(db);
  return res;
};

export const deleteSession = async (db: SQLiteDatabase, id: string) => {
  await db.runAsync(`Update fast_sessions SET is_deleted = 1 WHERE id = ?;`, [
    id,
  ]);
};
