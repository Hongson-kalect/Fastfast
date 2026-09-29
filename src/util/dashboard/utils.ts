import { ChartRangeConfig, MONTHS } from "@/constants/data";
import { getMonth, getWeek } from "date-fns";
import { getLocalTodayStr, getStartDateFromRange } from "../timer";

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
