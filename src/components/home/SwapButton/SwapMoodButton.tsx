import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";

import { ButtonEffect } from "@/components/effect/slots";
import { ThemedText } from "@/components/themed-text";
import { RADIUS } from "@/constants/design";
import { getEmotionPack, MoodLevel } from "@/constants/emotions";
import { useAppStore } from "@/stores/appStore";
import { useShallow } from "zustand/react/shallow";

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
  const { theme, settings } = useAppStore(
    useShallow((state) => ({ theme: state.theme, settings: state.settings })),
  );
  const isDark = settings?.is_dark_mode ?? true;
  const emotions = getEmotionPack(settings?.emotion_pack).emotions;
  // Mood 0 là mức hợp lệ, chỉ null/undefined mới là chưa chọn
  const hasMood = mood != null;
  const color = hasMood
    ? emotions[mood].color[isDark ? "dark" : "light"]
    : theme.card;

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
        borderColor: hasMood ? color : theme.text + "1A",
        borderRadius: RADIUS.md,
      }}
      className={`h-16 w-16 flex-row items-center justify-center border ${loading ? "opacity-60" : ""} ${className}`}
    >
      {/* Nằm dưới nội dung để emoji mood và huy hiệu ghi chú không bị che */}
      <ButtonEffect
        variant="secondary"
        radius={RADIUS.md}
        color={color}
        isCounting={false}
      />

      {loading ? (
        <ActivityIndicator color={theme.primary} />
      ) : (
        <View className="flex-1 items-center justify-center">
          {hasMood ? (
            <ThemedText size="lg">
              {emotions[mood].icon[isDark ? "dark" : "light"]}
            </ThemedText>
          ) : (
            <Feather name="smile" size={22} color={theme.text + "CC"} />
          )}

          {note && (
            <View className="absolute -top-3 -right-3 rounded-full bg-background p-0.5">
              <Ionicons name="chatbubble-ellipses" size={16} color={theme.primary} />
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};
