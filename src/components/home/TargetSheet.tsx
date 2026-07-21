import { FASTING_TARGETS, FastingTargetItem } from "@/constants/data";
import { settingKey } from "@/constants/key";
import { useDBService } from "@/hooks/useDBService";
import { useBottomSheet } from "@/provider/BottomSheet";
import { useAppStore } from "@/stores/appStore";
import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, ScrollView, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../themed-text";

interface TargetSheetProps {
  currentTargetHours?: number;
  onSelectTarget?: (target: FastingTargetItem) => void;
}

const TargetSheet = ({
  currentTargetHours = 20,
  onSelectTarget,
}: TargetSheetProps) => {
  const { close } = useBottomSheet();
  const dbService = useDBService();
  const { theme, settings, updateSetting } = useAppStore();
  const [selectedHours, setSelectedHours] =
    useState<number>(currentTargetHours);
  const [detailItem, setDetailItem] = useState<FastingTargetItem | null>(null);

  const handleSelect = (item: FastingTargetItem) => {
    setSelectedHours(item.hours);
    updateSetting({ [settingKey.target]: item.hours.toString() });
    dbService.setting(settingKey.target, item.hours.toString());
    if (onSelectTarget) onSelectTarget(item);
    close();
  };

  return (
    <View className="flex-1 bg-zinc-900 px-2 pb-6">
      {/* Danh sách thẻ ngang gọn gàng */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 16, paddingBottom: 20, marginTop: 12 }}
      >
        {FASTING_TARGETS.map((item) => {
          const isSelected = selectedHours === item.hours;

          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.7}
              onPress={() => handleSelect(item)}
              style={{
                elevation: isSelected ? 10 : 10,
                shadowColor: isSelected ? theme.primary : "#fff",
                backgroundColor: "#364153",
                borderColor: isSelected ? theme.primary : item.colors.border,
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
                  {item.hours}H
                </ThemedText>
              </View>

              {/* Cột giữa: Lời khuyên siêu ngắn gọn */}
              <View className="flex-1 px-2">
                <View>
                  <ThemedText className="text-[14px]! font-bold!">
                    {item.label}
                  </ThemedText>
                </View>
                <ThemedText
                  className="text-xs! text-zinc-300! font-medium! mt-2"
                  numberOfLines={1}
                >
                  {item.advice}
                </ThemedText>
              </View>

              {/* Cột phải: Nút Xem chi tiết & Radio Select */}
              <View className="flex-row items-center gap-2 pl-2">
                <TouchableOpacity
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  onPress={() => setDetailItem(item)}
                  className="p-1"
                >
                  <Feather name="info" size={16} color="#a1a1aa" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* MODAL CHI TIẾT HIỂN THỊ NỔI BẬT KHUẬT NGỮ & CƠ CHẾ */}
      <Modal
        visible={!!detailItem}
        transparent
        animationType="fade"
        onRequestClose={() => setDetailItem(null)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setDetailItem(null)}
          className="flex-1 bg-black/70 justify-center items-center p-6"
        >
          <TouchableOpacity
            activeOpacity={1}
            className="w-full bg-zinc-800 p-5 rounded-2xl border border-zinc-700 gap-3"
          >
            <View className="flex-row justify-between items-center border-b border-zinc-700/60 pb-3">
              <View className="flex-row items-center gap-2">
                <ThemedText
                  // style={{ color: detailItem?.colors.accent }}
                  className={`text-2xl font-black`}
                >
                  {detailItem?.hours}H
                </ThemedText>
                <ThemedText className="text-base font-bold text-white">
                  ({detailItem?.label}) - {detailItem?.title}
                </ThemedText>
              </View>
              <TouchableOpacity onPress={() => setDetailItem(null)}>
                <Feather name="x" size={20} color="#a1a1aa" />
              </TouchableOpacity>
            </View>

            <View className="gap-2">
              <ThemedText className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Cơ chế sinh học & Lợi ích:
              </ThemedText>
              <ThemedText className="text-sm text-zinc-200 leading-relaxed">
                {detailItem?.description}
              </ThemedText>
            </View>

            <View className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-700/40 gap-1 mt-1">
              <ThemedText className="text-xs font-bold text-primary">
                💡 Lời khuyên thực hiện:
              </ThemedText>
              <ThemedText className="text-xs text-zinc-300 leading-normal">
                {detailItem?.advice}
              </ThemedText>
            </View>

            <TouchableOpacity
              onPress={() => {
                if (detailItem) handleSelect(detailItem);
                setDetailItem(null);
              }}
              className="mt-2 py-3 rounded-xl bg-blue-600 active:bg-blue-700 items-center"
            >
              <ThemedText className="text-white font-bold text-sm">
                Chọn mục tiêu này
              </ThemedText>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default TargetSheet;
