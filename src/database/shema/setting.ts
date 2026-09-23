import { AppSettings } from "@/interfaces/db.type";
import { SQLiteDatabase } from "expo-sqlite";

// Bảng 1: Cấu hình ứng dụng (Settings) - Lưu trữ Key-Value linh hoạt
export const generateString = /*sql*/ `
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);
`;

// -- Các custom
// theme_id TEXT DEFAULT 'default',
// effect_id TEXT DEFAULT 'default',
// emotion_pack TEXT DEFAULT 'default',
// fasting_pack TEXT DEFAULT 'default',
// sound_pack TEXT DEFAULT 'default',
// notification_id TEXT DEFAULT 'default',
// notification_time INTEGER DEFAULT 0,

export const getUserSettings = async (
  db: SQLiteDatabase,
): Promise<AppSettings | null> => {
  try {
    const rows = await db.getAllAsync<{
      key: keyof AppSettings;
      value: string;
    }>(`SELECT * FROM app_settings;`);
    const settingsObj: AppSettings = {};

    rows.forEach((row) => {
      try {
        settingsObj[row.key] = JSON.parse(row.value);
      } catch {
        settingsObj[row.key] = row.value as any;
      }
    });
    return settingsObj;
  } catch (e) {
    console.log("error on getUserSettings", e);
    return null;
  }
};

export const changeTheme = async (db: SQLiteDatabase, theme: string) => {
  await db.runAsync(
    `INSERT INTO app_settings (key, value, updated_at)
       VALUES (?, ?, strftime('%s', 'now'))
       ON CONFLICT(key) DO UPDATE SET
         value = excluded.value,
         updated_at = strftime('%s', 'now')`,
    ["theme", theme],
  );
  return await getUserSettings(db);
};

export const toggleTheme = async (
  db: SQLiteDatabase,
  val: boolean,
): Promise<AppSettings | null> => {
  try {
    const stringValue = String(val); // Chuyển boolean thành 'true' hoặc 'false' để lưu vào SQLite TEXT
    const key = "is_dark_mode";
    // Sử dụng db.runAsync để thực thi lệnh INSERT/UPDATE/DELETE
    await db.runAsync(
      `INSERT INTO app_settings (key, value, updated_at)
   VALUES (?, ?, strftime('%s', 'now'))
   ON CONFLICT(key) DO UPDATE SET
     value = excluded.value,
     updated_at = strftime('%s', 'now')`,
      [key, stringValue],
    );

    return await getUserSettings(db);

  } catch (error) {
    console.error("Lỗi khi update theme mode trong DB:", error);
    throw error;
  }
};

export const setAppSetting = async (
  db: SQLiteDatabase,
  key: string,
  value: any,
) => {
  const jsonValue = JSON.stringify(value);
  await db.runAsync(
    `INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)`,
    [key, jsonValue],
  );
};
