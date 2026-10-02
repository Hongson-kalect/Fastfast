import React from "react";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";

import { ThemedText } from "@/components/themed-text";
import { EMOTIONS, MoodLevel } from "@/constants/emotions";
import { useAppStore } from "@/stores/appStore";

type SwapMoodButtonProps = {
  mood?: MoodLevel;
  note?: string;
  loading?: boolean;
  className?: string;
  onPress: () => void;
};

export const SwapMoodButton = ({
  mood,
  note,
  loading = false,
  className = "",
  onPress,
}: SwapMoodButtonProps) => {
  const { theme } = useAppStore();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      disabled={loading}
      className={`h-18 w-18 flex-row items-center justify-center rounded-full border shadow-md ${
        mood
          ? "shadow-primary border-primary"
          : "shadow-text-base/40 border-text-base/40"
      } ${loading ? "opacity-60" : ""} ${className}`}
    >
      {loading ? (
        <ActivityIndicator color={theme.primary} />
      ) : (
        <View className="flex-1 items-center justify-center">
          {mood ? (
            <ThemedText size="lg">{EMOTIONS[mood].icon}</ThemedText>
          ) : (
            <Feather name="edit-2" size={28} color={theme.text} />
          )}

          {note && (
            <View className="absolute -top-4 right-0">
              <Ionicons name="chatbox" size={24} color={theme.text} />
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};