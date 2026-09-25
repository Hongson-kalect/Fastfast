import {
  FastSession,
  HabitLog,
  MoodLevel,
  UserAsset,
  UserProfile,
} from "@/interfaces/db.type";
import * as SQLite from "expo-sqlite";
import { SQLiteDatabase } from "expo-sqlite";
import {
  addDailyLogs,
  generateString as daily_logsGenerateString,
  getDailyLogs,
  getPixelLogData,
  getTodayLog,
} from "./shema/daily_logs";
import {
  generateString as daily_noteGenerateString,
  getDailyNote,
  getDailyNotes,
  getPixelNoteData,
  setDailyNote,
} from "./shema/daily_note";
import {
  deleteSession,
  generateString as fast_sessionsGenerateString,
  finishLastSession,
  getFastSessionByIds,
  getFastSessions,
  getFastStatsSummary,
  getLastFastSession,
  getYearFastSession,
  reconcileStreak,
  startNewSession,
  updateSessionTarget,
} from "./shema/fast_sessions";
import {
  changeTheme,
  getUserSettings,
  setAppSetting,
  generateString as settingGenerateString,
  toggleTheme,
} from "./shema/setting";
import {
  checkAndUpdateActiveTarget,
  createWeightTarget,
  getActiveWeightTarget,
  getAllWeightTargets,
  generateString as target_GenerateString,
} from "./shema/target";
import {
  getActiveTheme,
  getThemes,
  generateString as themeGenerateString,
} from "./shema/theme";
import {
  getUserProfile,
  togglePremium,
  generateString as userGenerateString,
  userSeedData,
} from "./shema/user";
import {
  getCurrentWeight,
  getWeightLogs,
  updateWeight,
  generateString as weight_trackerGenerateString,
} from "./shema/weight_tracker";

import {
  getHabitLogs,
  getLastHabitLog,
  getPixelShielLog,
  getShieldUsedLog,
  generateString as habit_logsGenerateString,
} from "./shema/habit_logs";
import {
  generateString as userAchievementsGenerateString,
  itemGenerateString as userArchivementsItemGenerateString,
} from "./shema/user_achievements";
import {
  createUserAsset,
  getUserAssets,
  removeUserAsset,
  generateString as userAssetsGenerateString,
} from "./shema/user_assets";

export const DATABASE_NAME = "fast_fast";

export const createDBService = (db: SQLiteDatabase) => ({
  getUserSettings: () => getUserSettings(db),
  getUserProfile: () => getUserProfile(db),

  getFastSessions: () => getFastSessions(db),
  getFastStatsSummary: () => getFastStatsSummary(db),
  getLastFastSession: () => getLastFastSession(db),
  getYearFastSession: (year: number) => getYearFastSession(db, year),
  finishLastSession: (data: { id: string; endTime: number }) =>
    finishLastSession({ db, ...data }),

  reconcileStreak: ({
    lastFast,
    profile,
    habitLog,
  }: {
    lastFast: FastSession | null;
    profile: UserProfile | null;
    habitLog: HabitLog | null;
  }) => reconcileStreak(db, lastFast, profile, habitLog),
  deleteSession: (id: string) => deleteSession(db, id),
  startNewSession: (startTime: number, targetDuration?: number) =>
    startNewSession(db, startTime, targetDuration),
  updateSessionTarget: (id: string, targetDuration: number | null) =>
    updateSessionTarget(db, id, targetDuration),

  getDailyLogs: (days?: number) => getDailyLogs(db, days),
  getTodayLog: () => getTodayLog(db),

  getDailyNote: (date?: string) => getDailyNote(db, date),
  getDailyNotes: () => getDailyNotes(db),
  setDailyNote: (
    moodLevel?: MoodLevel,
    note?: string,
    image_uri?: string,
    date?: string,
  ) => setDailyNote(db, moodLevel, note, image_uri, date),
  addDailyLogs: (data: {
    log_date: string;
    fast_id: string;
    hours_in_day: number;
    elapsed_times: number;
    hour_in_fast: number;
  }) => addDailyLogs(db, data),

  getActiveTheme: () => getActiveTheme(db),
  getThemes: () => getThemes(db),
  changeTheme: (theme: string) => changeTheme(db, theme),
  toggleTheme: (value: boolean) => toggleTheme(db, value),

  getCurrentWeight: (date?: string) => getCurrentWeight(db, date),
  getWeightLogs: (days?: number) => getWeightLogs(db, days),
  updateWeight: (weight: number) => updateWeight(db, weight),

  setting: (key: string, value: any) => setAppSetting(db, key, value),

  getActiveWeightTarget: () => getActiveWeightTarget(db),
  checkAndUpdateActiveTarget: (newWeight: number) =>
    checkAndUpdateActiveTarget(db, newWeight),
  createWeightTarget: (newTarget: {
    startWeight: number;
    targetWeight: number;
    startDate?: string;
    targetDate?: string;
  }) => createWeightTarget(db, newTarget),
  getAllWeightTargets: () => getAllWeightTargets(db),
  getHabitLogs: () => getHabitLogs(db),
  // addHabitLogs: (data: AddHabitType) => addHabitLogs(db, data),
  getLastHabitLog: () => getLastHabitLog(db),
  getShieldUsedLog: (year: number) => getShieldUsedLog(db, year),

  getPixelNoteData: (year: number) => getPixelNoteData(db, year),
  getPixelLogData: (year: number) => getPixelLogData(db, year),
  getPixelShielLog: (year: number) => getPixelShielLog(db, year),
  getFastSessionByIds: (ids: string[]) => getFastSessionByIds(db, ids),

  getUserAssets: (userId: string, type?:UserAsset["type"]) => getUserAssets(db, userId,type),

  addPurchasedTheme: ({
    userId,
    theme,
    token,
  }: {
    userId: string;
    theme: string;
    token: string;
  }) =>
    createUserAsset(db, {
      asset_id: theme,
      type: "theme",
      source: "purchased",
      token: token,
      user_id: userId,
    }),
  unPurchasedTheme: (theme: string) => removeUserAsset(db, theme),

  togglePremium: (isPremium: boolean) => togglePremium(db, isPremium),
});

