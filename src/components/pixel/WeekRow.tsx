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
        <View className="w-15 pl-1 items-center justify-center">
          {week.isMonthHeader && (
            <View className="absolute -top-2 left-0 -rotate-45">
              <ThemedText size="tiny" color="primary" opacity="full" style={{}}>
                {week.month}
              </ThemedText>
            </View>
          )}

          <ThemedText
            size="xxs"
            weight="regular"
            color="text"
            opacity="medium"
            style={{ textAlign: "center" }}
          >
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
