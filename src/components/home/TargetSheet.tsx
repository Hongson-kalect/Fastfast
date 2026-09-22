import { FASTING_TARGETS, FastingTargetItem } from "@/constants/data";
import { settingKey } from "@/constants/key";
import { useDBService } from "@/hooks/useDBService";
import { FastSession } from "@/interfaces/db.type";
import { useBottomSheet } from "@/provider/BottomSheet";
import { useAppStore } from "@/stores/appStore";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetFlatList,
  BottomSheetFlatListMethods,
} from "@gorhom/bottom-sheet";
import { useMemo, useRef, useState } from "react";
import { Pressable, useWindowDimensions, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ThemedText } from "../themed-text";

interface TargetSheetProps {
  onSelectTarget?: (target: FastingTargetItem) => void;
  currentFast: FastSession | null;
}

const TargetSheet = ({ onSelectTarget, currentFast }: TargetSheetProps) => {
  const dbService = useDBService();
  const { settings, updateSetting, theme, setCurrentFastSession } =
    useAppStore();
  const { hide } = useBottomSheet();
  const { width } = useWindowDimensions();
  const [selectIndex, setSelectIndex] = useState(() => {
    const index = FASTING_TARGETS.findIndex(
      (item) => item.hours === settings?.target,
    );

    if (index !== -1) return index;
    return 0;
  });

  const [currentTarget] = useState(() => {
    return settings?.target ? FASTING_TARGETS[selectIndex] : null;
  });

  const selected = useMemo<FastingTargetItem>(() => {
    return FASTING_TARGETS[selectIndex];
  }, [selectIndex]);

  const handleSelect = async () => {
    updateSetting({ [settingKey.target]: selected.hours });
    dbService.setting(settingKey.target, selected.hours);
    if (onSelectTarget) onSelectTarget(selected);

    // Nếu đang có phiên hiện tại thì cập nhật target vào phiên
    if (currentFast) {
      const res = await dbService.updateSessionTarget(
        currentFast.id,
        selected.hours,
      );
      setCurrentFastSession(res);
    }
    hide();
  };

  const handleClearTarget = () => {
    updateSetting({ [settingKey.target]: null });
    dbService.setting(settingKey.target, null);

    if (currentFast) {
      dbService.updateSessionTarget(currentFast.id, null);
    }

    hide();
  };

  const [isScrolling, setIsScrolling] = useState(false);

  const CARD_WIDTH = width - 34;
  const GAP = 6;

  const listRef = useRef<BottomSheetFlatListMethods>(null);

  return (
    <View className="flex-1 bg-background px-2 pb-20 pt-8">
      <View>
        <BottomSheetFlatList
          ref={listRef}
          initialScrollIndex={selectIndex}
          horizontal
          data={FASTING_TARGETS}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            overflow: "visible",
            paddingHorizontal: 10,
            gap: GAP,
          }}
          snapToInterval={CARD_WIDTH + GAP}
          snapToAlignment="start"
          // decelerationRate="fast"
          disableIntervalMomentum
          onMomentumScrollEnd={(e) => {
            const offset = e.nativeEvent.contentOffset.x;

            const index = Math.round((offset - 10) / (CARD_WIDTH + GAP));

            setSelectIndex(index);
            setIsScrolling(false);
          }}
          // 🟢 1. Bật sự kiện scroll liên tục
          // scrollEventThrottle={16}
          // 🟢 4. Khi buông tay mà KHÔNG CÓ đà trượt (dừng tay ngay lập tức)
          onScrollBeginDrag={() => setIsScrolling(true)}
          onScrollEndDrag={(e) => {
            // Nếu không còn lực trượt đà thì mới set false, còn có đà thì để onMomentumScrollEnd lo
            if (e.nativeEvent.velocity?.x === 0) {
              setIsScrolling(false);
            }
          }}
          getItemLayout={(_, index) => ({
            length: CARD_WIDTH + GAP,
            offset: (CARD_WIDTH + GAP) * index,
            index,
          })}
          renderItem={({ item }) => {
            const active = item.id === selected.id;
            const isCurrent = item.id === currentTarget?.id;

            return (
              <View>
                <Pressable
                  // onPress={() => setSelected(item)}
                  style={{
                    width: CARD_WIDTH,
                    borderRadius: 22,
                    borderWidth: 1,
                    borderColor: active
                      ? item.colors.border
                      : item.colors.border + "66",
                    backgroundColor: active
                      ? item.colors.badgeBg
                      : theme.background2,
                    padding: 18,
                    marginBottom: 0,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <View>
                      <ThemedText size="xl" weight="semibold" color="text">
                        {item.label}
                      </ThemedText>

                      <ThemedText
                        size="sm"
                        weight="medium"
                        color="text"
                        style={{ marginTop: 2 }}
                      >
                        {item.title}
                      </ThemedText>
                    </View>

                    <View
                      style={{
                        backgroundColor: item.colors.badgeBg,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 999,
                      }}
                    >
                      <ThemedText
                        size="xs"
                        weight="medium"
                        colorHex={item.colors.badgeText}
                      >
                        {item.level}
                      </ThemedText>
                    </View>
                  </View>

                  <ThemedText
                    size="xs"
                    color="text"
                    opacity="medium"
                    style={{
                      marginTop: 12,
                      marginBottom: 4,
                      lineHeight: 22,
                    }}
                  >
                    {item.description}
                  </ThemedText>

                  {active && (
                    <View
                      style={{
                        position: "absolute",
                        right: 12,
                        bottom: 8,
                      }}
                    >
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color={item.colors.accent}
                      />
                    </View>
                  )}
                </Pressable>

                {/* {active && ( */}
                <View className="items-center">
                  <Animated.View
                    entering={FadeInDown}
                    style={{
                      width: CARD_WIDTH + 16,
                      marginHorizontal: -8,
                      marginTop: 16,
                      paddingVertical: 28,
                      borderRadius: 12,
                      paddingHorizontal: 12,
                    }}
                  >
                    <ThemedText
                      size="sm"
                      weight="bold"
                      colorHex={item.colors.accent}
                    >
                      💡 {item.advice}
                    </ThemedText>

                    <ThemedText
                      size="xs"
                      color="text"
                      opacity="low"
                      style={{
                        marginTop: 14,
                        lineHeight: 23,
                      }}
                    >
                      {item.adviceLong}
                    </ThemedText>

                    <Pressable
                      onPress={isCurrent ? hide : handleSelect}
                      style={{
                        marginTop: 20,
                        backgroundColor: item.colors.accent,
                        height: 54,
                        borderRadius: 16,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <ThemedText size="lg" weight="bold" colorHex="#FFFFFF">
                        {isCurrent ? "Xác nhận" : "Chọn mục tiêu này"}
                      </ThemedText>
                    </Pressable>

                    {isCurrent && (
                      <View className="flex-row justify-center items-center mt-4">
                        <Pressable
                          onPress={handleClearTarget}
                          style={{
                            paddingHorizontal: 16,
                            height: 40,
                            borderRadius: 12,
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <ThemedText
                            size="xs"
                            weight="medium"
                            color="text"
                            opacity="medium"
                            style={{ textDecorationLine: "underline" }}
                          >
                            Hủy mục tiêu
                          </ThemedText>
                        </Pressable>
                      </View>
                    )}
                  </Animated.View>
                </View>
                {/* )} */}
              </View>
            );
          }}
        />
      </View>
    </View>
  );
};

export default TargetSheet;
