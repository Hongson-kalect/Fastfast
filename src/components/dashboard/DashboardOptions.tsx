import { useAppStore } from "@/stores/appStore";
import { Feather } from "@expo/vector-icons";
import { View } from "react-native";
import { ThemedText } from "../themed-text";

const DashboardOptions = () => {
  const { theme } = useAppStore();
  return (
    <View className="flex-row justify-between items-center my-4">
      <View className="flex-row items-center justify-center gap-2">
        <ThemedText
          type="small"
          className="text-white/60! font-light! text-sm!"
        >
          Time ranger
        </ThemedText>
        <View
          style={{ borderColor: theme.text }}
          className="flex-row items-center px-2 h-9 border rounded-lg gap-1"
        >
          <ThemedText className="text-sm!">Last 7 days</ThemedText>

          <Feather name="chevron-down" size={14} color={theme.text} />
        </View>
      </View>

      <View className="flex-row items-center gap-1 px-2 h-9 bg-primary rounded-lg">
        {/* <Feather name="plus" size={20} color={"white"} /> */}
        <ThemedText className="text-sm! text-white!">Update weight</ThemedText>
      </View>
    </View>
  );
};

export default DashboardOptions;
