import { SQLiteDatabase } from "expo-sqlite";
import {
  applyClearStreak,
  applyLastLoginDate,
  applyStreakDate,
  createStreakContext,
  getYesterdayStr,
  saveStreakContext,
} from "@/util/streak";
import { getLocalTodayStr } from "@/util/timer";
import {
  addHabitLogs,
  calculatePenaltyEffect,
  getHabitLogs,
  getLastHabitLog,
  getShieldUsedLog,
  generateString as habit_logsGenerateString,
} from "@/database/shema/habit_logs";
import FastEndTimeModal from "@/components/home/FastEndTimeModal";
import useModalStore from "@/stores/modalStore";
import { StreakCheckResult } from "@/interfaces/home.type";
import { StreakCheckModal } from "@/components/home/StreakModal";
import { FastSession, HabitLog, UserProfile } from "@/interfaces/db.type";
import { evaluateFastStatus, MAX_FAST_HOURS } from "@/database/shema/fast_sessions";
import { useAppStore } from "@/stores/appStore";


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
    let modal: {
    type: "finishFast",
    closable: boolean,
  }|undefined = undefined


  // Guard
  if (!profile) {
    return {
      lastFast,
      profile,
      habitLog,
      streak: null,
    };
  }

  // Tạo streak context
  const streak = createStreakContext(profile, habitLog);

  // Chưa có streak -> reset state
  if (!profile.streak_date) {
    applyClearStreak(streak);

    // Login date vẫn được cập nhật
    applyLastLoginDate(streak, todayStr);

    await saveStreakContext(db, streak);

    return {
      lastFast,
      profile: streak.profile,
      habitLog: streak.habitLog,
      streak: null,
    };
  }

  // Mỗi ngày chỉ reconcile một lần
  if (
    profile.streak_date === todayStr ||
    profile.last_login_date === todayStr
  ) {
    return {
      lastFast,
      profile,
      habitLog,
      streak: null,
    };
  }

  
  // Hiện tại không có phiên nhịn nào
  if (!lastFast || lastFast.end_time) {
    const { gap, overRestDays, isStreakSavedByShield, ...data } =
      calculatePenaltyEffect(profile.streak_date, profile, habitLog);
    applyLastLoginDate(streak, todayStr);

    // Không sao cả
    if (gap <= 1) {
      await saveStreakContext(db, streak);

      return {
        lastFast: lastFast,
        profile: streak.profile,
        habitLog: streak.habitLog,
        streak: streak.stats,
      };
    }
    // Có sao, áp dụng biến động
    const returnedHabitLog = await addHabitLogs(db, {
      log_date: todayStr,
      ...data,
    });
    streak.habitLog = returnedHabitLog;
    streak.stats.habit.currentPercent = returnedHabitLog?.habit_snap || 0;
    streak.stats.shield.current = returnedHabitLog?.shield_snap || 0;
    streak.stats.retain.current = returnedHabitLog?.habit_retain || 0;
    applyStreakDate(streak, getYesterdayStr(todayStr));

    // --------------------------------------------------
    // Shield used
    // --------------------------------------------------
    if (data.shieldDelta) {
      streak.profile.total_shield_used =
        (streak.profile.total_shield_used || 0) + Math.abs(data.shieldDelta);
    }

    // --------------------------------------------------
    // 5. Shield saves streak
    // --------------------------------------------------

    if (isStreakSavedByShield) {
      await saveStreakContext(db, streak);

      return {
        lastFast: lastFast,
        profile: streak.profile,
        habitLog: streak.habitLog,
        streak: streak.stats,
      };
    }

    // --------------------------------------------------
    // 6. Streak lost
    // --------------------------------------------------

    applyClearStreak(streak);

    await saveStreakContext(db, streak);

    return {
      lastFast: lastFast,
      profile: streak.profile,
      habitLog: streak.habitLog,
      streak: streak.stats,
    };
  }

  // --------------------------------------------------
  // 1. Evaluate Fast
  // --------------------------------------------------

  const previousLoginDate = profile.last_login_date || profile.streak_date;

  const { isFastFail, referenceDate } = evaluateFastStatus(
    lastFast,
    previousLoginDate,
    todayStr,
  );

  // Đang fasting và chưa fail:
  // chỉ ghi nhận hôm nay đã login.
  if (lastFast && !lastFast.end_time && !isFastFail) {
    applyLastLoginDate(streak, todayStr);

    await saveStreakContext(db, streak);

    return {
      lastFast,
      profile: streak.profile,
      habitLog: streak.habitLog,
      streak: null,
    };
  }

  // --------------------------------------------------
  // 2. Fast fail
  // --------------------------------------------------

  let returnLastFast = lastFast;

  if (isFastFail && lastFast) {
      const duration = Date.now() - lastFast.start_time;
    modal = {
    type: "finishFast",
    closable: duration>MAX_FAST_HOURS *(60*60*1000),
  };
    }

    // returnLastFast = await fastFail(db, lastFast);

  // Login hôm nay đã được xử lý
  applyLastLoginDate(streak, todayStr);
  await saveStreakContext(db, streak);

  return {
    lastFast: returnLastFast,
    profile: streak.profile,
    habitLog: streak.habitLog,
    streak: streak.stats,
    modal
  };
};