import { ViewMode, WeekItem, YearPixelDataMap } from "@/interfaces/pixel";
import React from "react";
import { View } from "react-native";
import { ThemedText } from "../themed-text";
import DayPixel from "./DayPixel";

const WeekPixel = React.memo(
  ({
    size,
    week,
    todayStr,
    viewMode,
    yearPixelData,
    onSelectDate,
    orientation,
  }: {
    size: number;
    week: WeekItem;
    todayStr: string;
    viewMode: ViewMode;
    yearPixelData: YearPixelDataMap;
    orientation: "vertical" | "horizontal";
    onSelectDate: (date: string) => void;
  }) => {
    if (orientation === "vertical") {
      return (
        <View className="flex-row">
          {/* Week number / month label */}
          <View
            style={{ height: size }}
            className="w-15 pl-1 items-center justify-center"
          >
            {week.isMonthHeader && (
              <View className="absolute -top-2 left-0 -rotate-45">
                <ThemedText size="tiny" color="primary" opacity="full">
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

          {/* Days */}
          <View className="flex-row items-center gap-1">
            {week.days.map((day) => (
              <DayPixel
                size={size}
                key={day.dateString}
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
    }
    return (
      <View>
        {/* Week number / month label */}
        <View
          style={{ width: size }}
          className="h-12 items-center justify-center"
        >
          {week.isMonthHeader && (
            <View className="absolute top-0 left-0">
              <ThemedText size="tiny" color="primary" opacity="full">
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

        {/* Days */}
        <View className="items-center gap-1">
          {week.days.map((day) => (
            <DayPixel
              size={size}
              key={day.dateString}
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

export default WeekPixel;
