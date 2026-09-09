import { ViewMode, WeekItem, YearPixelDataMap } from "@/interfaces/pixel";
import React from "react";
import { View } from "react-native";
import { ThemedText } from "../themed-text";
import DayPixel from "./DayPixel";

const WeekRow = React.memo(
  ({
    week,
    todayStr,
    viewMode,
    yearPixelData,
    onSelectDate,
  }: {
    week: WeekItem;
    todayStr: string;
    viewMode: ViewMode;
    yearPixelData: YearPixelDataMap;
    onSelectDate: (date: string) => void;
  }) => {
    return (
      <View className="flex-row items-center">
        <View className="w-15 pl-1 justify-center items-center">
          {week.isMonthHeader && (
            <View className="absolute -top-2 left-0 -rotate-45">
              <ThemedText className="text-[8px]! text-emerald-400! opacity-100">
                {week.month}
              </ThemedText>
            </View>
          )}

          <ThemedText className="text-center text-[10px]! font-regular text-white/70!">
            {week.weekOfYear}
          </ThemedText>
        </View>

        <View className="flex-1 flex-row justify-between gap-x-1">
          {week.days.map((day, dIdx) => (
            <DayPixel
              key={dIdx}
              day={day}
              todayStr={todayStr}
              viewMode={viewMode}
              pixelData={yearPixelData[day.dateString]}
              onPress={onSelectDate}
            />
          ))}
        </View>
      </View>
    );
  },
);

export default WeekRow;