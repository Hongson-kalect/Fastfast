import { EMOTION_PACKS } from "@/constants/emotions";
import { TARGET_PACKS } from "@/constants/fasting_targets";
import { useBottomSheet } from "@/providers/BottomSheet";
import { useAppStore } from "@/stores/appStore";
import { usePixelStore } from "@/stores/pixelStore";
import { getContrastTextColor } from "@/utils/color";
import { fixed } from "@/utils/numberLimit";
import { RADIUS } from "@/constants/design";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, View } from "react-native";
import { ThemedText } from "../themed-text";
import { PackPickerBottomSheet } from "./IconPackSheet";

type Props = {
  trackingType: "mood" | "fasting";
  setTrackingType: (mode: "mood" | "fasting") => void;
  stats: {
    fastDays: number;
    fastHour: number;
    logDays: number;
  };

  onSaveImage: () => void;
};
const PixelStatistic = React.memo(
  ({ setTrackingType, trackingType, stats, onSaveImage }: Props) => {
    const { theme, settings } = useAppStore();
    const { counter } = usePixelStore();

    const emotionPack = EMOTION_PACKS[settings?.emotion_pack ?? "default"];

    const targetPack = TARGET_PACKS[settings?.target_pack ?? "default"];

    const emotions = emotionPack.emotions;
    const targets = targetPack.targets;

    const { present } = useBottomSheet();

    const openIconPackSelector = () => {
      present(<PackPickerBottomSheet />);
    };

    const isDark = settings?.is_dark_mode ?? true;

    return (
      <View className="gap-4">
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center gap-2">
            <View className="flex-row items-center gap-0.5">
              <Ionicons
                name="calendar-outline"
                size={12}
                color={theme.primary}
              />
              <ThemedText size="xs" weight="semibold" color="text">
                {stats.fastDays}
              </ThemedText>
              <ThemedText size="xxs" color="text" opacity="medium">
                days
              </ThemedText>
            </View>

            <View className="flex-row items-center gap-1.5">
              <Ionicons name="time-outline" size={12} color={theme.success} />
              <ThemedText size="xs" weight="semibold" color="text">
                {fixed(stats.fastHour)}
              </ThemedText>
              <ThemedText size="xxs" color="text" opacity="medium">
                hours
              </ThemedText>
            </View>

            <View className="flex-row items-center gap-1.5">
              <Ionicons
                name="document-text-outline"
                size={12}
                color={theme.warning}
              />
              <ThemedText size="xs" weight="semibold" color="text">
                {fixed(stats.logDays)}
              </ThemedText>
              <ThemedText size="xxs" color="text" opacity="medium">
                logs
              </ThemedText>
            </View>
          </View>

          <Pressable hitSlop={10} onPress={onSaveImage} className="flex-row items-center justify-center p-2 rounded-xl border border-primary/60 shadow-primary">
            <Ionicons name="save" size={15} color={theme.text} />
          </Pressable>
        </View>

        <View className="flex-row justify-between items-center mt-6">
          <Pressable
            hitSlop={10}
            onPress={openIconPackSelector}
            style={{
              borderRadius: RADIUS.pill,
              backgroundColor: theme.warning + "1F",
            }}
            className="items-center flex-row px-3.5 py-2 gap-2"
          >
            <Ionicons
              name="color-palette-outline"
              size={14}
              color={theme.warning}
            />
            <ThemedText size="xs" weight="bold" color="warning">
              Style
            </ThemedText>
          </Pressable>

          {/* Segmented control dạng viên thuốc */}
          <View
            className="flex-row items-center bg-card p-1"
            style={{
              borderRadius: RADIUS.pill,
              borderWidth: 1,
              borderColor: theme.text + "0F",
            }}
          >
            {(
              [
                { value: "mood", label: "Emotion" },
                { value: "fasting", label: "Fast process" },
              ] as const
            ).map((option) => {
              const active = trackingType === option.value;
              return (
                <Pressable
                  key={option.value}
                  hitSlop={6}
                  onPress={() => setTrackingType(option.value)}
                  className="items-center px-3.5 py-1.5"
                  style={{
                    borderRadius: RADIUS.pill,
                    backgroundColor: active ? theme.primary : "transparent",
                  }}
                >
                  <ThemedText
                    size="xs"
                    weight={active ? "bold" : "medium"}
                    colorHex={
                      active
                        ? getContrastTextColor(theme.primary)
                        : theme.text + "aa"
                    }
                  >
                    {option.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>

        {trackingType === "mood" && (
          <View className="flex-row gap-4 mt-2">
            {emotions.map((item, index) => {
              const moodIndex = index as 0 | 1 | 2 | 3 | 4;
              return (
                <View
                  key={item.label}
                  style={{
                    backgroundColor: isDark
                      ? item.color.dark
                      : item.color.light,
                  }}
                  className="flex-1 rounded-xl px-2 py-1.5"
                >
                  <View className="items-center justify-between">
                    <ThemedText>
                      {item.icon[isDark ? "dark" : "light"]}
                    </ThemedText>
                    <ThemedText size="xs">{counter.mood[moodIndex]}</ThemedText>
                  </View>
                </View>
              );
            })}
          </View>
        )}
        {trackingType === "fasting" && (
          <View className="flex-row gap-2 mt-2">
            {targets.map((item, index) => {
              const targetIndex = index as 0 | 1 | 2 | 3 | 4 | 5 | 6;
              return (
                <View
                  key={item.label}
                  style={{
                    backgroundColor: isDark
                      ? item.color.dark
                      : item.color.light,
                  }}
                  className="flex-1 rounded-xl px-2 py-1.5"
                >
                  <View className="items-center justify-between">
                    <ThemedText>{item.icon}</ThemedText>
                    <ThemedText size="xs">
                      {counter.fast[targetIndex]}
                    </ThemedText>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    );
  },
);

export default PixelStatistic;
