import { CHART_RANGES, ChartRangeKey } from "@/constants/data";
import {
  differenceInCalendarDays,
  differenceInHours,
  differenceInMinutes,
  differenceInSeconds,
  format,
  getISOWeek,
  isToday,
  isTomorrow,
  isYesterday,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns";

export const timeString = (time: number) => {
  const timeCheck = time;
  const seconds = timeCheck % 60;
  const minutes = Math.floor(timeCheck / 60) % 60;
  const hours = Math.floor(timeCheck / 60 / 60);
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

export const getLocalTodayStr = (
  dateParam?: Date | number,
): string => {
  const date = new Date(dateParam ?? Date.now());

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const hourFormat = (duration: number) => {
  const timeCheck = Math.floor(duration / 1);
  const hours = Math.floor(timeCheck / 60 / 60);
  const minutes = Math.floor(timeCheck / 60) % 60;
  const seconds = timeCheck % 60;
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

export const getRelativeDate = (targetDate: Date, showHour = true): string => {
  const timeStr = format(targetDate, "HH:mm");
  const diffDays = differenceInCalendarDays(targetDate, new Date());
  if (isToday(targetDate)) {
    return `${showHour ? timeStr + " " : ""}Hôm nay`;
  }
  if (isTomorrow(targetDate)) {
    return `${showHour ? timeStr + " " : ""}Ngày mai`;
  }
  if (isYesterday(targetDate)) {
    return `${showHour ? timeStr + " " : ""}Hôm qua`;
  }
  if (diffDays > 0 && diffDays === 2) {
    return `${showHour ? timeStr + " " : ""}Ngày kia`;
  }
  if (diffDays < 0 && diffDays === -2) {
    return `${showHour ? timeStr + " " : ""}2 ngày trước`;
  }
  if (diffDays > 0) {
    return `${showHour ? timeStr + " " : ""}${diffDays} ngày sau`;
  }
  return `${showHour ? timeStr + " " : ""}${Math.abs(diffDays)} ngày trước`;
};

export const getRelativeTime = (targetDate: Date, showHour = true): string => {
  const now = new Date();
  const timeStr = format(targetDate, "HH:mm");

  const diffSeconds = differenceInSeconds(now, targetDate);
  const diffMinutes = differenceInMinutes(now, targetDate);
  const diffHours = differenceInHours(now, targetDate);
  const diffDays = differenceInCalendarDays(targetDate, now);

  const prefix = showHour ? `${timeStr} ` : "";

  // Trong khoảng 24 giờ: hiển thị thời gian tương đối
  if (Math.abs(diffSeconds) < 60) {
    if (diffSeconds === 0) return "Vừa xong";

    return diffSeconds > 0
      ? `${diffSeconds} giây trước`
      : `Sau ${Math.abs(diffSeconds)} giây`;
  }

  if (Math.abs(diffMinutes) < 60) {
    return diffMinutes > 0
      ? `${diffMinutes} phút trước`
      : `Sau ${Math.abs(diffMinutes)} phút`;
  }

  if (Math.abs(diffHours) < 24) {
    return diffHours > 0
      ? `${diffHours} giờ trước`
      : `Sau ${Math.abs(diffHours)} giờ`;
  }

  // Từ đây trở đi dùng ngày
  if (isToday(targetDate)) {
    return `${prefix}Hôm nay`;
  }

  if (isTomorrow(targetDate)) {
    return `${prefix}Ngày mai`;
  }

  if (isYesterday(targetDate)) {
    return `${prefix}Hôm qua`;
  }

  if (diffDays === 2) {
    return `${prefix}Ngày kia`;
  }

  if (diffDays === -2) {
    return `${prefix}2 ngày trước`;
  }

  if (diffDays > 0) {
    return `${prefix}${diffDays} ngày sau`;
  }

  return `${prefix}${Math.abs(diffDays)} ngày trước`;
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
