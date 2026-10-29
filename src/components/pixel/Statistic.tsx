import { useDBService } from "@/hooks/useDBService";
import { useSwitchFade } from "@/hooks/useSwitchFade";
import { useBottomSheet } from "@/providers/BottomSheet";
import { useAppStore } from "@/stores/appStore";
import { getContrastTextColor } from "@/utils/color";
import { fixed } from "@/utils/numberLimit";
import { RADIUS } from "@/constants/design";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import Animated from "react-native-reanimated";
import { ThemedText } from "../themed-text";
import { PackPickerBottomSheet } from "./IconPackSheet";
import PixelLegend from "./PixelLegend";
import { useT } from "@/providers/Language";

type Props = {
  trackingType: "mood" | "fasting";
  setTrackingType: (mode: "mood" | "fasting") => void;
  stats: {
    fastDays: number;
    fastHour: number;
    logDays: number;
  };

  onSaveImage: () => void;
  isSavingImage?: boolean;
};
const PixelStatistic = React.memo(
  ({ setTrackingType, trackingType, stats, onSaveImage, isSavingImage }: Props) => {
  const t = useT();
    const theme = useAppStore((state) => state.theme);
    const heatmap = useAppStore((state) => state.settings?.pixel_heatmap ?? false);
    const updateSetting = useAppStore((state) => state.updateSetting);
    const dbService = useDBService();
    const legendFade = useSwitchFade(`${trackingType}-${heatmap}`);

    const toggleHeatmap = () => {
      updateSetting({ pixel_heatmap: !heatmap });
      dbService.setting("pixel_heatmap", !heatmap);
    };

    const { present } = useBottomSheet();

    const openIconPackSelector = () => {
      present(<PackPickerBottomSheet />);
    };

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
                {t("journey.stat.days", { count: stats.fastDays })}
              </ThemedText>
            </View>

            <View className="flex-row items-center gap-1.5">
              <Ionicons name="time-outline" size={12} color={theme.success} />
              <ThemedText size="xs" weight="semibold" color="text">
                {fixed(stats.fastHour)}
              </ThemedText>
              <ThemedText size="xxs" color="text" opacity="medium">
                {t("journey.stat.hours", { count: Math.round(stats.fastHour) })}
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
                {t("journey.stat.logs", { count: stats.logDays })}
              </ThemedText>
            </View>
          </View>

          <Pressable
            hitSlop={10}
            onPress={onSaveImage}
            // Vẽ + chụp cả năm mất vài giây: khoá nút để không bấm chồng
            disabled={isSavingImage}
            style={{
              borderRadius: RADIUS.pill,
              backgroundColor: theme.primary + "1F",
              opacity: isSavingImage ? 0.6 : 1,
            }}
            className="items-center flex-row px-3.5 py-2 gap-1.5"
          >
            {isSavingImage ? (
              <ActivityIndicator size={14} color={theme.primary} />
            ) : (
              <Ionicons name="image-outline" size={14} color={theme.primary} />
            )}
            <ThemedText size="xs" weight="bold" color="primary">
              {t("journey.saveImage")}
            </ThemedText>
          </Pressable>
        </View>

        <View className="flex-row justify-between items-center mt-6">
          <View className="flex-row items-center gap-2">
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
              {t("journey.style")}
            </ThemedText>
          </Pressable>

          {/* Chỉ chế độ fast: tô theo tổng giờ nhịn trong ngày thay vì loại phiên */}
          {trackingType === "fasting" && (
            // Chỉ icon: hàng này còn nút Style và Mood | Fast, chữ dài (ja, de…) sẽ tràn
            <Pressable
              hitSlop={8}
              onPress={toggleHeatmap}
              accessibilityRole="switch"
              accessibilityState={{ checked: heatmap }}
              accessibilityLabel={t("journey.heatmap")}
              style={{
                borderRadius: RADIUS.pill,
                backgroundColor: heatmap ? theme.primary : theme.primary + "1F",
              }}
              className="h-9 w-9 items-center justify-center"
            >
              <Ionicons
                name="grid-outline"
                size={15}
                color={heatmap ? getContrastTextColor(theme.primary) : theme.primary}
              />
            </Pressable>
          )}
          </View>

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
                { value: "mood", label: t("journey.mode.mood") },
                { value: "fasting", label: t("journey.mode.fasting") },
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

        <Animated.View className="mt-2" style={legendFade}>
          <PixelLegend viewMode={trackingType} />
        </Animated.View>
      </View>
    );
  },
);

export default PixelStatistic;
