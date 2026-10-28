import { FASTING_TARGETS } from "@/constants/data";
import { getEmotionPack } from "@/constants/emotions";
import { getTargetPack } from "@/constants/fasting_targets";
import { HEATMAP_LEVELS, heatmapLabel, withOpacity } from "@/constants/heatmap";
import { ViewMode } from "@/interfaces/pixel";
import { useAppStore } from "@/stores/appStore";
import { usePixelStore } from "@/stores/pixelStore";
import { View } from "react-native";
import { ThemedText } from "../themed-text";
import { useT } from "@/providers/Language";
import { getContrastTextColor } from "@/utils/color";


// Ô của mức cuối không có giới hạn trên → "72h+"
const fastLabel = (index: number) => {
  const target = FASTING_TARGETS[index];
  if (!target) return "";
  return index === FASTING_TARGETS.length - 1
    ? `${target.hours}h+`
    : `${target.hours}h`;
};

/** Dải chú thích icon của lịch pixel: icon + số ngày, nhãn ở dòng dưới. */
const PixelLegend = ({ viewMode }: { viewMode: ViewMode }) => {
  const t = useT();
  const settings = useAppStore((state) => state.settings);
  const theme = useAppStore((state) => state.theme);
  const counter = usePixelStore((state) => state.counter);

  const isDark = settings?.is_dark_mode ?? true;
  const isMood = viewMode === "mood";

  const items = isMood
    ? getEmotionPack(settings?.emotion_pack).emotions.map(
        (item, index) => ({
          key: item.label,
          icon: item.icon[isDark ? "dark" : "light"],
          color: isDark ? item.color.dark : item.color.light,
          count: counter.mood[index as 0 | 1 | 2 | 3 | 4],
          label: t(`journey.legend.mood.${index}`),
        }),
      )
    : settings?.pixel_heatmap
      ? // Heatmap đếm số ngày theo tổng giờ nhịn trong ngày
        HEATMAP_LEVELS.map((level, index) => ({
          key: `heat${index}`,
          icon: null,
          color: withOpacity(theme.primary, level.opacity),
          count: counter.day?.[index] ?? 0,
          label: heatmapLabel(index),
        }))
      : getTargetPack(settings?.target_pack).targets.map(
          (item, index) => ({
            key: item.label,
            icon: item.icon,
            color: isDark ? item.color.dark : item.color.light,
            count: counter.fast[index as 0 | 1 | 2 | 3 | 4 | 5 | 6],
            label: fastLabel(index),
          }),
        );

  return (
    <View className={`flex-row ${isMood ? "gap-4" : "gap-2"}`}>
      {items.map((item) => (
        <View key={item.key} className="flex-1 items-center gap-1">
          <View
            style={{ backgroundColor: item.color }}
            className="w-full items-center rounded-xl px-2 py-1.5"
          >
            <ThemedText>{item.icon}</ThemedText>
            {/* Ô heatmap nhạt/đậm khác nhau: chọn chữ đen/trắng theo nền thực tế */}
            <ThemedText
              size="xs"
              colorHex={getContrastTextColor(item.color, theme.background)}
            >
              {item.count}
            </ThemedText>
          </View>
          <ThemedText
            size="xxs"
            color="text"
            opacity="medium"
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {item.label}
          </ThemedText>
        </View>
      ))}
    </View>
  );
};

export default PixelLegend;
