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
  getTodayLog,
} from "./shema/daily_logs";
import {
  generateString as daily_noteGenerateString,
  getDailyNote,
  getDailyNotes,
  setDailyNote,
} from "./shema/daily_note";
import {
  deleteSession,
  generateString as fast_sessionsGenerateString,
  fastFail,
  finishLastSession,
  getFastSessions,
  getFastStatsSummary,
  getLastFastSession,
  getYearFastSession,
  startNewSession,
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
} from "./shema/user";
import {
  getCurrentWeight,
  getWeightLogs,
  updateWeight,
  generateString as weight_trackerGenerateString,
} from "./shema/weight_tracker";

import { getLocalTodayStr } from "@/util/timer";
import {
  addHabitLogs,
  AddHabitType,
  getHabitLogs,
  getLastHabitLog,
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
  finishLastSession: (
    id: string,
    endTime: number,
    duration: number,
    isValid: boolean,
  ) => finishLastSession(db, id, endTime, duration, isValid),
  deleteSession: (id: string) => deleteSession(db, id),
  startNewSession: (startTime: number) => startNewSession(db, startTime),

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

  getCurrentWeight: () => getCurrentWeight(db),
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
`;

export const initDatabase = async (db: SQLiteDatabase) => {
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
    // await db.execAsync(generateSeedData);
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
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
  const now = new Date();
  const todayStr = getLocalTodayStr();

  let isFastFail = false;
  let isClearStreak = false;
  let increaseStreakNumber = 0;
  let reduceShieldNumber = 0;
  let reduceHabitNumber = 0;
  let overRestDays = 0;

  if (!profile) {
    return {
      lastFast,
      profile,
      habitLog,
    };
  }

  // 0.Hôm nay đã xử lý rồi
  if (profile.streak_date === todayStr) {
    return {
      lastFast,
      profile,
      habitLog,
    };
  }

  if (!lastFast) {
    ((isClearStreak = true), (reduceHabitNumber = habitLog?.habit_snap || 0));
  }
  // 1. Kiểm tra có đang fast hay không
  else if (!lastFast.end_time) {
    // Nếu thời gian hiện tại cách thời điểm start_fast quá 7 ngày => fast fail, xóa streak
    const startFast = new Date(lastFast.start_time);

    // BỎ QUA nếu hôm nay đã vào app và xử lý rồi (Check dựa vào last_login hoặc last_streak_date)

    // Ngày hoàn thành fast trên lý thuyết
    const targetDay = getLocalTodayStr(
      new Date(
        lastFast.start_time + (lastFast.target_duration || 24) * 60 * 60 * 1000,
      ),
    );
    const startDay = getLocalTodayStr(startFast);
    const diffInDays = Math.floor(
      (now.getTime() - new Date(startDay).getTime()) / (1000 * 60 * 60 * 24),
    );
    const diffInDaysFromTarget = Math.floor(
      (now.getTime() - new Date(targetDay).getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffInDaysFromTarget > 1) {
      isFastFail = true;
      // fast = fail, kết thúc vào hiện tại
      const shield_need = diffInDaysFromTarget - 1;
      const currentShield = habitLog?.shield_snap || 0;
      overRestDays = shield_need - currentShield;

      if (overRestDays > 0) {
        const habitReduce =
          3 +
          Math.pow(
            overRestDays,
            1 + (overRestDays) / 20,
          );
        reduceHabitNumber = habitReduce;
        isClearStreak = true;
        // xóa shield, retain trừ habit với min = 0
      } else {
        // trừ shield tương ứng
        reduceShieldNumber = shield_need;
        increaseStreakNumber = diffInDays;
      }
    } else {
      increaseStreakNumber = diffInDays;
      // streak += diffInDays
    }
  } else {
    const diffInDays = Math.floor(
      (now.getTime() - new Date(profile.streak_date).getTime()) /
        (1000 * 60 * 60 * 24),
    );

    if (diffInDays > 1) {
      const shield_need = diffInDays - 1;
      const currentShield = habitLog?.shield_snap || 0;

      overRestDays = shield_need - currentShield;

      if (overRestDays>0) {
        const habitReduce =
          5 +
          Math.round(
            Math.pow(
              overRestDays,
              1 + (overRestDays) / 19,
            ) * 10,
          ) /
            10;
        reduceHabitNumber = habitReduce;
        isClearStreak = true;
        // xóa shield, retain trừ habit với min = 0
      } else {
        // trừ shield tương ứng
        increaseStreakNumber = diffInDays;
        reduceShieldNumber = shield_need;
      }
    } else {
      increaseStreakNumber = diffInDays;
      // streak += diffInDays
    }
  }

  let returnLastFast = lastFast || null;
  let returnHabitLog = habitLog || null;
  let returnProfile = profile;

  if (increaseStreakNumber) {
    returnProfile = await increaseStreak(db, profile, increaseStreakNumber);
    if (habitLog && reduceShieldNumber)
      returnHabitLog = await reduceShield(db, habitLog, reduceShieldNumber);
  } else {
    returnProfile = await clearStreak(db, profile);
    if (habitLog && reduceHabitNumber)
      returnHabitLog = await reduceHabit(db, habitLog, reduceHabitNumber, overRestDays);
  }
  if (isFastFail && lastFast) returnLastFast = await fastFail(db, lastFast);

  return {
    lastFast: returnLastFast,
    profile: returnProfile,
    habitLog: returnHabitLog,
  };
};
