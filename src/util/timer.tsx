import { CHART_RANGES, ChartRangeKey } from "@/constants/data";
import {
  differenceInCalendarDays,
  format,
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
  const timeCheck = Math.floor(time / 1000);
  const seconds = timeCheck % 60;
  const minutes = Math.floor(timeCheck / 60) % 60;
  const hours = Math.floor(timeCheck / 60 / 60);
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

export const getLocalTodayStr = (dateParam?: Date | number): string => {
  const date = new Date(dateParam || Date.now());
  const year = date.getFullYear();
  // getMonth() trả về từ 0-11 nên phải +1, sau đó padStart để đảm bảo có 2 chữ số
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`; // Kết quả: "2026-07-09"
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
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  // ISO week
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );

  return week;
};

export const getRelativeTime = (targetDate: Date): string => {
  const timeStr = format(targetDate, "HH:mm");
  const diffDays = differenceInCalendarDays(targetDate, new Date());
  if (isToday(targetDate)) {
    return `${timeStr} Hôm nay`;
  }
  if (isTomorrow(targetDate)) {
    return `${timeStr} Ngày mai`;
  }
  if (isYesterday(targetDate)) {
    return `${timeStr} Hôm qua`;
  }
  if (diffDays > 0 && diffDays === 2) {
    return `${timeStr} Ngày kia`;
  }
  if (diffDays < 0 && diffDays === -2) {
    return `${timeStr} 2 ngày trước`;
  }
  if (diffDays > 0) {
    return `${timeStr} ${diffDays} ngày sau`;
  }
  return `${timeStr} ${Math.abs(diffDays)} ngày trước`;
};
