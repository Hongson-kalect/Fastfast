import { useDBService } from "@/hooks/useDBService";
import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import { Feather } from "@expo/vector-icons";
import { TouchableOpacity, View } from "react-native";
import { ThemedText } from "../themed-text";

const DashboardHeader = () => {
  const { settings, updateSetting } = useAppStore();
  const { setGlobalModal } = useModalStore();
  const dbService = useDBService();

  const openWeightTargetModal = () => {
    setGlobalModal({
      type: "input",
      keyboardType: "numeric",
      title: "Target",
      message: "Enter your weight target",
      onOk: async (value) => {
        await dbService?.setting("weight_target", value);
        updateSetting({ weight_target: value });
      },
    });
  };
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
          onPress={openWeightTargetModal}
          className="h-10 w-12 justify-center items-center rounded-full border-2 border-primary/80 relative"
        >
          {/* Số target hiển thị (thêm z-10 để luôn nổi lên trên dấu chấm mờ nếu cần) */}
          {settings?.weight_target ? (
            <ThemedText className="text-primary! text-base! z-10">
              {settings?.weight_target}
            </ThemedText>
          ) : (
            <Feather name="plus" color="white" size={20} />
          )}

          {/* 2. Đường TOP (Nằm phía trên border) */}
          <View className="absolute w-0.5 h-2.5 bg-primary/80 z-10 -top-2 left-5.5" />

          {/* 3. Đường BOTTOM (Nằm phía dưới border) */}
          <View className="absolute w-0.5 h-2.5 bg-primary/80 z-10 -bottom-2 left-5.5" />

          {/* 4. Đường LEFT (Nằm bên trái border) */}
          <View className="absolute h-0.5 w-2.5 bg-primary/80 z-10 -left-2 top-4.5" />

          {/* 5. Đường RIGHT (Nằm bên phải border) */}
          <View className="absolute h-0.5 w-2.5 bg-primary/80 z-10 -right-2 top-4.5" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default DashboardHeader;
