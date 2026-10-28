import { logDbError } from "@/utils/dbError";
import {
  FastSession,
  HabitLog,
  MoodLevel,
  UserAsset,
  UserProfile,
} from "@/interfaces/db.type";
import { SQLiteDatabase } from "expo-sqlite";
import {
  addDailyLogs,
  generateString as daily_logsGenerateString,
  getDailyLogs,
  getPixelLogData,
} from "./schema/daily_logs";
import {
  generateString as daily_noteGenerateString,
  getDailyNote,
  getPixelNoteData,
  setDailyNote,
} from "./schema/daily_note";
import {
  deleteSession,
  generateString as fast_sessionsGenerateString,
  finishLastSession,
  getFastSessionByIds,
  getFastSessions,
  getFastStatsSummary,
  getLastFastSession,
  reconcileStreak,
  startNewSession,
  updateSessionTarget,
} from "./schema/fast_sessions";
import {
  changeTheme,
  getUserSettings,
  setAppSetting,
  generateString as settingGenerateString,
  toggleTheme,
} from "./schema/setting";
import {
  checkAndUpdateActiveTarget,
  createWeightTarget,
  getActiveWeightTarget,
  generateString as target_GenerateString,
} from "./schema/target";
import {
  generateString as themeGenerateString,
} from "./schema/theme";
import {
  getUserProfile,
  togglePremium,
  generateString as userGenerateString,
  userSeedData,
} from "./schema/user";
import {
  getCurrentWeight,
  getWeightLogs,
  updateWeight,
  generateString as weight_trackerGenerateString,
} from "./schema/weight_tracker";

import {
  AchievementInput,
  AchievementMilestoneUnlock,
  AchievementProgressUpdate,
} from "@/constants/achievements";
import { ThemeKey } from "@/constants/themes";
import {
  getHabitLogs,
  getLastHabitLog,
  getPixelShielLog,
  generateString as habit_logsGenerateString,
} from "./schema/habit_logs";
import {
  confirmAchievementMilestone,
  getUserAchievements,
  getUserMilestones,
  updateMileStones,
  updateUserAchievements,
  generateString as userAchievementsGenerateString,
  itemGenerateString as userArchivementsItemGenerateString,
} from "./schema/user_achievements";
import {
  createUserAsset,
  getUserAssets,
  removeUserAsset,
  generateString as userAssetsGenerateString,
} from "./schema/user_assets";

export const DATABASE_NAME = "fast_fast";

