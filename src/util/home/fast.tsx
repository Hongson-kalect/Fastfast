import FullHabitModal from "@/components/home/FullHabitModal";
import { FastResultData, ResultModal } from "@/components/home/ResultModal";
import { checkAchievements } from "@/constants/achievements";
import { createDBService } from "@/database";
import {
  MIN_FAST_DURATION,
  TOO_QUICK_DURATION,
} from "@/database/shema/fast_sessions";
import { SHIELD_LIMIT } from "@/database/shema/habit_logs";
import { FastSession } from "@/interfaces/db.type";
import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import { checkStreak } from "./checkStreak";
import { splitSessionIntoDays } from "./timespliter";
import { FASTING_TARGETS, processData } from "@/constants/data";

type FinishFastProps = {
  dbService: ReturnType<typeof createDBService>;
  currentFast: FastSession;
  endTime: number;
};
export const finishFast = async ({
  dbService,
  currentFast,
  endTime,
}: FinishFastProps) => {
  const { userProfile, updateProfile, setCurrentFastSession, updateHabit } =
    useAppStore.getState();

  if (!userProfile) return;
  const { addModal } = useModalStore.getState();

  const duration = Math.floor(
    Math.abs(endTime - currentFast?.start_time) / 1000,
  );
  const isTooFast = duration < TOO_QUICK_DURATION;
  const isValid = duration > MIN_FAST_DURATION;
  const { result, achievement } = await dbService?.finishLastSession({
    id: currentFast?.id,
    endTime,
  });

  const { lastSession, habitLog, profile, streak } = result;
  console.log("finishFast", { profile, habitLog, streak, lastSession });

  // update zustand
  const tempProfile = { ...userProfile!, ...profile! };
  if (userProfile && profile) {
    updateProfile({
      ...userProfile,
      ...profile,
    });
  }

  setCurrentFastSession(lastSession || null);
  if (achievement) {
    const { milestones, progresses } = await checkAchievements(
      dbService,
      userProfile.id,
      achievement,
    );

    if (milestones.length) {
      await dbService.updateMileStones(milestones);
    }

    if (progresses.length) {
      await dbService.updateUserAchievements(progresses);
    }
  }

  // Nhập dữ liệu modal result: habit -> ok, lastSession -> duration, target -> ok

  if (!isValid || !lastSession || !habitLog) return;
  const resultData: FastResultData = {
    fastingTime: lastSession?.duration,
    habitDiff: habitLog?.habit_delta || 0,
    habitPercent: habitLog?.habit_snap,
    shields: {
      current: habitLog?.shield_snap,
      max: SHIELD_LIMIT,
      gained: habitLog?.shield_delta || 0,
      detail: habitLog?.shield_detail
        ? JSON.parse(habitLog?.shield_detail)
        : null,
    },
    retainCount: habitLog?.habit_retain || 0,
    retainDiff: habitLog?.retain_delta || 0,
    targetHours: lastSession?.target_duration || null,
    note: habitLog?.description,
  };

  console.log("result data", resultData, habitLog, lastSession);

  addModal({
    type: "custom",
    render: <ResultModal data={resultData} />,
  });

  // Đạt được 100 snap thông báo
  if (habitLog?.habit_snap === 100 && !habitLog?.habit_retain) {
    addModal({
      type: "custom",
      render: <FullHabitModal habitName="Fast" />,
    });
  }

  if (isValid) {
    const parsedDays = splitSessionIntoDays(
      currentFast.start_time,
      endTime,
      currentFast.id,
    );
    console.log(parsedDays.map((x) => x.log_date));

    for (const dayData of parsedDays) {
      await dbService?.addDailyLogs({
        log_date: dayData.log_date,
        fast_id: currentFast.id,
        hours_in_day: dayData.hours_in_day,
        elapsed_times: dayData.elapsed_hours,
        hour_in_fast: parseFloat((duration / 60 / 60).toFixed(1)),
        // user_id, mood_level, note có thể bổ sung tùy thuộc form điền sau khi nhịn
      });
    }
  }
  if (habitLog) {
    updateHabit(habitLog);
  }

  const {
    habitLog: finalHabitLog,
    profile: finalProfile,
    streak: finalStreak,
  } = await dbService.reconcileStreak({
    lastFast: lastSession,
    profile: tempProfile,
    habitLog,
  });

  if (finalProfile) {
    updateProfile({
      ...tempProfile,
      ...finalProfile,
    });
  }

  if (finalHabitLog) updateHabit(finalHabitLog);

  console.log("reconcile", finalHabitLog, finalProfile, finalStreak);

  finalStreak && checkStreak(finalStreak);
};

export const getProcessProgress = (
  counter: number,
  process: typeof processData[number]["process"],
) => {
  const hours = counter / 3_600;

  for (let i = 0; i < process.length; i++) {
    const item = process[i];

    if (hours < item.hours) {
      return {
        activeProcess: null,
        percentage: 0,
        startOn: item.hours * 3_600,
      };
    }

    const nextItem = process[i + 1];

    if (!nextItem || nextItem.hours > hours) {
      return {
        activeProcess: item,
        percentage: nextItem
          ? ((hours - item.hours) /
              (nextItem.hours - item.hours)) *
            100
          : 100,
        startOn: 0,
      };
    }
  }

  return {
    activeProcess: process[process.length - 1],
    percentage: 100,
    startOn: 0,
  };
};

export const getTargetInfo = (hour?: number) => {
  if (!hour || FASTING_TARGETS.length === 0) return null;

  const index = FASTING_TARGETS.findIndex(
    (item) => item.hours > hour,
  );

  if (index === -1) return FASTING_TARGETS.at(-1);
  if (index === 0) return FASTING_TARGETS[0];

  return FASTING_TARGETS[index - 1];
}
