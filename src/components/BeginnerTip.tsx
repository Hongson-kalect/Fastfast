import { RADIUS } from "@/constants/design";
import { useAppStore } from "@/stores/appStore";
import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";
import { ThemedText } from "./themed-text";
import { useT } from "@/providers/Language";

/**
 * Thẻ mẹo cho người mới. Ẩn khi tắt "Beginner tips" trong Settings,
 * dùng được ở bất kỳ tab nào.
 */
export const BeginnerTip = ({
  title,
  lines,
}: {
  title: string;
  lines: string[];
}) => {
  const enabled = useAppStore((state) => state.settings?.beginner_tips ?? true);
  const theme = useAppStore((state) => state.theme);
  const t = useT();

  if (!enabled) return null;

  return (
    <View
      className="p-3.5"
      style={{
        borderRadius: RADIUS.lg,
        backgroundColor: theme.primary + "0F",
        borderWidth: 1,
        borderColor: theme.primary + "26",
      }}
    >
      <View className="mb-2 flex-row items-center gap-1.5">
        <Ionicons name="bulb-outline" size={14} color={theme.primary} />
        <ThemedText size="sm" weight="bold" color="primary">
          {title}
        </ThemedText>
      </View>

      <View className="gap-1.5">
        {lines.map((line) => (
          <View key={line} className="flex-row gap-2">
            <ThemedText size="xs" color="text" opacity="medium">
              •
            </ThemedText>
            <ThemedText
              size="xs"
              color="text"
              opacity="medium"
              className="flex-1"
              style={{ lineHeight: 18 }}
            >
              {line}
            </ThemedText>
          </View>
        ))}
      </View>

      <ThemedText
        size="xxs"
        color="text"
        opacity="low"
        className="mt-2.5"
      >
        {t("tip.disableHint")}
      </ThemedText>
    </View>
  );
};
