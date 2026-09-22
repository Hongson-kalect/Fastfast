import { CHART_RANGES, ChartRangeKey } from "@/constants/data";
import { useDBService } from "@/hooks/useDBService";
import { useBottomSheet } from "@/provider/BottomSheet";
import { useAppStore } from "@/stores/appStore";
import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { ThemedText } from "../themed-text";

interface Props {
  currentTargetHours?: number;
  onSelectTarget?: (days: ChartRangeKey) => void;
}

const ChartRangeSheet = ({ onSelectTarget }: Props) => {
  const { hide } = useBottomSheet();
  const dbService = useDBService();
  const { theme, settings, updateSetting } = useAppStore();
  const [selectedRange, setSelectedRange] = useState<ChartRangeKey>(
    settings?.chart_range || "7d",
  );

  const handleSelect = (key: ChartRangeKey) => {
    setSelectedRange(key);
    updateSetting({ chart_range: key });
    dbService.setting("chart_range", key);

    if (onSelectTarget) onSelectTarget(key);
    hide();
  };

  return (
    <View className="flex-1 bg-background px-4">
      <ThemedText
        size="lg"
        weight="semibold"
        color="text"
        style={{ marginTop: 16, marginBottom: 12 }}
      >
        Khoảng thời gian
      </ThemedText>

      <View className="flex-row flex-wrap -mx-1.5">
        {CHART_RANGES.map((item) => {
          const isSelected = selectedRange === item.key;

          return (
            <View key={item.key} className="w-1/2 px-1.5 mb-3">
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => handleSelect(item.key)}
                className="h-28 rounded-2xl items-center justify-center"
                style={{
                  backgroundColor: isSelected
                    ? theme.primary + "18"
                    : theme.background2,
                  borderWidth: 1,
                  borderColor: isSelected ? theme.primary : theme.text + "12",
                }}
              >
                <ThemedText
                  size="xxxl"
                  weight="bold"
                  color={isSelected ? "primary" : "text"}
                >
                  {item.value}
                </ThemedText>

                <ThemedText
                  size="sm"
                  weight="medium"
                  color="text"
                  opacity={isSelected ? "hight" : "medium"}
                >
                  {item.unit === "day"
                    ? "ngày"
                    : item.unit === "week"
                      ? "tuần"
                      : "tháng"}
                </ThemedText>

                {isSelected && (
                  <View
                    className="absolute top-3 right-3 w-5 h-5 rounded-full items-center justify-center"
                    style={{ backgroundColor: theme.primary }}
                  >
                    <Feather name="check" size={13} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default ChartRangeSheet;
