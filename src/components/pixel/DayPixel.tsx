import { FASTING_TARGETS } from "@/constants/data";
import { EMOTION_PACKS } from "@/constants/emotions";
import { TARGET_PACKS } from "@/constants/fasting_targets";
import { DailyPixelData, DayItem, ViewMode } from "@/interfaces/pixel";
import { useAppStore } from "@/stores/appStore";
import { FontAwesome5 } from "@expo/vector-icons";
import { memo, ReactNode } from "react";
import { Pressable, View } from "react-native";
import { ThemedText } from "../themed-text";

const DayPixel = memo(
  ({
    day,
    pixelData,
    todayStr,
    viewMode,
    onPress,
  }: {
    day: DayItem;
    pixelData?: DailyPixelData;
    todayStr: string;
    viewMode: ViewMode;
    onPress: (date: string) => void;
  }) => {
    const theme = useAppStore((state) => state.theme);
    const settings = useAppStore((state) => state.settings);
    const isDark = settings?.is_dark_mode ?? true;

    const isToday = day.dateString === todayStr;

    let emoji: string | ReactNode;
    let backgroundColor = "transparent";
    let opacity = 1;
    let icon: React.ReactNode = null;
    let pressable = false;

    /*
     * Ngày trong tương lai
     */
    if (day.dateString > todayStr) {
      return (
        <View className="flex-1 aspect-square items-center justify-center rounded-md border border-text-base/5" />
      );
    }

    /*
     * Không có dữ liệu
     */
    if (!pixelData) {
      return (
        <View
          style={{
            boxShadow: isToday ? `0 0 0 1px ${theme.primary}80` : undefined,
          }}
          className="flex-1 aspect-square items-center justify-center rounded-md border border-text-base/5"
        />
      );
    }

    /*
     * MOOD
     */
    if (viewMode === "mood") {
      if (pixelData.note) {
        const emotionPack = EMOTION_PACKS[settings?.target_pack || "default"];
        const mood = emotionPack.emotions[pixelData.note.mood_level || 0];

        emoji = mood.icon;
        backgroundColor = isDark ? mood.color.dark : mood.color.light;
        pressable = true;
      }
    } else {
      /*
       * FAST
       */

      /*
       * Không có log fasting
       */
      if (!pixelData.logs.length) {
        if (pixelData.shieldLog) {
          icon = (
            <FontAwesome5 name="shield-alt" size={14} color={theme.primary} />
          );

          pressable = true;
        }
      } else {
        /*
         * Có log fasting
         */
        const fast = pixelData.logs.reduce((best, current) =>
          current.hours_in_fast > best.hours_in_fast ? current : best,
        );

        const targetPack = TARGET_PACKS[settings?.target_pack || "default"];

        const pixel = FASTING_TARGETS.findIndex(
          (target) =>
            target.hours <= fast.hours_in_fast &&
            (!target.toHours || target.toHours >= fast.hours_in_fast),
        );

        if (pixel) {
          const progress = fast.elapsed_hours / fast.hours_in_fast;

          const target = targetPack.targets[pixel];

          opacity = 0.5 + 0.5 * progress;
          backgroundColor = isDark ? target.color.dark : target.color.light;
          // backgroundColor = darker(pixel.colors.accent, 0.5); //lighter(pixel.colors.accent, 0.8); // Chỗ này icon pack phải bao hàm cả light và dark, không dùng hàm random thế này
          emoji = target.icon;
          pressable = true;
        }
      }
    }

    /*
     * Không có nội dung để hiển thị
     */
    const content =
      icon ||
      (emoji ? (
        <ThemedText
          size="sm"
          weight="medium"
          colorHex={day.isCurrentYear ? "#FFFFFF" : "#FFFFFF33"}
        >
          {emoji}
        </ThemedText>
      ) : null);

    const borderClass = day.isCurrentYear
      ? "border-text-base/10"
      : "border-dashed border-text-base/5";

    /*
     * Pixel có thể click
     */
    if (pressable) {
      return (
        <Pressable
          onPress={() => {
            onPress(day.dateString);
          }}
          style={{
            backgroundColor,
            boxShadow: isToday ? `0 0 0 1px ${theme.primary}80` : undefined,
          }}
          className={`flex-1 aspect-square items-center justify-center rounded-md border ${borderClass}`}
        >
          <View
            style={{ opacity }}
            className="flex-1 items-center justify-center"
          >
            {content}
          </View>
        </Pressable>
      );
    }

    /*
     * Pixel rỗng
     */
    return (
      <View
        style={{
          backgroundColor,
          boxShadow: isToday ? `0 0 0 1px ${theme.primary}80` : undefined,
        }}
        className={`flex-1 aspect-square rounded-md border ${borderClass}`}
      >
        <View
          style={{ opacity }}
          className="flex-1 items-center justify-center"
        >
          {content}
        </View>
      </View>
    );
  },
);
export default DayPixel;
