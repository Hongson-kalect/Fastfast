import { ChartRangeConfig, MONTHS } from "@/constants/data";
import { getLocalTodayStr, getStartDateFromRange } from "../timer";
import { getMonth, getWeek } from "date-fns";

export const getBucketKey = (date: Date, unit: ChartRangeConfig["unit"]) => {
  switch (unit) {
    case "day":
      return getLocalTodayStr(date);

    case "week":
      return `${getWeek(date)}-${date.getFullYear()}`;

    case "month":
      return `${MONTHS[getMonth(date)]}-${date.getFullYear()}`;
  }
};

export const initChartData = (chart_range: ChartRangeConfig) => {
  const start = getStartDateFromRange(chart_range.key);
  const dayPointer = start;
  const res = [];

  if (chart_range.unit === "day") {
    for (let i = 0; i < chart_range.value; i++) {
      const day = getLocalTodayStr(dayPointer);
      res.push({
        key: getBucketKey(dayPointer, chart_range.unit),
        x: day.slice(5),
        y: 0,
      });
      dayPointer.setDate(dayPointer.getDate() + 1);
    }
    return res;
  }

  if (chart_range.unit === "week") {
    for (let i = 0; i < chart_range.value; i++) {
      res.push({
        key: getBucketKey(dayPointer, chart_range.unit),
        x: "Week " + getWeek(dayPointer),
        y: 0,
      });
      dayPointer.setDate(dayPointer.getDate() + 7);
    }
    return res;
  }
  for (let i = 0; i < chart_range.value; i++) {
    res.push({
      key: getBucketKey(dayPointer, chart_range.unit),
      x: MONTHS[getMonth(dayPointer)],
      y: 0,
    });
    dayPointer.setMonth(dayPointer.getMonth() + 1);
  }
  return res;
};