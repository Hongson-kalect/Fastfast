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
    size,
    day,
    pixelData,
    todayStr,
    viewMode,
    onPress,
  }: {
    size: number;
    day: DayItem;
    pixelData?: DailyPixelData;
    todayStr: string;
    viewMode: ViewMode;
    onPress: (date: string) => void;
  }) => {
    const theme = useAppStore((state) => state.theme);
    // Chỉ theo dõi đúng trường cần: ~370 ô không render lại khi setting khác đổi
    const isDark = useAppStore((state) => state.settings?.is_dark_mode ?? true);
    const emotionPackId = useAppStore((state) => state.settings?.emotion_pack);
    const targetPackId = useAppStore((state) => state.settings?.target_pack);

    const isToday = day.dateString === todayStr;
    const isFuture = day.dateString > todayStr;

    const logs = pixelData?.logs ?? [];
    const note = pixelData?.note;
    const shieldLog = pixelData?.shieldLog;

    const canPress = !isFuture;

    const todayShadow = isToday
      ? `1px 2px 4px ${theme.primary}80, -0.5px -1px 2px ${theme.primary}60`
      : undefined;

    // Kích thước luôn lấy từ `size`: flex-1/aspect-square làm ô bị co về 0
    // khi cha là cột không có chiều cao cố định (layout cuộn ngang).
    const baseClass = "items-center justify-center rounded-md border";
    const sizeStyle = { width: size, height: size };

    // Ngày tương lai luôn disabled.
    if (isFuture) {
      return (
        <View style={sizeStyle} className={`${baseClass} border-text-base/5`} />
      );
    }

    let emoji: ReactNode = null;
    let icon: ReactNode = null;
    let backgroundColor = "transparent";
    let opacity = 1;
    let borderClass = "border-text-base/10";

    if (viewMode === "mood") {
      if (note) {
        const emotionPack = EMOTION_PACKS[emotionPackId || "default"];

        const mood = note.mood_level && emotionPack.emotions[note.mood_level];

        if (mood) {
          emoji = mood.icon[isDark ? "dark" : "light"];
          backgroundColor = isDark ? mood.color.dark : mood.color.light;
        }

        if (note.note) {
          borderClass = "border-primary/50";
        }
      }
    } else {
      if (logs.length > 0) {
        const fast = logs.reduce((best, current) =>
          current.hours_in_fast > best.hours_in_fast ? current : best,
        );

        const pixel = FASTING_TARGETS.findIndex(
          (target) =>
            target.hours <= fast.hours_in_fast &&
            (!target.toHours || target.toHours >= fast.hours_in_fast),
        );

        if (pixel >= 0) {
          const targetPack = TARGET_PACKS[targetPackId || "default"];

          const target = targetPack.targets[pixel];
          const progress = Math.min(fast.elapsed_hours / fast.hours_in_fast, 1);

          opacity = 0.5 + 0.5 * progress;
          backgroundColor = isDark ? target.color.dark : target.color.light;

          emoji = target.icon;
        }
      } else if (shieldLog) {
        icon = (
          <FontAwesome5 name="shield-alt" size={14} color={theme.primary} />
        );
      }
    }

    if (!day.isCurrentYear) {
      borderClass = "border-dashed border-text-base/5";
    }

    const content =
      icon ??
      (emoji ? (
        <ThemedText
          size="sm"
          weight="medium"
          colorHex={
            day.isCurrentYear ? theme.background : `${theme.background}33`
          }
        >
          {emoji}
        </ThemedText>
      ) : null);

    const style = {
      ...sizeStyle,
      backgroundColor,
      boxShadow: todayShadow,
    };

    const children = (
      <View style={{ opacity }} className="flex-1 items-center justify-center">
        {content}
      </View>
    );

    if (canPress) {
      return (
        <Pressable
          onPress={() => onPress(day.dateString)}
          style={style}
          className={`${baseClass} ${borderClass}`}
        >
          {children}
        </Pressable>
      );
    }

    return (
      <View style={style} className={`${baseClass} ${borderClass}`}>
        {children}
      </View>
    );
  },
);

export default DayPixel;
