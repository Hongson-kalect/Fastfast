import { reduceHabit, reduceShield } from "@/database/shema/habit_logs";
import { clearStreak, increaseStreak, updateStreakDate } from "@/database/shema/user";
import { HabitLog, UserProfile } from "@/interfaces/db.type";
import { StreakCheckResult } from "@/interfaces/home.type";
import { SQLiteDatabase } from "expo-sqlite";
import { getDaysDiff, getLocalTodayStr } from "./timer";
import { calculateFastReward } from "@/database/shema/fast_sessions";

export type StreakContext = {
  profile: UserProfile;
  habitLog: HabitLog | null;
  stats: StreakCheckResult;
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


export const createStreakContext = (
  profile: UserProfile,
  habitLog: HabitLog | null,
): StreakContext => ({
  profile,
  habitLog,
  stats: initStreakStats(profile, habitLog),
});

export const setStreakProfile = (
  context: StreakContext,
  profile: UserProfile,
) => {
  context.profile = profile;

  context.stats.streak.current =
    profile.current_streak || 0;

  context.stats.streak.max =
    profile.max_streak || 0;
};

export const applyStreakIncrease = (
  context: StreakContext,
  amount: number,
) => {
  if (amount <= 0) return;

  const current = context.profile.current_streak || 0;
  const max = context.profile.max_streak || 0;

  const newStreak = current + amount;

  context.profile.current_streak = newStreak;
  context.profile.max_streak = Math.max(max, newStreak);

  context.stats.streak.current = newStreak;
  context.stats.streak.max = context.profile.max_streak;
};

export const applyStreakDate = (
  context: StreakContext,
  date: string,
) => {
  context.profile.streak_date = date;
};

export const applyClearStreak = (
  context: StreakContext,
) => {
  context.profile.current_streak = 0;

  context.stats.streak.current = 0;
};

export const applyShieldReduction = (
  context: StreakContext,
  amount: number,
) => {
  if (!context.habitLog || amount <= 0) return;

  const current = context.habitLog.shield_snap || 0;

  context.habitLog.shield_snap = Math.max(
    current - amount,
    0,
  );

  context.stats.shield.current =
    context.habitLog.shield_snap;
};

export const applyHabitReduction = (
  context: StreakContext,
  amount: number,
  overRestDays: number,
) => {
  if (!context.habitLog) return;

  // Nếu reduceHabit hiện tại có công thức phức tạp,
  // đưa phần calculation vào đây.

  const current = context.habitLog.habit_snap || 0;

  const reduction = amount;

  context.habitLog.habit_snap = Math.max(
    current - reduction,
    0,
  );

  context.stats.habit.currentPercent =
    context.habitLog.habit_snap;

  context.stats.shield.current =
    context.habitLog.shield_snap || 0;

  context.stats.retain.current =
    context.habitLog.habit_retain || 0;
};

export const calculateStreakGain = (
  streakDate: string | null,
  endDate: string,
) => {
  if (!streakDate) return 0;

  return Math.max(
    getDaysDiff(streakDate, endDate),
    0,
  );
};

export const getStreakResult = (
  context: StreakContext,
): StreakCheckResult => {
  return context.stats;
};

export const saveStreakContext = async (
  db: SQLiteDatabase,
  context: StreakContext,
) => {
  const { profile, habitLog } = context;

  await db.runAsync(
    `UPDATE user_profile
     SET current_streak = ?,
         max_streak = ?,
         streak_date = ?,
         updated_at = strftime('%s', 'now')
     WHERE id = ?;`,
    [
      profile.current_streak,
      profile.max_streak,
      profile.streak_date,
      profile.id,
    ],
  );

  if (habitLog) {
    await db.runAsync(
      `UPDATE habit_logs
       SET habit_snap = ?,
           shield_snap = ?,
           habit_retain = ?
       WHERE id = ?;`,
      [
        habitLog.habit_snap,
        habitLog.shield_snap,
        habitLog.habit_retain||0,
        habitLog.id,
      ],
    );
  }
};

export const applyLastLoginDate = (
  context: StreakContext,
  date: string,
) => {
  context.profile.last_login_date = date;
};

export const getYesterdayStr = (
  todayStr: string,
) => {
  const date = new Date(`${todayStr}T00:00:00`);
  date.setDate(date.getDate() - 1);

  return getLocalTodayStr(date);
};

export const applyShieldReward = (
  context: StreakContext,
  reward: ReturnType<typeof calculateFastReward>,
) => {
  if (!context.habitLog || !reward || !context.profile) {
    return;
  }

  const { profile, stats } = context;

  profile.total_shield_clamable += reward.totalShieldGain;
  profile.low_shield_clamable = reward.lowClaimable;
  profile.mid_shield_clamable = reward.midClaimable;
  profile.full_shield_clamable = reward.fullClaimable;

  stats.shield.current = stats.shield.current + reward.totalShieldGain;
};

export const applyStreakReward = async (
 context: StreakContext,
  endTime: number,
) => {
const { profile: oldProfile } = context;
  const endDate = getLocalTodayStr(new Date(endTime));

  const streakGain = oldProfile.streak_date
    ? Math.max(
        getDaysDiff(oldProfile.streak_date, endDate),
        0,
      )
    : 0;

    oldProfile.active_days = oldProfile.active_days + streakGain;
    oldProfile.streak_date = endDate;
    oldProfile.current_streak = oldProfile.current_streak + streakGain;
    oldProfile.max_streak = Math.max(oldProfile.max_streak, oldProfile.current_streak);
};
