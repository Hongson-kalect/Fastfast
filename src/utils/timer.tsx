import { CHART_RANGES, ChartRangeKey } from "@/constants/data";
import {
  differenceInCalendarDays,
  differenceInHours,
  differenceInMinutes,
  differenceInSeconds,
  format,
  getISOWeek,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns";
import i18n from "i18next";

export const timeString = (time: number) => {
  const timeCheck = time;
  const seconds = timeCheck % 60;
  const minutes = Math.floor(timeCheck / 60) % 60;
  const hours = Math.floor(timeCheck / 60 / 60);
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

/**
 * "YYYY-MM-DD" → Date lúc 00:00 giờ địa phương. Không dùng new Date("YYYY-MM-DD"):
 * chuỗi đó được hiểu là 00:00 UTC, ở múi giờ âm (châu Mỹ) sẽ thành ngày hôm trước.
 */
export const parseLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
};

export const getLocalTodayStr = (dateParam?: Date | number): string => {
  const date = new Date(dateParam ?? Date.now());

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const hourFormat = (duration: number, isLong = false) => {
  const timeCheck = Math.floor(duration / 1);
  const hours = Math.floor(timeCheck / 60 / 60);
  const minutes = Math.floor(timeCheck / 60) % 60;
  if (!hours) {
    if (isLong) return `${minutes.toString().padStart(2, "0")}Minutes`;
    return `${minutes.toString().padStart(2, "0")}m`;
  }
  if (isLong)
    return `${hours.toString().padStart(2, "0")}Hours ${minutes.toString().padStart(2, "0")}Minutes`;
  return `${hours.toString().padStart(2, "0")}h ${minutes.toString().padStart(2, "0")}m`;
};

export const getStartDateFromRange = (
  key: ChartRangeKey,
  referenceDate = new Date(),
): Date => {
  const config = CHART_RANGES.find((r) => r.key === key) || CHART_RANGES[0];

  switch (config.unit) {
    case "day":
      // Lùi đúng N ngày tính từ hôm nay
      return subDays(referenceDate, config.value - 1);

    case "week": {
      // Lùi N tuần, sau đó neo vào đúng Thứ 2 của tuần đó (weekStartsOn: 1)
      const targetWeek = subWeeks(referenceDate, config.value - 1);
      return startOfWeek(targetWeek, { weekStartsOn: 1 });
    }

    case "month": {
      // Lùi N tháng, sau đó neo vào ngày đầu tiên của tháng đó (ngày 1)
      const targetMonth = subMonths(referenceDate, config.value - 1);
      return startOfMonth(targetMonth);
    }
  }
};

export const getWeek = (date: Date) => {
  return getISOWeek(date);
};

// Ngày tương đối so với hôm nay: "Hôm nay", "Ngày mai", "3 ngày trước"...
const relativeDay = (diffDays: number) => {
  if (diffDays === 0) return i18n.t("time.today");
  if (diffDays === 1) return i18n.t("time.tomorrow");
  if (diffDays === -1) return i18n.t("time.yesterday");
  if (diffDays === 2) return i18n.t("time.dayAfterTomorrow");
  return diffDays > 0
    ? i18n.t("time.daysLater", { count: diffDays })
    : i18n.t("time.daysAgo", { count: -diffDays });
};

export const getRelativeDate = (targetDate: Date, showHour = true): string => {
  const prefix = showHour ? `${format(targetDate, "HH:mm")} ` : "";
  return prefix + relativeDay(differenceInCalendarDays(targetDate, new Date()));
};

export const getRelativeTime = (targetDate: Date, showHour = true): string => {
  const now = new Date();

  const diffSeconds = differenceInSeconds(now, targetDate);
  const diffMinutes = differenceInMinutes(now, targetDate);
  const diffHours = differenceInHours(now, targetDate);

  // Trong khoảng 24 giờ: hiển thị thời gian tương đối
  if (Math.abs(diffSeconds) < 60) {
    if (diffSeconds === 0) return i18n.t("time.justNow");
    return diffSeconds > 0
      ? i18n.t("time.secondsAgo", { count: diffSeconds })
      : i18n.t("time.inSeconds", { count: -diffSeconds });
  }

  if (Math.abs(diffMinutes) < 60) {
    return diffMinutes > 0
      ? i18n.t("time.minutesAgo", { count: diffMinutes })
      : i18n.t("time.inMinutes", { count: -diffMinutes });
  }

  if (Math.abs(diffHours) < 24) {
    return diffHours > 0
      ? i18n.t("time.hoursAgo", { count: diffHours })
      : i18n.t("time.inHours", { count: -diffHours });
  }

  // Từ đây trở đi dùng ngày
  return getRelativeDate(targetDate, showHour);
};

const pad = (value: number) => String(value).padStart(2, "0");

export const formatHour = (hour: number) => {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);

  if (m === 60) {
    return `${pad((h + 1) % 24)}:00`;
  }

  return `${pad(h % 24)}:${pad(m)}`;
};

// Helper tính khoảng cách số ngày giữa 2 chuỗi 'YYYY-MM-DD' (Tránh lỗi timezone)
export const getDaysDiff = (fromStr: string, toStr: string): number => {
  const d1 = new Date(`${fromStr}T00:00:00Z`);
  const d2 = new Date(`${toStr}T00:00:00Z`);
  const diffTime = d2.getTime() - d1.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};
