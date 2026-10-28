import { useAppStore } from "@/stores/appStore";
import { View } from "react-native";
import AchievementBadge, {
  achievementName,
  findAchievementItem,
} from "./AchievementBadge";
import { ThemedText } from "./themed-text";
import { useT } from "@/providers/Language";

export const SHOWCASE_LIMIT = 3;

/**
 * Hàng huy hiệu đem khoe. `showEmpty` vẽ ô trống cho các vị trí chưa chọn
 * (dùng trong Settings); ảnh export thì chỉ vẽ những huy hiệu đã chọn.
 */
const AchievementShowcase = ({
  itemIds,
  size = 56,
  showEmpty = false,
}: {
  itemIds: string[];
  size?: number;
  showEmpty?: boolean;
}) => {
  const t = useT();
  const theme = useAppStore((state) => state.theme);

  const badges = itemIds
    .map(findAchievementItem)
    .filter((entry) => entry !== null)
    .slice(0, SHOWCASE_LIMIT);

  const emptySlots = showEmpty ? SHOWCASE_LIMIT - badges.length : 0;

  return (
    <View className="flex-row justify-center" style={{ gap: size * 0.4 }}>
      {badges.map(({ achievement, item }) => (
        <View key={item.id} className="items-center" style={{ width: size * 1.3 }}>
          <AchievementBadge achievement={achievement} item={item} size={size} />
          <ThemedText
            size="xxs"
            weight="semibold"
            color="text"
            opacity="medium"
            numberOfLines={1}
            className="mt-1"
          >
            {achievementName(achievement)}
          </ThemedText>
        </View>
      ))}

      {Array.from({ length: emptySlots }, (_, index) => (
        <View key={index} className="items-center" style={{ width: size * 1.3 }}>
          <View
            className="items-center justify-center rounded-full"
            style={{
              width: size * 0.8,
              height: size * 0.8,
              margin: size * 0.1,
              borderWidth: 1.5,
              borderStyle: "dashed",
              borderColor: theme.text + "33",
            }}
          >
            <ThemedText size="lg" color="text" opacity="low">
              +
            </ThemedText>
          </View>
          <ThemedText size="xxs" color="text" opacity="low" className="mt-1">
            {t("ach.empty_slot")}
          </ThemedText>
        </View>
      ))}
    </View>
  );
};

export default AchievementShowcase;
