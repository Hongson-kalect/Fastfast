import { useAppStore } from "@/stores/appStore";
import { Feather } from "@expo/vector-icons";
import { TouchableOpacity, View } from "react-native";
import { ThemedText } from "../themed-text";

const HomeHeader = () => {
  const { theme } = useAppStore();
  return (
    <View className="flex-row justify-between items-center">
      <View>
        <ThemedText type="subtitle" color="white">
          {/* Hi, Kalect */}
          FastFast
        </ThemedText>
        {/* <ThemedText type="small">A little encouragement!</ThemedText> */}
      </View>
      <View className="p-1">
        <TouchableOpacity
          activeOpacity={0.7}
          style={{
            borderTopRightRadius: "20%",
            borderBottomLeftRadius: "20%",
            borderBottomRightRadius: "50%",
            borderTopLeftRadius: "50%",
          }}
          className="h-10 w-14 justify-center items-center rounded-full border-2 border-primary relative"
        >
          {/* Số target hiển thị (thêm z-10 để luôn nổi lên trên dấu chấm mờ nếu cần) */}
          <ThemedText className="text-primary! text-base! font-semibold!">
            {/* 24h */}
            <Feather name="trending-up" size={20} color={theme.primary} />
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default HomeHeader;