export const generateSchema = `
    ${userGenerateString}
    ${settingGenerateString}
    ${themeGenerateString}
    ${fast_sessionsGenerateString}
    ${daily_logsGenerateString}
    ${daily_noteGenerateString}
    ${weight_trackerGenerateString}
    ${target_GenerateString}
    ${habit_logsGenerateString}
    ${userAssetsGenerateString}
    ${userAchievementsGenerateString}
    ${userArchivementsItemGenerateString}
`;

const generateSeedData = `
${userSeedData}
`;

export const initDatabase = async (db: SQLiteDatabase) => {
  try {
    const DATABASE_VERSION = 1; // get from server
    // let version = 0;
    // await clearDatabase(db);
    const version = await getDatabaseVersion(db);

    console.log("db version", version);

    await migrateDatabase(db, version, DATABASE_VERSION);
  } catch (error) {
    console.error("Lỗi khi tạo DB:", error);
  }
};

export const getDatabaseVersion = async (
  db: SQLiteDatabase,
): Promise<number> => {
  try {
    // Câu lệnh SELECT lấy version
    const result = await db.getFirstAsync<{ user_version: number }>(
      "PRAGMA user_version;",
    );

    // Trả về số version, nếu lỗi không tìm thấy thì mặc định là 0
    return result?.user_version ?? 0;
  } catch (error) {
    console.error("Lỗi khi lấy DB Version:", error);
    return 0;
  }
};

export const clearDatabase = async (db: SQLite.SQLiteDatabase) => {
  // 1. Tắt khóa ngoại tạm thời để xóa cho dễ
  await db.execAsync(`PRAGMA user_version = 0;`);
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

const migrateDatabase = async (
  db: SQLiteDatabase,
  version: number,
  DATABASE_VERSION: number,
) => {
  for (
    let nextVersion = version + 1;
    nextVersion <= DATABASE_VERSION;
    nextVersion++
  ) {
    await handleMigrate(db, nextVersion);
  }
};

const handleMigrate = async (db: SQLiteDatabase, version: number) => {
  if (version === 1) {
    await db.execAsync(generateSchema);

    console.log("generateSchema completed");
    await db.execAsync(generateSeedData);
  }

  // if(version === 2) {
  //   await db.execAsync(`
  //   ${userAssetsGenerateString}
  //   ${userAchievementsGenerateString}
  //   ${userArchivementsItemGenerateString}
  // `);

  //   console.log('migrateDB completed to version 2');
  // }

  await db.execAsync(`PRAGMA user_version = ${version};`);
};
