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
         active_days = ?,
         streak_date = ?,
         last_login_date = ?,
         total_shield_used = ?,
         total_shield_clamable = ?,
         total_shield_wasted = ?,
         low_shield_clamable = ?,
         mid_shield_clamable = ?,
         full_shield_clamable = ?,
         full_habit_at = ?,
         updated_at = strftime('%s', 'now')
     WHERE id = ?;`,
    [
      profile.current_streak,
      profile.max_streak,
      profile.active_days ?? 0,
      profile.streak_date,
      profile.last_login_date,
      profile.total_shield_used ?? 0,
      profile.total_shield_clamable ?? 0,
      profile.total_shield_wasted ?? 0,
      profile.low_shield_clamable,
      profile.mid_shield_clamable,
      profile.full_shield_clamable,
      profile.full_habit_at ?? null,
      profile.id,
    ],
  );
};

// Penalty có thể mở lại các mốc shield khi habit tụt dưới ngưỡng
export const applyPenaltyClaimables = (
  context: StreakContext,
  penalty: { lowClaimable: number; midClaimable: number; fullClaimable: number },
) => {
  context.profile.low_shield_clamable = penalty.lowClaimable;
  context.profile.mid_shield_clamable = penalty.midClaimable;
  context.profile.full_shield_clamable = penalty.fullClaimable;
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

  profile.total_shield_clamable =
    (profile.total_shield_clamable ?? 0) + reward.totalShieldGain;
  profile.total_shield_wasted =
    (profile.total_shield_wasted ?? 0) + reward.wastedShield;
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
  // Phiên nhập lùi (kết thúc trước mốc streak hiện tại) không được kéo streak_date lùi lại,
  // nếu không lần reconcile tiếp theo sẽ coi khoảng từ đó tới hôm nay là ngày nghỉ.
  if (!oldProfile.streak_date || endDate > oldProfile.streak_date) {
    oldProfile.streak_date = endDate;
  }
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

  const { stats, profile } = context;
  const { newHabitScore, newShieldScore, newRetain } = reward;

  if (newHabitScore >= 100 && !profile.full_habit_at) {
    profile.full_habit_at = getLocalTodayStr();
  }

  stats.shield.current = Math.min(newShieldScore, SHIELD_LIMIT);
  stats.retain.current = Math.min(newRetain, RETAIN_LIMIT);
  stats.habit.currentPercent = Math.min(newHabitScore, 100);
};
