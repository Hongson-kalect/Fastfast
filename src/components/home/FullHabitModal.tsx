import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import LiquidCircle from "./Waterball";

const FullHabitModal = ({ habitName }: { habitName: string }) => {
  const { theme } = useAppStore();
  const { closeCurrentModal } = useModalStore();

  return (
    <View>
      {/* Icon */}
      <View className="items-center">
        <View
          className="w-20 h-20 rounded-full items-center justify-center"
          style={{
            backgroundColor: `${theme.primary}18`,
            borderWidth: 1,
            borderColor: `${theme.primary}40`,
          }}
        >
          <Ionicons name="sparkles" size={36} color={theme.primary} />
        </View>

        <Text className="text-2xl font-bold text-white mt-4">
          Thói quen hình thành
        </Text>
      </View>

      {/* 100% */}
      <View className="items-center my-3">
        <LiquidCircle
          percent={100}
          size={120}
          color={theme.primary}
          retainPercent={0} // Ví dụ: 45% (Đang tích được 45% cho Shield tiếp theo)
          retainColor="#3B82F6" // Viền Retain màu Xanh Shield
        />
      </View>

      {/* Explanation */}
      <View className="bg-zinc-900/80 rounded-2xl border border-white/5 mt-2">
        <Text className="text-white font-bold text-base">
          Bước vào giai đoạn duy trì
        </Text>

        <Text className="text-sm text-zinc-400 leading-5 mt-2">
          Mỗi lần bạn tiếp tục duy trì thói quen, điểm sẽ được cộng vào Retain.
        </Text>
      </View>

      {/* Retain */}
      <View className="bg-blue-500/5 border border-blue-500/15 rounded-2xl px-4 pt-2 mt-3 items-center">
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-full bg-blue-500/15 items-center justify-center">
            <Ionicons name="water" size={20} color={theme.primary} />
          </View>

          <View className="flex-1">
            <Text className="text-white font-bold">Habit Retain</Text>

            <Text className="text-xs text-zinc-500 mt-1">Điểm duy trì</Text>
          </View>

          <Text className="text-blue-400 font-bold text-lg">0 / 25</Text>
        </View>

        <View className="h-2 bg-zinc-800 rounded-full overflow-hidden mt-4">
          <View
            className="h-full bg-blue-500 rounded-full"
            style={{ width: "0%" }}
          />
        </View>
      </View>

      <Text className="text-xs text-zinc-500 mt-2">
        Đầy 25 Retain sẽ tự quy đổi 1 Shield. Khi habit bị phá, toàn bộ Retain
        hiện có sẽ về 0.
      </Text>

      {/* CTA */}
      <Pressable
        onPress={closeCurrentModal}
        hitSlop={10}
        className="h-12 rounded-xl items-center justify-center mt-6"
        style={{
          backgroundColor: theme.primary,
        }}
      >
        <Text className="text-white font-bold">Đã hiểu</Text>
      </Pressable>
    </View>
  );
};

export default FullHabitModal;
