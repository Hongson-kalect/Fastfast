import { logDbError } from "@/utils/dbError";
import { DailyNote, MoodLevel } from "@/interfaces/db.type";
import { getLocalTodayStr } from "@/utils/timer";
import { SQLiteDatabase } from "expo-sqlite";

export const generateString = /*sql*/ `
CREATE TABLE IF NOT EXISTS daily_notes (
    log_date TEXT PRIMARY KEY,         -- 🌟 Định dạng 'YYYY-MM-DD', làm Khóa chính để đảm bảo mỗi ngày duy nhất 1 bản ghi
    mood_level INTEGER CHECK (mood_level BETWEEN 1 AND 5), -- Mức độ cảm xúc từ 1 đến 5
    note TEXT,
    image_uri TEXT,                 -- Đường dẫn ảnh lưu cục bộ trong ngày (nếu có)
    sync_status TEXT DEFAULT 'pending', -- 'synced', 'pending' cho Local-first
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_daily_notes_date ON daily_notes(log_date);
`;

export const getDailyNote = async (
  db: SQLiteDatabase,
  day: string = getLocalTodayStr(),
): Promise<DailyNote | null> => {
  try {
    const row = await db.getFirstAsync<DailyNote>(
      `SELECT * FROM daily_notes WHERE log_date = ?;`,
      [day],
    );
    return row;
  } catch (e) {
    logDbError("error on getDailyNote", e);
    return null;
  }
};

// Hàm lưu hoặc cập nhật Note của ngày hôm nay
export const setDailyNote = async (
  db: SQLiteDatabase,
  mood?: MoodLevel | null,
  note?: string | null,
  image?: string | null,
  dateStr: string = getLocalTodayStr(),
) => {
  try {
    const query = `
      INSERT INTO daily_notes (
        log_date,
        mood_level,
        note,
        image_uri,
        updated_at
      )
      VALUES (?, ?, ?, ?, strftime('%s', 'now'))
      ON CONFLICT(log_date) DO UPDATE SET
        mood_level = CASE
          WHEN ? THEN excluded.mood_level
          ELSE daily_notes.mood_level
        END,
        note = CASE
          WHEN ? THEN excluded.note
          ELSE daily_notes.note
        END,
        image_uri = CASE
          WHEN ? THEN excluded.image_uri
          ELSE daily_notes.image_uri
        END,
        updated_at = excluded.updated_at;
    `;

    const hasMood = mood !== undefined;
    const hasNote = note !== undefined;
    const hasImage = image !== undefined;

    await db.runAsync(query, [
      dateStr,
      mood ?? null,
      note ?? null,
      image ?? null,
      hasMood ? 1 : 0,
      hasNote ? 1 : 0,
      hasImage ? 1 : 0,
    ]);
  } catch (e) {
    logDbError("error on setDailyNote", e);
  }
};

export const getPixelNoteData = async (
  db: SQLiteDatabase,
  year: number,
): Promise<DailyNote[]> => {
  try {
    // Tạo 2 mốc đầu năm và cuối năm theo chuẩn YYYY-MM-DD
    const startOfYear = `${year}-01-01`;
    const endOfYear = `${year}-12-31`;

    const rows = await db.getAllAsync<DailyNote>(
      `SELECT * FROM daily_notes 
       WHERE log_date BETWEEN ? AND ? 
       ORDER BY log_date ASC;`,
      [startOfYear, endOfYear],
    );

    return rows;
  } catch (e) {
    logDbError("error on getPixelNoteData", e);
    return [];
  }
};
