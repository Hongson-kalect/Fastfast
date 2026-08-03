import { FASTING_TARGETS, FastingTargetItem } from "@/constants/data";
import { settingKey } from "@/constants/key";
import { useDBService } from "@/hooks/useDBService";
import { useBottomSheet } from "@/provider/BottomSheet";
import { useAppStore } from "@/stores/appStore";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

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
  const { settings, updateSetting, theme } = useAppStore();
  const { width } = useWindowDimensions();

  const [selected, setSelected] = useState<FastingTargetItem>(() => {
    return (
      FASTING_TARGETS.find((item) => item.hours === settings?.target) ||
      FASTING_TARGETS[0]
    );
  });

  const handleSelect = () => {
    console.log(settings, selected.hours);
    updateSetting({ [settingKey.target]: selected.hours.toString() });
    dbService.setting(settingKey.target, selected.hours.toString());
    if (onSelectTarget) onSelectTarget(selected);
    close();
  };

  const CARD_WIDTH = width - 32;
  const GAP = 16;

  const listRef = useRef<FlatList>(null);

  return (
    <View className="flex-1 bg-zinc-900 px-2 pb-6 pt-8">
      <View>
        <FlatList
          horizontal
          data={FASTING_TARGETS}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 8,
            gap: GAP,
          }}
          snapToInterval={CARD_WIDTH + GAP}
          snapToAlignment="start"
          decelerationRate="fast"
          disableIntervalMomentum
          onMomentumScrollEnd={(e) => {
            const offset = e.nativeEvent.contentOffset.x;

            const index = Math.round(offset / (CARD_WIDTH + GAP));

            setSelected(FASTING_TARGETS[index]);
          }}
          renderItem={({ item }) => {
            const active = item.id === selected.id;

            return (
              <Pressable
                onPress={() => setSelected(item)}
                style={{
                  width: CARD_WIDTH,
                  borderRadius: 22,
                  borderWidth: active ? 1 : 1,
                  borderColor: active ? item.colors.border : "#2E2E2E",
                  backgroundColor: active ? item.colors.badgeBg : "#161616",
                  padding: 18,
                  marginBottom: 0,
                }}
              >
                <View className="flex-row items-center justify-between absolute top-0 bottom-0 -right-3 -left-3">
                  <View>
                    <View
                      style={{ backgroundColor: item.colors.accent + "80" }}
                      className="rounded-full h-8 w-8 items-center justify-center"
                    >
                      <Feather name="chevron-left" size={16} color="white" />
                    </View>
                  </View>
                  <View>
                    <View
                      style={{ backgroundColor: item.colors.accent + "80" }}
                      className="rounded-full h-8 w-8 items-center justify-center"
                    >
                      <Feather name="chevron-right" size={16} color="white" />
                    </View>
                  </View>
                </View>
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
                      bottom: 12,
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
            );
          }}
        />
      </View>

      <View
        style={{
          // position: "absolute",
          marginTop: 24,
          backgroundColor: "#111",
          paddingVertical: 28,
          borderRadius: 12,
          paddingHorizontal: 14,
          elevation: 6,
        }}
      >
        <Text
          style={{
            color: selected.colors.accent,
            fontSize: 24,
            fontWeight: "700",
          }}
        >
          {selected.label}
        </Text>
        <Text>{selected.label}</Text>
        <Text
          style={{
            color: theme.primary,
            fontSize: 14,
            fontWeight: "700",
          }}
        >
          💡 {selected.advice}
        </Text>

        <Text
          style={{
            color: "#FFFFFF77",
            fontSize: 13,
            marginTop: 14,
            lineHeight: 23,
          }}
        >
          {selected.adviceLong}
        </Text>

        <Pressable
          onPress={handleSelect}
          style={{
            marginTop: 20,
            backgroundColor: selected.colors.accent,
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
            Chọn mục tiêu này
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

export default TargetSheet;
