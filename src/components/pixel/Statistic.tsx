import { EMOTIONS, FASTING_TARGETS } from "@/constants/data";
import { useAppStore } from "@/stores/appStore";
import { fixed } from "@/util/numberLimit";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { ThemedText } from "../themed-text";

const moodCount = [102, 25, 5, 2, 0, 10, 10];

type Props = {
  trackingType: "mood" | "fasting";
  setTrackingType: (mode: "mood" | "fasting") => void;
  stats: {
    fastDays: number;
    fastHour: number;
    logDays: number;
  };
};
const PixelStatistic = ({ setTrackingType, trackingType, stats }: Props) => {
  const { theme } = useAppStore();
  return (
    <View className="gap-4">
      <View className="flex-row gap-1 items-end">
        <Text className="text-sm text-text-base/80 font-semibold">
          📅 {stats.fastDays}
        </Text>
        <Text className="text-xs text-text-base/60">days</Text>
        <Text className="text-sm text-text-base">-</Text>
        <Text className="text-sm text-text-base/80 font-semibold">
          ⌛ {fixed(stats.fastHour)}
        </Text>
        <Text className="text-xs text-text-base/60">hours</Text>
        <Text className="text-sm text-text-base">-</Text>
        <Text className="text-sm text-text-base/80 font-semibold">
          ⌛ {fixed(stats.logDays)}
        </Text>
        <Text className="text-xs text-text-base/60">logs</Text>
      </View>

      <View className="flex-row justify-between items-center mt-8">
        {/* <View className=" items-center px-3 py-1 bg-primary rounded-lg gap-1 flex-row">
          <ThemedText className="text-[11px]! text-white! font-bold">
            Week of year
          </ThemedText>

          <Feather name="chevron-down" size={12} color="white" />
        </View> */}
        <Pressable
          hitSlop={10}
          onPress={() => alert("Change emoji style")}
          style={{ borderWidth: 0.5, borderColor: theme.warning }}
          className={`items-center flex-row px-3 py-1 rounded-lg gap-2`}
        >
          <ThemedText className="text-[11px]! text-warning! font-base!">
            Style
          </ThemedText>
          <Ionicons
            name="color-palette-outline"
            size={14}
            color={theme.warning}
          />
        </Pressable>

        <View className="flex-row items-center gap-1 justify-between">
          <Pressable
            hitSlop={10}
            onPress={() => setTrackingType("mood")}
            className={`items-center px-3 py-1 ${trackingType === "mood" ? "bg-primary" : "bg-background/60"} rounded-lg`}
          >
            <ThemedText className="text-[11px]! text-white! font-bold">
              Emotion
            </ThemedText>
          </Pressable>
          <Pressable
            hitSlop={10}
            onPress={() => setTrackingType("fasting")}
            className={`items-center px-3 py-1 ${trackingType === "fasting" ? "bg-primary" : "bg-background/60"} rounded-lg`}
          >
            <ThemedText className="text-[11px]! text-white! font-bold">
              Fast process
            </ThemedText>
          </Pressable>
        </View>
      </View>

      <View className="flex-row gap-2 mt-2">
        {trackingType === "mood" &&
          EMOTIONS.map((item, index) => (
            <View
              key={item.label}
              style={{ backgroundColor: item.color }}
              className="flex-1 px-2 py-1 rounded"
            >
              <View className="items-center justify-between">
                <ThemedText className="text-base!">{item.emoji}</ThemedText>
                <ThemedText className="text-[13px]! text-text-base/800!">
                  {moodCount[index || 0]}
                </ThemedText>
              </View>
              {/* <ThemedText className="text-white! text-xl! font-semibold! text-center mt-1 mb-0.5">
              {moodCount[index]}
            </ThemedText> */}
            </View>
          ))}
        {trackingType === "fasting" &&
          FASTING_TARGETS.map((item, index) => (
            <View
              key={item.label}
              style={{ backgroundColor: item.colors.accent + "aa" }}
              className="flex-1 px-2 py-1 rounded"
            >
              <View className="items-center justify-between">
                <ThemedText className="text-base!">{item.emoji}</ThemedText>
                <ThemedText className="text-[13px]! text-text-base/800!">
                  {moodCount[index || 0]}
                </ThemedText>
              </View>
              {/* <ThemedText className="text-white! text-xl! font-semibold! text-center mt-1 mb-0.5">
              {moodCount[index]}
            </ThemedText> */}
            </View>
          ))}
      </View>
    </View>
  );
};

export default PixelStatistic;
