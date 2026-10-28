import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";
import { ThemedText } from "../themed-text";
import LiquidCircle from "./Waterball";
import { getContrastTextColor } from "@/utils/color";
import { useT } from "@/providers/Language";

const FullHabitModal = ({ habitName }: { habitName: string }) => {
  const t = useT();
  const theme = useAppStore((state) => state.theme);
  const closeCurrentModal = useModalStore((state) => state.closeCurrentModal);

  return (
    <View>
      {/* Icon */}
      <View className="items-center">
        <View
          className="h-20 w-20 items-center justify-center rounded-full"
          style={{
            backgroundColor: `${theme.primary}18`,
            borderWidth: 1,
            borderColor: `${theme.primary}40`,
          }}
        >
          <Ionicons name="sparkles" size={36} color={theme.primary} />
        </View>

        <ThemedText size="xxl" weight="bold" style={{ marginTop: 16 }}>
          {t("fullHabit.title")}
        </ThemedText>
      </View>

      {/* 100% */}
      <View className="my-3 items-center">
        <LiquidCircle
          percent={100}
          size={120}
          color={theme.primary}
          retainPercent={0} // Ví dụ: 45% (Đang tích được 45% cho Shield tiếp theo)
          retainColor={theme.primary}
        />
      </View>

      {/* Explanation */}
      <View className="mt-2 rounded-2xl border border-text-base/5 bg-background2/80 p-4">
        <ThemedText size="md" weight="bold">
          {t("fullHabit.maintainTitle")}
        </ThemedText>

        <ThemedText
          size="sm"
          color="text"
          opacity="medium"
          style={{ marginTop: 8, lineHeight: 20 }}
        >
          {t("fullHabit.maintainBody")}
        </ThemedText>
      </View>

      {/* Retain */}
      <View className="mt-3 items-center rounded-2xl border border-primary/15 bg-primary/5 px-4 pt-2">
        <View className="flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/15">
            <Ionicons name="water" size={20} color={theme.primary} />
          </View>

          <View className="flex-1">
            <ThemedText weight="bold">{t("fullHabit.retainTitle")}</ThemedText>

            <ThemedText
              size="xxs"
              color="text"
              opacity="medium"
              style={{ marginTop: 4 }}
            >
              {t("fullHabit.retainSub")}
            </ThemedText>
          </View>

          <ThemedText size="lg" weight="bold" color="primary">
            0 / 25
          </ThemedText>
        </View>

        <View className="mt-4 h-2 w-full overflow-hidden rounded-full bg-background2">
          <View
            className="h-full rounded-full bg-primary"
            style={{ width: "0%" }}
          />
        </View>
      </View>

      <ThemedText
        size="xs"
        color="text"
        opacity="medium"
        style={{ marginTop: 8 }}
      >
        {t("fullHabit.note")}
      </ThemedText>

      {/* CTA */}
      <Pressable
        onPress={closeCurrentModal}
        hitSlop={10}
        className="mt-6 h-14 items-center justify-center rounded-full bg-primary"
      >
        <ThemedText size="md" weight="bold" colorHex={getContrastTextColor(theme.primary)}>
          {t("common.gotIt")}
        </ThemedText>
      </Pressable>
    </View>
  );
};

export default FullHabitModal;
