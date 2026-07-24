import { useDBService } from "@/hooks/useDBService";
import { useBottomSheet } from "@/provider/BottomSheet";
import { useAppStore } from "@/stores/appStore";
import { useState } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../themed-text";
import { CHART_RANGES, ChartRangeKey } from "@/constants/data";

interface Props {
  currentTargetHours?: number;
  onSelectTarget?: (days: ChartRangeKey) => void;
}


const ChartRangeSheet = ({ onSelectTarget }: Props) => {
  const { close } = useBottomSheet();
  const dbService = useDBService();
  const { theme, settings, updateSetting } = useAppStore();
  const [selectedRange, setSelectedRange] = useState<ChartRangeKey>(
    settings?.chart_range || '7d',
  );

  const handleSelect = (key: ChartRangeKey) => {
    setSelectedRange(key);
    updateSetting({ chart_range: key });
    dbService.setting("chart_range", key);

    if (onSelectTarget) onSelectTarget(key);
    close();
  };

  return (
    <View className="flex-1 bg-zinc-900 px-2 pb-6">
      {/* Danh sách thẻ ngang gọn gàng */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 16, paddingBottom: 20, marginTop: 12 }}
      >
        {CHART_RANGES.map((item) => {
          const isSelected = selectedRange === item.key;

          return (
            <TouchableOpacity
              key={item.label}
              activeOpacity={0.7}
              onPress={() => handleSelect(item.key)}
              style={{
                elevation: isSelected ? 10 : 10,
                shadowColor: isSelected ? theme.primary : "#fff",
                backgroundColor: "#364153",
                borderColor: isSelected ? theme.primary : "gray",
                borderWidth: 0.5,
              }}
              className={`flex-row items-center shadow justify-between overflow-hidden rounded-lg`}
            >
              {/* Cột trái: Số giờ & Chu kỳ */}
              <View
                style={{
                  backgroundColor: isSelected ? theme.primary : "#6a7282",
                }}
                className="flex-row items-center bg-gray-500  py-4 px-3"
              >
                <ThemedText
                  // style={{ color: item.colors.badgeText }}
                  className={`text-3xl! font-bold!`}
                >
                  {item.label}
                </ThemedText>
              </View>

              {/* Cột giữa: Lời khuyên siêu ngắn gọn */}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default ChartRangeSheet;
