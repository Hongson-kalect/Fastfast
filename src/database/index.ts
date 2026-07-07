import * as SQLite from "expo-sqlite";
import { SQLiteDatabase } from "expo-sqlite";
import {
  generateString as daily_logsGenerateString,
  getDailyLogs,
} from "./shema/daily_logs";
import {
  generateString as fast_sessionsGenerateString,
  getFastSessions,
} from "./shema/fast_sessions";
import {
  getUserSettings,
  generateString as settingGenerateString,
  toggleTheme,
} from "./shema/setting";
import { getActiveTheme, getLocalTheme } from "./shema/theme";
import {
  getUserProfile,
  generateString as userGenerateString,
} from "./shema/user";

export const DATABASE_NAME = "fast_fast";

export const createDBService = (db: SQLiteDatabase) => ({
  getUserSettings: () => getUserSettings(db),
  getUserProfile: () => getUserProfile(db),
  getFastSessions: () => getFastSessions(db),
  getDailyLogs: () => getDailyLogs(db),
  getActiveTheme: () => getActiveTheme(db),
  getLocalTheme: () => getLocalTheme(),
  toggleTheme: (value: boolean) => toggleTheme(db, value),
});

export const generateSchema = `
    ${userGenerateString}
    ${settingGenerateString}
    ${fast_sessionsGenerateString}
    ${daily_logsGenerateString}
`;

console.log("generateSchema", generateSchema);

const generateSeedData = `
`;

export const initDatabase = async (db: SQLiteDatabase) => {
  const DATABASE_VERSION = 1; // get from server
  // clearDatabase(db);
  let version = 0;
  await clearDatabase(db);
  try {
    const db_version = await db.getFirstAsync<{ key: string; value: string }>(
      `select * from system_config where key='db_version'`,
    );
    if (db_version) {
      version = Number(db_version.value);
    }
  } catch {
    console.log("no system_config");
  }

  // if(version==DATABASE_VERSION){
  if (version >= 1) {
    return;
  }

  let { user_version: currentDbVersion } = { user_version: 0 };
  if (version >= DATABASE_VERSION) {
    return;
  }

  if (version === 0) {
    await db.execAsync(generateSchema);
    // await db.execAsync(generateSeedData);
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
};

export const clearDatabase = async (db: SQLite.SQLiteDatabase) => {
  // 1. Tắt khóa ngoại tạm thời để xóa cho dễ
  await db.execAsync("PRAGMA foreign_keys = OFF;");

  // 2. Lấy danh sách tất cả các bảng hiện có (trừ các bảng hệ thống của SQLite)
  const tables = await db.getAllAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';",
  );

  // 3. Xóa từng bảng
  for (const table of tables) {
    await db.execAsync(`DROP TABLE IF EXISTS ${table.name};`);
  }

  // 4. Reset version về 0 để hàm migrateDbIfNeeded chạy lại từ đầu
  await db.execAsync(`PRAGMA user_version = 0;`);

  console.log("Database cleared successfully!");
};
