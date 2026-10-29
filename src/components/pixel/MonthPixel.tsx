import { ViewMode, YearPixelDataMap } from "@/interfaces/pixel";
import React from "react";
import { View } from "react-native";
import { ThemedText } from "../themed-text";
import DayPixel from "./DayPixel";

export const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// Lưới tháng có 12 ô/hàng nên ô nhỏ hơn lưới tuần: gap hẹp hơn gap-1 (4px)
export const MONTH_GAP = 2;

// Một "hàng" của layout tháng: cùng một ngày (1–31) ở cả 12 tháng
export type MonthDayItem = { day: number };

export const generateMonthGrid = (): MonthDayItem[] =>
  Array.from({ length: 31 }, (_, i) => ({ day: i + 1 }));

const daysInMonth = (year: number, month: number) =>
  new Date(year, month + 1, 0).getDate();

const MonthPixel = React.memo(
  ({
    size,
    item,
    year,
    todayStr,
    viewMode,
    yearPixelData,
    onSelectDate,
    orientation,
  }: {
    size: number;
    item: MonthDayItem;
    year: number;
    todayStr: string;
    viewMode: ViewMode;
    yearPixelData: YearPixelDataMap;
    orientation: "vertical" | "horizontal";
    onSelectDate: (date: string) => void;
  }) => {
    const cells = MONTH_LABELS.map((label, month) => {
      // Tháng không có ngày này (VD 30/02) → ô trống giữ chỗ
      if (item.day > daysInMonth(year, month)) {
        return <View key={label} style={{ width: size, height: size }} />;
      }

      const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(item.day).padStart(2, "0")}`;

      return (
        <DayPixel
          key={label}
          size={size}
          day={{ dateString, dayOfMonth: item.day, isCurrentYear: true }}
          todayStr={todayStr}
          viewMode={viewMode}
          pixelData={yearPixelData[dateString]}
          onPress={onSelectDate}
        />
      );
    });

    const label = (
      <ThemedText
        size="xxs"
        weight="regular"
        color="text"
        opacity="medium"
        style={{ textAlign: "center" }}
      >
        {item.day}
      </ThemedText>
    );

    if (orientation === "vertical") {
      return (
        <View className="flex-row">
          <View
            style={{ height: size }}
            className="w-15 items-center justify-center"
          >
            {label}
          </View>
          <View className="flex-row" style={{ gap: MONTH_GAP }}>
            {cells}
          </View>
        </View>
      );
    }

    return (
      <View>
        <View
          style={{ width: size }}
          className="h-12 items-center justify-center"
        >
          {label}
        </View>
        <View style={{ gap: MONTH_GAP }}>{cells}</View>
      </View>
    );
  },
);

export default MonthPixel;
