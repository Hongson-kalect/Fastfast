import { EMOTION_PACKS } from "@/constants/emotions";
import { TARGET_PACKS } from "@/constants/fasting_targets";
import { useBottomSheet } from "@/provider/BottomSheet";
import { useAppStore } from "@/stores/appStore";
import { fixed } from "@/util/numberLimit";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, View } from "react-native";
import { ThemedText } from "../themed-text";
import { PackPickerBottomSheet } from "./IconPackSheet";

const moodCount = [102, 25, 5, 2, 0, 10, 10];

type Props = {
  trackingType: "mood" | "fasting";
  setTrackingType: (mode: "mood" | "fasting") => void;
  stats: {
    fastDays: number;
    fastHour: number;
    logDays: number;
  };
};
const PixelStatistic = React.memo(({ setTrackingType, trackingType, stats }: Props) => {
  const { theme, settings } = useAppStore();

 const emotionPack =
  EMOTION_PACKS[settings?.emotion_pack ?? "default"];

const targetPack =
  TARGET_PACKS[settings?.target_pack ?? "default"];

const emotions = emotionPack.emotions;
const targets = targetPack.targets;

  const { present } = useBottomSheet();

  const openIconPackSelector = () => {
    present(<PackPickerBottomSheet />);
  };

  const isDark = settings?.is_dark_mode ?? true;

  return (
    <View className="gap-4">
      <View className="flex-row items-center gap-4">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="calendar-outline" size={15} color={theme.primary} />
          <ThemedText size="sm" weight="semibold" color="text">
            {stats.fastDays}
          </ThemedText>
          <ThemedText size="xs" color="text" opacity="medium">
            days
          </ThemedText>
        </View>

        <View className="flex-row items-center gap-1.5">
          <Ionicons name="time-outline" size={15} color={theme.success} />
          <ThemedText size="sm" weight="semibold" color="text">
            {fixed(stats.fastHour)}
          </ThemedText>
          <ThemedText size="xs" color="text" opacity="medium">
            hours
          </ThemedText>
        </View>

        <View className="flex-row items-center gap-1.5">
          <Ionicons
            name="document-text-outline"
            size={15}
            color={theme.warning}
          />
          <ThemedText size="sm" weight="semibold" color="text">
            {fixed(stats.logDays)}
          </ThemedText>
          <ThemedText size="xs" color="text" opacity="medium">
            logs
          </ThemedText>
        </View>
      </View>

      <View className="flex-row justify-between items-center mt-8">
        <Pressable
          hitSlop={10}
          onPress={openIconPackSelector}
          style={{ borderWidth: 0.5, borderColor: theme.warning }}
          className="items-center flex-row px-3 py-1.5 rounded-lg gap-2"
        >
          <ThemedText size="xs" color="warning">
            Style
          </ThemedText>
          <Ionicons
            name="color-palette-outline"
            size={14}
            color={theme.warning}
          />
        </Pressable>

        <View className="flex-row items-center gap-1">
          <Pressable
            hitSlop={10}
            style={{
              borderWidth: 0.5,
              borderColor:
                trackingType === "mood" ? theme.primary : theme.text + "80",
            }}
            onPress={() => setTrackingType("mood")}
            className={`items-center px-3 py-2 ${
              trackingType === "mood" ? "bg-primary" : "bg-background/60"
            } rounded-lg`}
          >
            <ThemedText
              size="xs"
              weight="medium"
              colorHex={trackingType === "mood" ? "#FFFFFF" : theme.text + "aa"}
            >
              Emotion
            </ThemedText>
          </Pressable>

          <Pressable
            hitSlop={10}
            style={{
              borderWidth: 0.5,
              borderColor:
                trackingType === "fasting" ? theme.primary : theme.text + "80",
            }}
            onPress={() => setTrackingType("fasting")}
            className={`items-center px-3 py-2 ${
              trackingType === "fasting" ? "bg-primary" : "bg-background/60"
            } rounded-lg`}
          >
            <ThemedText
              size="xs"
              weight="medium"
              colorHex={
                trackingType === "fasting" ? "#FFFFFF" : theme.text + "aa"
              }
            >
              Fast process
            </ThemedText>
          </Pressable>
        </View>
      </View>

      {trackingType === "mood" && (
        <View className="flex-row gap-4 mt-2">
          {emotions.map((item, index) => (
            <View
              key={item.label}
              style={{
                backgroundColor: isDark ? item.color.dark : item.color.light,
              }}
              className="flex-1 px-2 py-1 rounded"
            >
              <View className="items-center justify-between">
                <ThemedText>{item.icon}</ThemedText>
                <ThemedText size="xs">{moodCount[index || 0]}</ThemedText>
              </View>
            </View>
          ))}
        </View>
      )}
      {trackingType === "fasting" && (
        <View className="flex-row gap-2 mt-2">
          {targets.map((item, index) => (
            <View
              key={item.label}
              style={{
                backgroundColor: isDark ? item.color.dark : item.color.light,
              }}
              className="flex-1 px-2 py-1 rounded"
            >
              <View className="items-center justify-between">
                <ThemedText>{item.icon}</ThemedText>
                <ThemedText size="xs">{moodCount[index || 0]}</ThemedText>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
})

export default PixelStatistic;
