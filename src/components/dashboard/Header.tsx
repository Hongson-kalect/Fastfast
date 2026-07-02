import { TouchableOpacity, View } from "react-native";
import { ThemedText } from "../themed-text";

const DashboardHeader = () => {
  return (
    <View className="flex-row justify-between items-center">
      <View>
        <ThemedText type="subtitle" color="white">
          Dashboard
        </ThemedText>
      </View>
      <View className="p-1">
        <TouchableOpacity
          activeOpacity={0.7}
          className="h-10 w-10 justify-center items-center rounded-lg border-2 border-red-800 relative"
        >
          {/* Số target hiển thị (thêm z-10 để luôn nổi lên trên dấu chấm mờ nếu cần) */}
          <ThemedText className="text-white/80! text-base! font-semibold!">
            170
          </ThemedText>

          {/* 2. Đường TOP (Nằm phía trên border) */}
          <View className="absolute w-0.5 h-2.5 bg-red-800 z-10 -top-2 left-4.5" />

          {/* 3. Đường BOTTOM (Nằm phía dưới border) */}
          <View className="absolute w-0.5 h-2.5 bg-red-800 z-10 -bottom-2 left-4.5" />

          {/* 4. Đường LEFT (Nằm bên trái border) */}
          <View className="absolute h-0.5 w-2.5 bg-red-800 z-10 -left-2 top-4.5" />

          {/* 5. Đường RIGHT (Nằm bên phải border) */}
          <View className="absolute h-0.5 w-2.5 bg-red-800 z-10 -right-2 top-4.5" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default DashboardHeader;
