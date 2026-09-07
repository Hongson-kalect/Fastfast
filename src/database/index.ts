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
// Helper tính khoảng cách số ngày giữa 2 chuỗi 'YYYY-MM-DD' (Tránh lỗi timezone)
const getDaysDiff = (fromStr: string, toStr: string): number => {
  const d1 = new Date(`${fromStr}T00:00:00Z`);
  const d2 = new Date(`${toStr}T00:00:00Z`);
  const diffTime = d2.getTime() - d1.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

export const handleLogin = async ({
  db,
  lastFast,
  profile,
  habitLog,
}: HandleLoginParams) => {
  const todayStr = getLocalTodayStr();

  if (!profile) {
    return { lastFast, profile, habitLog, streak: null };
  }

  // Lần đầu vào app, khởi tạo streak_date
  if (!profile.streak_date) {
    const returnProfile = await clearStreak(
      db,
      profile,
      0,
      habitLog?.habit_snap || 0,
    );
    return { lastFast, profile: returnProfile, habitLog, streak: null };
  }

  // 0. Hôm nay đã xử lý rồi
  if (profile.streak_date === todayStr) {
    return { lastFast, profile, habitLog, streak: null };
  }

  let isFastFail = false;
  let increaseStreakNumber = 0;
  let reduceShieldNumber = 0;
  let reduceHabitNumber = 0;
  let overRestDays = 0;

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

  // -------------------------------------------------------------
  // 1. TÌM MỐC HOẠT ĐỘNG HỢP LỆ CUỐI CÙNG (effectiveLastDate)
  // -------------------------------------------------------------
  let effectiveLastDate = profile.streak_date;
  // -------------------------------------------------------------
  // 2. TÍNH KHOẢNG CÁCH NGÀY & KIỂM TRA STREAK / SHIELD
  // -------------------------------------------------------------
  let diffInDaysFromLastActive = getDaysDiff(effectiveLastDate, todayStr);

  console.log(todayStr, profile.streak_date, lastFast);

  // Nếu đang có phiên Fast chưa kết thúc
  if (lastFast && !lastFast.end_time) {
    const targetEndTime =
      lastFast.start_time + (lastFast.target_duration || 24) * 60 * 60 * 1000;
    const targetDayStr = getLocalTodayStr(new Date(targetEndTime));

    // Lấy mốc LỚN NHẤT giữa streak_date và targetDayStr
    if (targetDayStr > effectiveLastDate) {
      effectiveLastDate = targetDayStr;
      diffInDaysFromLastActive = getDaysDiff(effectiveLastDate, todayStr);
    }

    // Nếu thời gian hiện tại đã vượt quá targetDayStr ít nhất 1 ngày -> Cần chốt phiên Fast cũ
    if (diffInDaysFromLastActive > 1) {
      isFastFail = true;
    }
  }

  // Khoảng cách thực tế từ Streak Date cũ -> Hôm Nay (Dùng để cộng dồn Streak)
  const totalDaysFromStreakDate = getDaysDiff(profile.streak_date, todayStr);

  if (diffInDaysFromLastActive > 1) {
    // 🔴 BỊ BỎ VẮNG > 1 NGÀY: Cần trừ Shield hoặc Reset Streak
    const shieldNeed = diffInDaysFromLastActive - 1;
    const currentShield = habitLog?.shield_snap || 0;

    overRestDays = shieldNeed - currentShield;

    if (overRestDays > 0) {
      // Shield không đủ gánh -> Reset Streak
      reduceHabitNumber =
        5 + Math.round(Math.pow(overRestDays, 1 + overRestDays / 19) * 10) / 10;
    } else {
      // Shield gánh thành công! Giữ Streak và cộng bù số ngày
      reduceShieldNumber = shieldNeed;
      increaseStreakNumber = totalDaysFromStreakDate;
    }
  } else {
    // 🟢 HỢP LỆ (Vào liên tục hoặc chênh 1 ngày): Cộng Streak bình thường
    increaseStreakNumber = totalDaysFromStreakDate;
  }

  // -------------------------------------------------------------
  // 3. THỰC THI DATABASE TRANSACTION
  // -------------------------------------------------------------
  let returnLastFast = lastFast || null;
  let returnHabitLog = habitLog || null;
  let returnProfile: UserProfile | null = profile;

  await db.withTransactionAsync(async () => {
    if (increaseStreakNumber > 0) {
      returnProfile = await increaseStreak(
        db,
        profile,
        increaseStreakNumber,
        reduceShieldNumber,
      );
      streakStat.streak.max = returnProfile?.max_streak || 0;
      streakStat.streak.current = returnProfile?.current_streak || 0;

      if (habitLog && reduceShieldNumber > 0) {
        returnHabitLog = await reduceShield(db, habitLog, reduceShieldNumber);
      }
    } else {
      // Reset Streak về 1 (Cho ngày hôm nay)
      streakStat.streak.current = 1;

      returnProfile = await clearStreak(
        db,
        profile,
        reduceHabitNumber,
        habitLog?.shield_snap || 0,
        habitLog?.habit_snap || 0,
      );

      if (habitLog && reduceHabitNumber > 0) {
        returnHabitLog = await reduceHabit(
          db,
          habitLog,
          reduceHabitNumber,
          overRestDays,
        );
        streakStat.habit.currentPercent = returnHabitLog?.habit_snap || 0;
        streakStat.shield.current = returnHabitLog?.shield_snap || 0;
        streakStat.retain.current = returnHabitLog?.habit_retain || 0;
      }
    }

    // Auto-close / Fail phiên Fast treo cũ
    if (isFastFail && lastFast) {
      returnLastFast = await fastFail(db, lastFast);
    }
  });

  return {
    lastFast: returnLastFast,
    profile: returnProfile,
    habitLog: returnHabitLog,
    streak: streakStat,
  };
};