export const createDBService = (db: SQLiteDatabase) => ({
  getUserSettings: () => getUserSettings(db),
  getUserProfile: () => getUserProfile(db),

  getFastSessions: () => getFastSessions(db),
  getFastStatsSummary: () => getFastStatsSummary(db),
  getLastFastSession: () => getLastFastSession(db),
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

  getDailyNote: (date?: string) => getDailyNote(db, date),
  setDailyNote: (
    moodLevel?: MoodLevel,
    note?: string,
    image_uri?: string|null,
    date?: string,
  ) => setDailyNote(db, moodLevel, note, image_uri, date),
  addDailyLogs: (data: {
    log_date: string;
    fast_id: string;
    hours_in_day: number;
    elapsed_times: number;
    hour_in_fast: number;
  }) => addDailyLogs(db, data),

  changeTheme: (theme: ThemeKey) => changeTheme(db, theme),
  toggleTheme: (value: boolean) => toggleTheme(db, value),

  getCurrentWeight: (date?: string) => getCurrentWeight(db, date),
  getWeightLogs: (days?: number) => getWeightLogs(db, days),
  updateWeight: (weight: number, date?:string) => updateWeight(db, weight, date),

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
  getHabitLogs: () => getHabitLogs(db),
  getLastHabitLog: () => getLastHabitLog(db),

  getPixelNoteData: (year: number) => getPixelNoteData(db, year),
  getPixelLogData: (year: number) => getPixelLogData(db, year),
  getPixelShielLog: (year: number) => getPixelShielLog(db, year),
  getFastSessionByIds: (ids: string[]) => getFastSessionByIds(db, ids),

  getUserAssets: (userId: string, type?: UserAsset["type"]) =>
    getUserAssets(db, userId, type),

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
  getUserAchievements: (userId: string, inputs?: AchievementInput[]) =>
    getUserAchievements(db, userId, inputs),
  getUserMilestones: (userId: string) => getUserMilestones(db, userId),

  updateMileStones: (milestones: AchievementMilestoneUnlock[]) =>
    updateMileStones(db, milestones),
  updateUserAchievements: (userAchievements: AchievementProgressUpdate[]) =>
    updateUserAchievements(db, userAchievements),
  confirmAchievementMilestone: (milestoneId: string) =>
    confirmAchievementMilestone(db, milestoneId),

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

const DATABASE_VERSION = 4;

/**
 * Đổi đường dẫn ảnh tuyệt đối (kiểu cũ) thành tên file. Đường dẫn tuyệt đối
 * hỏng khi cài lại app hay khôi phục sang máy khác. Chạy lại được nhiều lần.
 */
export const normalizeImagePaths = async (db: SQLiteDatabase) => {
  for (const table of ["daily_notes", "user_profile"]) {
    await db.runAsync(
      `UPDATE "${table}"
       SET image_uri = replace(image_uri, rtrim(image_uri, replace(image_uri, '/', '')), '')
       WHERE image_uri LIKE '%/%';`,
    );
  }
};
export const initDatabase = async (db: SQLiteDatabase) => {
  try {
    // ⚡ 1. Tối ưu hiệu năng đọc/ghi cho SQLite (WAL mode)
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;
      PRAGMA foreign_keys = ON;
    `);

    const version = await getDatabaseVersion(db);

    if (version < DATABASE_VERSION) {
      await migrateDatabase(db, version, DATABASE_VERSION);
    }
  } catch (error) {
    logDbError("❌ Lỗi khởi tạo SQLite DB:", error);
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
    logDbError("Lỗi khi lấy DB Version:", error);
    return 0;
  }
};
const migrateDatabase = async (
  db: SQLiteDatabase,
  currentVersion: number,
  targetVersion: number,
) => {
  for (let v = currentVersion + 1; v <= targetVersion; v++) {
    await handleMigrate(db, v);
  }
};

const handleMigrate = async (db: SQLiteDatabase, version: number) => {
  // ⚡ 2. Bọc toàn bộ migration trong Transaction để đảm bảo tính toàn vẹn dữ liệu
  await db.withTransactionAsync(async () => {
    if (version === 1) {
      await db.execAsync(generateSchema);
      console.log("✅ Schema generated successfully");

      if (generateSeedData.trim()) {
        await db.execAsync(generateSeedData);
        console.log("✅ Seed data inserted successfully");
      }
    }

    if (version === 2) {
      await normalizeImagePaths(db);
    }

    if (version === 4) {
      // Cột dùng để sắp xếp / lọc thường xuyên; dữ liệu tích luỹ nhiều năm vẫn nhanh
      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_fast_sessions_deleted_id ON fast_sessions(is_deleted, id);
        CREATE INDEX IF NOT EXISTS idx_habit_logs_date ON habit_logs(log_date);
        CREATE INDEX IF NOT EXISTS idx_daily_logs_fast ON daily_logs(fast_id);
      `);
    }

    if (version === 3) {
      // CHECK cũ (1–5) chặn mood 0. SQLite không sửa được CHECK nên dựng lại bảng
      await db.execAsync(`
        ALTER TABLE daily_notes RENAME TO daily_notes_old;
        DROP INDEX IF EXISTS idx_daily_notes_date;
        ${daily_noteGenerateString}
        INSERT INTO daily_notes (log_date, mood_level, note, image_uri, sync_status, created_at, updated_at)
          SELECT log_date, mood_level, note, image_uri, sync_status, created_at, updated_at
          FROM daily_notes_old;
        DROP TABLE daily_notes_old;
      `);
    }

    // Cập nhật version trong cùng transaction
    await db.execAsync(`PRAGMA user_version = ${version};`);
  });
};

export const clearDatabase = async (db: SQLiteDatabase) => {
  try {
    await db.withTransactionAsync(async () => {
      await db.execAsync("PRAGMA foreign_keys = OFF;");

      const tables = await db.getAllAsync<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';",
      );

      if (tables.length > 0) {
        const dropStatements = tables
          .map((t) => `DROP TABLE IF EXISTS ${t.name};`)
          .join("\n");
        await db.execAsync(dropStatements);
      }

      await db.execAsync(`PRAGMA user_version = 0;`);
      await db.execAsync("PRAGMA foreign_keys = ON;");
    });
    console.log("🧹 Clear Database thành công!");
  } catch (error) {
    logDbError("Lỗi clear Database:", error);
  }
};
