import { ChartRangeConfig, MONTHS } from "@/constants/data";
import { getMonth, getWeek } from "date-fns";
import { getLocalTodayStr, getStartDateFromRange } from "../timer";
import { DailyLog, DailyNote, FastSession, HabitLog } from "@/interfaces/db.type";
import { DailyPixelData, PixelStats, YearPixelDataMap } from "@/interfaces/pixel";
import { DissectedDay, splitSessionIntoDays } from "../home/timespliter";

export const getBucketKey = (
  date: Date,
  unit: ChartRangeConfig["unit"],
) => {
  switch (unit) {
    case "day":
      return getLocalTodayStr(date);

    case "week":
      return `${getWeek(date)}-${date.getFullYear()}`;

    case "month":
      return `${MONTHS[getMonth(date)]}-${date.getFullYear()}`;
  }
};

export const initChartData = (chartRange: ChartRangeConfig) => {
  const start = getStartDateFromRange(chartRange.key);
  const dayPointer = new Date(start);

  const res = [];

  for (let i = 0; i < chartRange.value; i++) {
    const date = getLocalTodayStr(dayPointer);

    if (chartRange.unit === "day") {
      res.push({
        key: getBucketKey(dayPointer, "day"),
        x: date.slice(5),
        weight: 0,
        fast: 0,
        date,
      });

      dayPointer.setDate(dayPointer.getDate() + 1);
      continue;
    }

    if (chartRange.unit === "week") {
      res.push({
        key: getBucketKey(dayPointer, "week"),
        x: `Week ${getWeek(dayPointer)}`,
        weight: 0,
        fast: 0,
        date,
      });

      dayPointer.setDate(dayPointer.getDate() + 7);
      continue;
    }

    res.push({
      key: getBucketKey(dayPointer, "month"),
      x: MONTHS[getMonth(dayPointer)],
      weight: 0,
      fast: 0,
      date,
    });

    // Tránh Jan 31 -> Mar 03 khi chuyển tháng.
    dayPointer.setDate(1);
    dayPointer.setMonth(dayPointer.getMonth() + 1);
  }

  return res;
};

type BuildPixelYearDataParams = {
  logs: DailyLog[];
  notes: DailyNote[];
  shieldUsed: HabitLog[];
  currentFastSession?: FastSession | null;
};
export const buildPixelYearData = ({
  logs,
  notes,
  shieldUsed,
  currentFastSession,
}: BuildPixelYearDataParams) => {
  const yearMap: YearPixelDataMap = {};
  const newStats: PixelStats = { fastDays: 0, fastHour: 0, logDays: 0 };

  const getOrCreateDayNode = (dateStr: string): DailyPixelData => {
    if (!yearMap[dateStr]) {
      yearMap[dateStr] = { logs: [], totalHours: 0 };
    }
    return yearMap[dateStr];
  };

  // 1. Process Notes
  notes.forEach((note) => {
    const dayNode = getOrCreateDayNode(note.log_date);
    dayNode.note = note;
    newStats.logDays += 1;
  });

  // 2. Process Logs
  const appendFastLog = (log: DailyLog | DissectedDay) => {
    const dayNode = getOrCreateDayNode(log.log_date);
    if (dayNode.logs.length === 0) {
      newStats.fastDays += 1;
    }
    dayNode.logs.push(log);
    dayNode.totalHours += log.hours_in_day;
    newStats.fastHour += log.hours_in_day;
  };

  logs.forEach(appendFastLog);

  // Process active session
  if (currentFastSession && !currentFastSession?.end_time) {
    const parsedDays = splitSessionIntoDays(
      currentFastSession.start_time,
      Math.floor(Date.now()),
      currentFastSession.id,
    );
    parsedDays.forEach(appendFastLog);
  }

  // 3. Process Shields
  shieldUsed.forEach((log) => {
    let shields = Math.abs(log.shield_delta || 0);
    const [y, m, d] = log.log_date.split("-").map(Number);
    const pointerDate = new Date(Date.UTC(y, m - 1, d));

    while (shields > 0) {
      pointerDate.setUTCDate(pointerDate.getUTCDate() - 1);
      const dateStr = pointerDate.toISOString().split("T")[0];

      const dayNode = getOrCreateDayNode(dateStr);
      dayNode.shieldLog = log;
      shields -= 1;
    }
  });

  return { yearMap, stats: newStats };
};
