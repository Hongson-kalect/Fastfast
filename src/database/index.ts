import {
  FastSession,
  HabitLog,
  MoodLevel,
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
  evaluateFastStatus,
  generateString as fast_sessionsGenerateString,
  fastFail,
  finishLastSession,
  getFastSessionByIds,
  getFastSessions,
  getFastStatsSummary,
  getLastFastSession,
  getYearFastSession,
  startNewSession,
  updateSessionTarget,
} from "./shema/fast_sessions";
import {
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
  clearStreak,
  getUserProfile,
  increaseStreak,
  updateLastLoginDate,
  updateStreakDate,
  generateString as userGenerateString,
  userSeedData,
} from "./shema/user";
import {
  getCurrentWeight,
  getWeightLogs,
  updateWeight,
  generateString as weight_trackerGenerateString,
} from "./shema/weight_tracker";

import { StreakCheckResult } from "@/interfaces/home.type";
import { getLocalTodayStr } from "@/util/timer";
import {
  addHabitLogs,
  AddHabitType,
  calculateStreakPenalties,
  getHabitLogs,
  getLastHabitLog,
  getShieldUsedLog,
  generateString as habit_logsGenerateString,
  reduceHabit,
  reduceShield,
} from "./shema/habit_logs";

export const DATABASE_NAME = "fast_fast";

export const createDBService = (db: SQLiteDatabase) => ({
  getUserSettings: () => getUserSettings(db),
  getUserProfile: () => getUserProfile(db),

  getFastSessions: () => getFastSessions(db),
  getFastStatsSummary: () => getFastStatsSummary(db),
  getLastFastSession: () => getLastFastSession(db),
  getYearFastSession: (year: number) => getYearFastSession(db, year),
  finishLastSession: (data: {
    id: string;
    endTime: number;
    duration: number;
    isValid: boolean;
    isTooFast:boolean,
    profile?: UserProfile;
    habitLog?: HabitLog;
  }) => finishLastSession(db, data),
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
  addHabitLogs: (data: AddHabitType) => addHabitLogs(db, data),
  getLastHabitLog: () => getLastHabitLog(db),
  getShieldUsedLog: (year: number) => getShieldUsedLog(db, year),

  getPixelNoteData: (year: number) => getPixelNoteData(db, year),
  getPixelLogData: (year: number) => getPixelLogData(db, year),
  getFastSessionByIds: (ids: string[]) => getFastSessionByIds(db, ids),
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
    if (version >= 1) {
      return;
    }

    if (version >= DATABASE_VERSION) {
      return;
    }

    if (version === 0) {
      await db.execAsync(generateSchema);

      console.log("generateSchema completed");
      await db.execAsync(generateSeedData);
    }

    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
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

type HandleLoginParams = {
  db: SQLiteDatabase;
  lastFast: FastSession | null;
  profile: UserProfile | null;
  habitLog: HabitLog | null;
};

export const handleLogin = async ({
  db,
  lastFast,
  profile,
  habitLog,
}: HandleLoginParams) => {
  const todayStr = getLocalTodayStr();

  // Guard Clauses
  if (!profile) return { lastFast, profile, habitLog, streak: null };

  if (!profile.streak_date) {
    const returnProfile = await clearStreak(db, profile, 0, habitLog?.shield_snap || 0, habitLog?.habit_snap || 0);
    await updateLastLoginDate(db, profile, todayStr);
    return { lastFast, profile: returnProfile, habitLog, streak: null };
  }

  if (profile.streak_date === todayStr) {
    return { lastFast, profile, habitLog, streak: null };
  }

  // 1. Evaluate Fast Fail
  const previousLoginDate = profile.last_login_date || profile.streak_date;
  const { isFastFail, referenceDate } = evaluateFastStatus(lastFast, previousLoginDate, todayStr);

  if (lastFast && !lastFast.end_time && !isFastFail) {
    await updateLastLoginDate(db, profile, todayStr);
    return { lastFast, profile, habitLog, streak: null };
  }

  // 2. Calculate Penalties
  const currentShield = habitLog?.shield_snap || 0;
  const { gap, reduceShieldNumber, reduceHabitNumber, overRestDays, isStreakSavedByShield } =
    calculateStreakPenalties(referenceDate, todayStr, currentShield);

  // 3. Setup Stats & Dates
  let returnLastFast = lastFast || null;
  let returnHabitLog = habitLog || null;
  let returnProfile: UserProfile | null = profile;

  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = getLocalTodayStr(yesterdayDate);

  const streakStat = initStreakStats(profile, habitLog);

  // 4. Apply Database Transaction
  await db.withTransactionAsync(async () => {
    if (isFastFail && lastFast) {
      returnLastFast = await fastFail(db, lastFast);
    }

    returnProfile = await updateLastLoginDate(db, returnProfile || profile, todayStr);

    if (gap <= 1) {
      if (isFastFail) returnProfile = await updateStreakDate(db, returnProfile!, yesterdayStr);
      return;
    }

    if (isStreakSavedByShield) {
      returnProfile = await updateStreakDate(db, returnProfile!, yesterdayStr);
      if (habitLog && reduceShieldNumber > 0) {
        returnHabitLog = await reduceShield(db, habitLog, reduceShieldNumber);
        streakStat.shield.current = returnHabitLog?.shield_snap || 0;
      }
    } else {
      streakStat.streak.current = 0;
      returnProfile = await clearStreak(db, returnProfile!, reduceHabitNumber, reduceShieldNumber, habitLog?.habit_snap || 0);
      returnProfile = await updateStreakDate(db, returnProfile!, yesterdayStr);

      if (habitLog) {
        returnHabitLog = await reduceHabit(db, habitLog, reduceHabitNumber, overRestDays);
        streakStat.habit.currentPercent = returnHabitLog?.habit_snap || 0;
        streakStat.shield.current = returnHabitLog?.shield_snap || 0;
        streakStat.retain.current = returnHabitLog?.habit_retain || 0;
      }
    }
  });

  return { lastFast: returnLastFast, profile: returnProfile, habitLog: returnHabitLog, streak: streakStat };
};

const initStreakStats = (profile: UserProfile, habitLog: HabitLog | null) => {
  const streakStat: StreakCheckResult = {
    streak: {
      previous: profile.current_streak || 0,
      max: profile.max_streak || 0,
      current: profile.current_streak || 0,
    },
    habit: {
      currentPercent: habitLog?.habit_snap || 0,
      previousPercent: habitLog?.habit_snap || 0,
    },
    shield: {
      previous: habitLog?.shield_snap || 0,
      current: habitLog?.shield_snap || 0,
    },
    retain: {
      previous: habitLog?.habit_retain || 0,
      current: habitLog?.habit_retain || 0,
    },
  };

  return streakStat;
}

const MAX_FAST_HOURS = 100;

// Helper 1: Check Fast Fail status
