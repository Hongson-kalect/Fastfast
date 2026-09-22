import { CHART_RANGES } from "@/constants/data";
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
  const { present, hide } = useBottomSheet();

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
    present(<ChartRangeSheet />);
  };

  return (
    <View className="flex-row items-center justify-between my-4">
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={openTimeRangeSheet}
        className="flex-row items-center gap-2"
      >
        <ThemedText size="sm" color="text" opacity="medium">
          Time range
        </ThemedText>

        <View
          className="flex-row items-center gap-1 px-3 h-9 rounded-lg"
          style={{
            backgroundColor: theme.background2,
            borderWidth: 1,
            borderColor: theme.text + "15",
          }}
        >
          <ThemedText size="sm" weight="medium" color="text">
            {CHART_RANGES.find((item) => item.key === settings?.chart_range)
              ?.label ?? "7 ngày qua"}
          </ThemedText>

          <Feather
            name="chevron-down"
            size={14}
            color={theme.text}
            style={{ opacity: 0.6 }}
          />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={openUpdateWeightModal}
        className="flex-row items-center gap-1 px-3 h-9 rounded-lg bg-success"
      >
        <Feather name="plus" size={16} color="#FFFFFF" />

        <ThemedText size="sm" weight="medium" colorHex="#FFFFFF">
          Update weight
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
};

export default DashboardOptions;
