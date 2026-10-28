import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { View } from "react-native";
import { InfoSections } from "../home/InfoContent";
import { ThemedText } from "../themed-text";
import { useT } from "@/providers/Language";
import { useAppStore } from "@/stores/appStore";
import { getContrastTextColor } from "@/utils/color";

/** Những điểm của lịch pixel mà dải chú thích icon không nói được. */
export const PixelInfo = () => {
  const t = useT();
  const theme = useAppStore((state) => state.theme);

  // Hình thu nhỏ của đúng nút / ô mà dòng hướng dẫn nhắc tới
  const cell = (child: React.ReactNode, borderColor = theme.text + "1A") => (
    <View
      className="h-5 w-5 items-center justify-center rounded"
      style={{ borderWidth: 1, borderColor }}
    >
      {child}
    </View>
  );
  const heatmapButton = (
    <View
      className="h-5 w-5 items-center justify-center rounded-full"
      style={{ backgroundColor: theme.primary + "1F" }}
    >
      <Ionicons name="grid-outline" size={11} color={theme.primary} />
    </View>
  );
  const layoutButton = (
    <View className="rounded px-1.5 py-0.5" style={{ backgroundColor: theme.primary }}>
      <ThemedText
        size="xxs"
        weight="bold"
        colorHex={getContrastTextColor(theme.primary)}
      >
        {t("journey.weekButton")}
      </ThemedText>
    </View>
  );

  return (
  <InfoSections
    sections={[
      {
        title: t("journey.mode.fasting"),
        lines: [
          t("journey.info.fast1"),
          t("journey.info.fast2"),
          {
            text: t("journey.info.fast3"),
            icon: cell(<FontAwesome5 name="shield-alt" size={9} color={theme.primary} />),
          },
          { text: t("journey.info.fast4"), icon: heatmapButton },
        ],
      },
      {
        title: t("journey.mode.mood"),
        lines: [
          { text: t("journey.info.mood1"), icon: cell(null, theme.primary + "80") },
        ],
      },
      {
        title: t("journey.info.actionsTitle"),
        lines: [
          t("journey.info.action1"),
          t("journey.info.action2"),
          { text: t("journey.info.action3"), icon: layoutButton },
        ],
      },
    ]}
  />
  );
};
