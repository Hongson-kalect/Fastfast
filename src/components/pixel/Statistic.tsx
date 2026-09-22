import { useAppStore } from "@/stores/appStore";
import { fixed } from "@/util/numberLimit";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";
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
      <View className="flex-row items-center gap-4">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="calendar-outline" size={15} color={theme.primary} />
          <ThemedText size="sm" weight="semibold" color="text">
            {stats.fastDays}
          </ThemedText>
          <ThemedText size="xs" color="text" opacity="medium">
            days
          </ThemedText>
        </View>

        <View className="flex-row items-center gap-1.5">
          <Ionicons name="time-outline" size={15} color={theme.success} />
          <ThemedText size="sm" weight="semibold" color="text">
            {fixed(stats.fastHour)}
          </ThemedText>
          <ThemedText size="xs" color="text" opacity="medium">
            hours
          </ThemedText>
        </View>

        <View className="flex-row items-center gap-1.5">
          <Ionicons
            name="document-text-outline"
            size={15}
            color={theme.warning}
          />
          <ThemedText size="sm" weight="semibold" color="text">
            {fixed(stats.logDays)}
          </ThemedText>
          <ThemedText size="xs" color="text" opacity="medium">
            logs
          </ThemedText>
        </View>
      </View>

      <View className="flex-row justify-between items-center mt-8">
        <Pressable
          hitSlop={10}
          onPress={() => alert("Change emoji style")}
          style={{ borderWidth: 0.5, borderColor: theme.warning }}
          className="items-center flex-row px-3 py-1.5 rounded-lg gap-2"
        >
          <ThemedText size="xs" color="warning">
            Style
          </ThemedText>
          <Ionicons
            name="color-palette-outline"
            size={14}
            color={theme.warning}
          />
        </Pressable>

        <View className="flex-row items-center gap-1">
          <Pressable
            hitSlop={10}
            style={{
              borderWidth: 0.5,
              borderColor:
                trackingType === "mood" ? theme.primary : theme.text + "80",
            }}
            onPress={() => setTrackingType("mood")}
            className={`items-center px-3 py-2 ${
              trackingType === "mood" ? "bg-primary" : "bg-background/60"
            } rounded-lg`}
          >
            <ThemedText
              size="xs"
              weight="medium"
              colorHex={trackingType === "mood" ? "#FFFFFF" : theme.text + "aa"}
            >
              Emotion
            </ThemedText>
          </Pressable>

          <Pressable
            hitSlop={10}
            style={{
              borderWidth: 0.5,
              borderColor:
                trackingType === "fasting" ? theme.primary : theme.text + "80",
            }}
            onPress={() => setTrackingType("fasting")}
            className={`items-center px-3 py-2 ${
              trackingType === "fasting" ? "bg-primary" : "bg-background/60"
            } rounded-lg`}
          >
            <ThemedText
              size="xs"
              weight="medium"
              colorHex={
                trackingType === "fasting" ? "#FFFFFF" : theme.text + "aa"
              }
            >
              Fast process
            </ThemedText>
          </Pressable>
        </View>
      </View>

      {/* ...phần dưới giữ nguyên */}
    </View>
  );
};

export default PixelStatistic;
