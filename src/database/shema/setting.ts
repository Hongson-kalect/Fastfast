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

export const getUserSettings = async (
  db: SQLiteDatabase,
): Promise<AppSettings | null> => {
  try{

    const rows = await db.getAllAsync<{ key: keyof AppSettings; value: string }>(
      `SELECT * FROM app_settings;`,
    );
  const settingsObj: AppSettings = {};
  
  rows.forEach((row) => {
    try {
      settingsObj[row.key] = JSON.parse(row.value);
    } catch {
      settingsObj[row.key] = row.value as any;
    }
  });
  return settingsObj;
}catch(e){
  console.log('error on getUserSettings', e);
  return null;}
};

export const toggleTheme = async (
  db: SQLiteDatabase,
  val: boolean,
): Promise<void> => {
  try {
    const stringValue = String(val); // Chuyển boolean thành 'true' hoặc 'false' để lưu vào SQLite TEXT
    const key = "is_dark_mode";
    // Sử dụng db.runAsync để thực thi lệnh INSERT/UPDATE/DELETE
    await db.runAsync(
      `UPDATE app_settings SET value = ?, updated_at = (strftime('%s', 'now')) WHERE key = ?`,
      [stringValue, key], // Mảng các biến tương ứng với từng dấu ? theo thứ tự
    );

    console.log(
      `=> [DB] Cập nhật is_dark_mode thành ${stringValue} thành công.`,
    );
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
