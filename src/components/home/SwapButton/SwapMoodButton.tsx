import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { EMOTION_PACKS, MoodLevel } from "@/constants/emotions";
import { useAppStore } from "@/stores/appStore";

type SwapMoodButtonProps = {
  mood?: MoodLevel;
  note?: string;
  loading?: boolean;
  className?: string;
  onPress: () => void;
  onPressIn: () => void;
  onPressOut: () => void;
};

export const SwapMoodButton = ({
  mood,
  note,
  loading = false,
  className = "",
  onPress,
  onPressIn,
  onPressOut,
}: SwapMoodButtonProps) => {
  const { theme, settings } = useAppStore();
  const isDark = settings?.is_dark_mode ?? true;
  const emotions = EMOTION_PACKS[settings?.emotion_pack ?? "default"].emotions;
  const color = mood
    ? emotions[mood].color[isDark ? "dark" : "light"]
    : theme.text;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      hitSlop={8}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={loading}
      style={{
        backgroundColor: color,
        borderColor: color + "80",
      }}
      className={`h-18 w-18 flex-row items-center justify-center rounded-full border shadow-inner shadow-text-base/10 ${loading ? "opacity-60" : ""} ${className}`}
    >
      {loading ? (
        <ActivityIndicator color={theme.primary} />
      ) : (
        <View className="flex-1 items-center justify-center">
          {mood ? (
            <ThemedText size="lg">
              {emotions[mood].icon[isDark ? "dark" : "light"]}
            </ThemedText>
          ) : (
            <Feather name="edit-2" size={28} color={theme.text} />
          )}

          {note && (
            <View className="absolute -top-4 right-0 bg-background/80 rounded">
              <Ionicons
                name="chatbox-ellipses-outline"
                size={24}
                color={color}
              />
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};
