import { calculateFastReward } from "@/database/schema/fast_sessions";
import { RETAIN_LIMIT, SHIELD_LIMIT } from "@/database/schema/habit_logs";
import { HabitEffect, HabitLog, UserProfile } from "@/interfaces/db.type";
import { StreakCheckResult } from "@/interfaces/home.type";
import { SQLiteDatabase } from "expo-sqlite";
import { getDaysDiff, getLocalTodayStr } from "./timer";

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
};

export const createStreakContext = (
  profile: UserProfile,
  habitLog: HabitLog | null,
): StreakContext => ({
  profile,
  habitLog,
  stats: initStreakStats(profile, habitLog),
});

export const applyStreakDate = (context: StreakContext, date: string) => {
  context.profile.streak_date = date;
};

export const applyClearStreak = (context: StreakContext) => {
  context.profile.current_streak = 0;

  context.stats.streak.current = 0;
};

export const saveStreakContext = async (
  db: SQLiteDatabase,
  context: StreakContext,
) => {
  const { profile } = context;

  await db.runAsync(
    `UPDATE user_profile
     SET current_streak = ?,
         max_streak = ?,
         streak_date = ?,
         last_login_date=?,
         updated_at = strftime('%s', 'now')
     WHERE id = ?;`,
    [
      profile.current_streak,
      profile.max_streak,
      profile.streak_date,
      profile.last_login_date,
      profile.id,
    ],
  );
};

export const applyLastLoginDate = (context: StreakContext, date: string) => {
  context.profile.last_login_date = date;
};

export const getYesterdayStr = (todayStr: string) => {
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

  stats.shield.current = Math.min(reward.newShieldScore, SHIELD_LIMIT);
};

export const applyStreakReward = (
  context: StreakContext,
  endTime: number,
) => {
  const { profile: oldProfile, stats } = context;
  const endDate = getLocalTodayStr(new Date(endTime));

  const streakGain = oldProfile.streak_date
    ? Math.max(getDaysDiff(oldProfile.streak_date, endDate), 0)
    : 0;

  oldProfile.active_days = oldProfile.active_days + streakGain;
  oldProfile.streak_date = endDate;
  oldProfile.current_streak = oldProfile.current_streak + streakGain;
  oldProfile.max_streak = Math.max(
    oldProfile.max_streak,
    oldProfile.current_streak,
  );

  stats.streak.current = oldProfile.current_streak;

  return {
    streakGain,
    currentStreak: oldProfile.current_streak,
  }
};

export const applyHabitReward = (
  context: StreakContext,
  reward: HabitEffect,
) => {
  if (!context.habitLog || !reward || !context.profile) {
    return;
  }

  const { stats } = context;
  const { newHabitScore, newShieldScore, newRetain } = reward;

  stats.shield.current = Math.min(newShieldScore, SHIELD_LIMIT);
  stats.retain.current = Math.min(newRetain, RETAIN_LIMIT);
  stats.habit.currentPercent = Math.min(newHabitScore, 100);
};
