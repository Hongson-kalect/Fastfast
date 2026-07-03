import { Feather } from "@expo/vector-icons";
import { TouchableOpacity, View } from "react-native";
import { ThemedText } from "../themed-text";

const PixelHeader = () => {
  return (
    <View className="flex-row justify-between items-center">
      <View className="flex-row items-center gap-2">
        <ThemedText type="subtitle" color="white">
          Emotion
        </ThemedText>

        <Feather name="chevron-down" size={36} color="white" />
      </View>
      <View className="p-1 flex-row items-center gap-1">
        <Feather name="chevron-left" size={20} color="white" />
        <TouchableOpacity
          activeOpacity={0.7}
          className="h-10 w-12 justify-center items-center relative"
        >
          {/* Số target hiển thị (thêm z-10 để luôn nổi lên trên dấu chấm mờ nếu cần) */}
          <ThemedText className="text-white! text-base!">2026</ThemedText>
        </TouchableOpacity>
        <Feather name="chevron-right" size={20} color="white" />
      </View>
    </View>
  );
};

export default PixelHeader;
