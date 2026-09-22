import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";
import { ThemedText } from "../themed-text";
import LiquidCircle from "./Waterball";

const FullHabitModal = ({ habitName }: { habitName: string }) => {
  const { theme } = useAppStore();
  const { closeCurrentModal } = useModalStore();

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
          Thói quen hình thành
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
          Bước vào giai đoạn duy trì
        </ThemedText>

        <ThemedText
          size="sm"
          color="text"
          opacity="medium"
          style={{ marginTop: 8, lineHeight: 20 }}
        >
          Mỗi lần bạn tiếp tục duy trì thói quen, điểm sẽ được cộng vào Retain.
        </ThemedText>
      </View>

      {/* Retain */}
      <View className="mt-3 items-center rounded-2xl border border-primary/15 bg-primary/5 px-4 pt-2">
        <View className="flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/15">
            <Ionicons name="water" size={20} color={theme.primary} />
          </View>

          <View className="flex-1">
            <ThemedText weight="bold">Habit Retain</ThemedText>

            <ThemedText
              size="xxs"
              color="text"
              opacity="medium"
              style={{ marginTop: 4 }}
            >
              Điểm duy trì
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
        Đầy 25 Retain sẽ tự quy đổi 1 Shield. Khi habit bị phá, toàn bộ Retain
        hiện có sẽ về 0.
      </ThemedText>

      {/* CTA */}
      <Pressable
        onPress={closeCurrentModal}
        hitSlop={10}
        className="mt-6 h-12 items-center justify-center rounded-xl bg-primary"
      >
        <ThemedText size="md" weight="bold" colorHex="#FFFFFF">
          Đã hiểu
        </ThemedText>
      </Pressable>
    </View>
  );
};

export default FullHabitModal;
