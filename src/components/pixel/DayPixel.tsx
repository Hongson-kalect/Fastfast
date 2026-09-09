import { EMOTIONS, FASTING_TARGETS } from "@/constants/data";
import { DailyPixelData, DayItem, ViewMode } from "@/interfaces/pixel";
import { useAppStore } from "@/stores/appStore";
import { FontAwesome5 } from "@expo/vector-icons";
import { memo } from "react";
import { Pressable, Text, View } from "react-native";

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

    const isToday = day.dateString === todayStr;

    let emoji: string | undefined;
    let backgroundColor = "transparent";
    let opacity = 1;
    let icon: React.ReactNode = null;
    let pressable = false;

    /*
     * Ngày trong tương lai
     */
    if (day.dateString > todayStr) {
      return (
        <View
          style={{
            backgroundColor: "transparent",
            boxShadow: "none",
          }}
          className="flex-1 aspect-square justify-center items-center rounded-md border border-white/5"
        />
      );
    }

    /*
     * Không có dữ liệu
     */
    if (!pixelData) {
      return (
        <View
          style={{
            backgroundColor: "transparent",
            boxShadow: isToday ? `0 0 0 1px ${theme.primary}80` : "none",
          }}
          className="flex-1 aspect-square justify-center items-center rounded-md border border-white/5"
        />
      );
    }

    /*
     * MOOD
     */
    if (viewMode === "mood") {
      if (pixelData.note) {
        const mood = EMOTIONS[pixelData.note.mood_level || 0];

        emoji = mood.emoji;
        backgroundColor = mood.color;
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

        const pixel = FASTING_TARGETS.find(
          (target) =>
            target.hours <= fast.hours_in_fast &&
            (!target.toHours || target.toHours >= fast.hours_in_fast),
        );

        if (pixel) {
          const progress = fast.elapsed_hours / fast.hours_in_fast;

          opacity = 0.5 + 0.5 * progress;
          backgroundColor = pixel.colors.accent + "88";
          emoji = pixel.emoji;
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
        <Text
          className={`text-[14px]! font-medium ${
            day.isCurrentYear ? "text-white" : "text-white/20"
          }`}
        >
          {emoji}
        </Text>
      ) : null);

    const borderClass = day.isCurrentYear
      ? "border-white/10"
      : "border-dashed border-white/5";

    /*
     * Pixel có thể click
     */
    if (pressable) {
      return (
        <Pressable
          onPress={() => onPress(day.dateString)}
          style={{
            opacity,
            backgroundColor,
            boxShadow: isToday ? `0 0 0 1px ${theme.primary}80` : "none",
          }}
          className={`flex-1 aspect-square justify-center items-center rounded-md border ${borderClass}`}
        >
          {content}
        </Pressable>
      );
    }

    /*
     * Pixel rỗng
     */
    return (
      <View
        style={{
          opacity,
          backgroundColor,
          boxShadow: isToday ? `0 0 0 1px ${theme.primary}80` : "none",
        }}
        className={`flex-1 aspect-square justify-center items-center rounded-md border ${borderClass}`}
      >
        {content}
      </View>
    );
  },
);

export default DayPixel;
