import { FASTING_TARGETS, FastingTargetItem } from "@/constants/data";
import { settingKey } from "@/constants/key";
import { useDBService } from "@/hooks/useDBService";
import { useBottomSheet } from "@/provider/BottomSheet";
import { useAppStore } from "@/stores/appStore";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

interface TargetSheetProps {
  onSelectTarget?: (target: FastingTargetItem) => void;
}

const TargetSheet = ({ onSelectTarget }: TargetSheetProps) => {
  const { close } = useBottomSheet();
  const dbService = useDBService();
  const { settings, updateSetting, theme } = useAppStore();
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

  const handleSelect = () => {
    updateSetting({ [settingKey.target]: selected.hours });
    dbService.setting(settingKey.target, selected.hours);
    if (onSelectTarget) onSelectTarget(selected);
    close();
  };

  const handleClearTarget = () => {
    updateSetting({ [settingKey.target]: null });
    dbService.setting(settingKey.target, null);
    close();
  };

  const [isScrolling, setIsScrolling] = useState(false);

  const CARD_WIDTH = width - 34;
  const GAP = 6;

  const listRef = useRef<FlatList>(null);

  return (
    <View className="flex-1 bg-zinc-900 px-2 pb-6 pt-8">
      <View>
        <FlatList
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
          decelerationRate="fast"
          disableIntervalMomentum
          onMomentumScrollEnd={(e) => {
            const offset = e.nativeEvent.contentOffset.x;

            const index = Math.round((offset - 10) / (CARD_WIDTH + GAP));

            setSelectIndex(index);
            setIsScrolling(false);
          }}
          // 🟢 1. Bật sự kiện scroll liên tục
          scrollEventThrottle={16}
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
                    backgroundColor: active ? item.colors.badgeBg : "#161616",
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
                      <Text
                        style={{
                          fontSize: 22,
                          fontWeight: "600",
                          color: "white",
                        }}
                      >
                        {item.label}
                      </Text>

                      <Text
                        style={{
                          marginTop: 2,
                          color: "white",
                          fontWeight: "500",
                          fontSize: 14,
                        }}
                      >
                        {item.title}
                      </Text>
                    </View>

                    <View
                      style={{
                        backgroundColor: item.colors.badgeBg,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 999,
                      }}
                    >
                      <Text
                        style={{
                          color: item.colors.badgeText,
                          fontWeight: "500",
                        }}
                      >
                        {item.level}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={{
                      color: "#FFFFFF77",
                      marginTop: 12,
                      marginBottom: 4,
                      lineHeight: 22,
                      fontSize: 13,
                    }}
                  >
                    {item.description}
                  </Text>

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
                      backgroundColor: "transparent",
                      paddingVertical: 28,
                      borderRadius: 12,
                      paddingHorizontal: 12,
                      elevation: 6,
                    }}
                  >
                    <Text
                      style={{
                        color: item.colors.accent,
                        fontSize: 14,
                        fontWeight: "700",
                      }}
                    >
                      💡 {item.advice}
                    </Text>

                    <Text
                      style={{
                        opacity: 0.4,
                        color: "#FFFFFF",
                        fontSize: 13,
                        marginTop: 14,
                        lineHeight: 23,
                      }}
                    >
                      {item.adviceLong}
                    </Text>

                    <Pressable
                      onPress={isCurrent ? close : handleSelect}
                      style={{
                        marginTop: 20,
                        backgroundColor: item.colors.accent,
                        height: 54,
                        borderRadius: 16,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: "white",
                          fontWeight: "700",
                          fontSize: 17,
                        }}
                      >
                        {isCurrent ? "Xác nhận" : "Chọn mục tiêu này"}
                      </Text>
                    </Pressable>
                    {isCurrent && (
                      <View className="flex-row justify-center items-center mt-4">
                        <Pressable
                          onPress={handleClearTarget}
                          // className="bg-gray-700"
                          style={{
                            paddingHorizontal: 16,
                            height: 40,
                            borderRadius: 12,
                            // borderColor: "#FFFFFF" + "99",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <Text
                            style={{
                              opacity: 0.6,
                              color: "#FFFFFF",
                              fontWeight: "500",
                              fontSize: 13,
                            }}
                            className="underline"
                          >
                            Hủy mục tiêu
                          </Text>
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
