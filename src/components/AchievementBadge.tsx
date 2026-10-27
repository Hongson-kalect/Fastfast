import {
  Achievement,
  ACHIEVEMENTS,
  AchievementItem,
} from "@/constants/achievements";
import { Image } from "expo-image";
import { View } from "react-native";
import { ThemedText } from "./themed-text";

const SECONDS_IN_HOUR = 3600;

// 1000 → "1K", 2500 → "2.5K"
const compact = (n: number) =>
  n >= 1000 ? `${Number((n / 1000).toFixed(1))}K` : String(n);

/** Nhãn ngắn của mốc đặt trên ruy băng huy hiệu, VD "50h", "30d", "70%". */
export const badgeLabel = (achievement: Achievement, item: AchievementItem) => {
  if (typeof item.target !== "number") return "";
  switch (achievement.input) {
    case "duration":
      return `${compact(item.target / SECONDS_IN_HOUR)}h`;
    case "streakGain":
    case "streakMax":
      return `${compact(item.target)}d`;
    case "habitMax":
      return `${item.target}%`;
    default:
      return `×${compact(item.target)}`;
  }
};

/** Tìm thành tựu và mốc theo id mốc (id mốc là duy nhất toàn bộ). */
export const findAchievementItem = (itemId: string) => {
  for (const achievement of ACHIEVEMENTS) {
    const item = achievement.items.find((entry) => entry.id === itemId);
    if (item) return { achievement, item };
  }
  return null;
};

/**
 * Huy hiệu của một mốc thành tựu. `locked` làm mờ (chưa đạt),
 * `showLabel` hiện giá trị mốc ở chân huy hiệu.
 */
const AchievementBadge = ({
  achievement,
  item,
  size = 48,
  locked = false,
  showLabel = true,
}: {
  achievement: Achievement;
  item: AchievementItem;
  size?: number;
  locked?: boolean;
  showLabel?: boolean;
}) => {
  const label = showLabel ? badgeLabel(achievement, item) : "";

  return (
    <View
      style={{ width: size, height: size, opacity: locked ? 0.3 : 1 }}
      className="items-center"
    >
      <Image
        source={item.image}
        style={{ width: size, height: size }}
        contentFit="contain"
      />
      {!!label && (
        <View
          className="absolute items-center justify-center rounded-full"
          style={{
            bottom: size * 0.04,
            paddingHorizontal: size * 0.08,
            minWidth: size * 0.42,
            height: size * 0.24,
            backgroundColor: "#1F1A17D9",
          }}
        >
          <ThemedText
            weight="extrabold"
            colorHex="#FFFFFF"
            numberOfLines={1}
            style={{ fontSize: Math.max(8, size * 0.15), lineHeight: size * 0.22 }}
          >
            {label}
          </ThemedText>
        </View>
      )}
    </View>
  );
};

export default AchievementBadge;
