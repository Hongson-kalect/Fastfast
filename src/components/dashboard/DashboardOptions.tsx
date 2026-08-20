import { useDBService } from "@/hooks/useDBService";
import { useBottomSheet } from "@/provider/BottomSheet";
import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import { Feather } from "@expo/vector-icons";
import { TouchableOpacity, View } from "react-native";
import { ThemedText } from "../themed-text";
import ChartRangeSheet from "./ChartRangeSheet";

const DashboardOptions = () => {
  const { theme, updateWeight, settings, weight } = useAppStore();
  const dbService = useDBService();
  const { addModal } = useModalStore();
  const { present, close } = useBottomSheet();

  const openUpdateWeightModal = () => {
    addModal({
      type: "input",
      keyboardType: "numeric",
      title: "Update weight",
      message: "Enter your weight target",
      onOk: async (value) => {
        const val = Number(value);
        if (val && val > 0) {
          await dbService?.updateWeight(val);
          updateWeight(val);
        }
      },
    });
  };

  const openTimeRangeSheet = () => {
    present({
      title: "Time range",
      size: "long",
      render: () => <ChartRangeSheet />,
    });
  };

  return (
    <View>
      <View className="flex-row justify-between items-center my-4">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={openTimeRangeSheet}
          className="flex-row items-center justify-center gap-2"
        >
          <ThemedText
            type="small"
            className="text-white/60! font-light! text-sm!"
          >
            Time ranger
          </ThemedText>
          <View
            style={{ borderColor: theme.text + "aa" }}
            className="flex-row items-center px-2 h-9 border rounded-lg gap-1"
          >
            <ThemedText className="text-sm!">
              Last {settings?.chart_range} days
            </ThemedText>

            <Feather name="chevron-down" size={14} color={theme.text} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={openUpdateWeightModal}
          className="flex-row items-center gap-1 px-2 h-9 bg-success rounded-lg"
        >
          {/* <Feather name="plus" size={20} color={"white"} /> */}
          <ThemedText className="text-sm! text-white!">
            Update weight
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default DashboardOptions;
