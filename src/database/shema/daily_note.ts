import { DailyNote, MoodLevel } from "@/interfaces/db.type";
import { getLocalTodayStr } from "@/util/timer";
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

export const getDailyNotes = async (
  db: SQLiteDatabase,
): Promise<DailyNote[] | null> => {
  try{

    const rows = await db.getAllAsync<DailyNote>(`SELECT * FROM daily_notes;`);
    return rows;
  }catch(e){
    console.log('error on getDailyNotes', e);
    return null;
  }
};

export const getDailyNote = async (
  db: SQLiteDatabase,
  day: string = getLocalTodayStr(),
): Promise<DailyNote | null> => {
  try{

    const row = await db.getFirstAsync<DailyNote>(
      `SELECT * FROM daily_notes WHERE log_date = ?;`,
      [day],
    );
    return row;
  }catch(e){
    console.log('error on getDailyNote', e);
    return null;
  }
};

// Hàm lưu hoặc cập nhật Note của ngày hôm nay
export const setDailyNote = async (
  db: SQLiteDatabase,
  mood?: MoodLevel,
  note?: string,
  image?: string,
  dateStr: string = getLocalTodayStr(),
) => {
  const query = `
    INSERT OR REPLACE INTO daily_notes (log_date, mood_level, note, image_uri, updated_at)
    VALUES (?, ?, ?, ?, strftime('%s', 'now'));
  `;
try{

  await db.runAsync(query, [dateStr, mood||null, note || null, image || null]);
}catch(e){
  console.log('error on setDailyNote', e);
}
};

export const  getPixelNoteData = async (db: SQLiteDatabase, year: number): Promise<DailyNote[] | []> =>{
  try{
    const rows = await db.getAllAsync<DailyNote>(`SELECT * FROM daily_notes WHERE strftime('%Y', log_date) = ?;`, [year]);
    return rows;
  }catch(e){
    console.log('error on getPixelYearData', e);
    return [];
  }
}
