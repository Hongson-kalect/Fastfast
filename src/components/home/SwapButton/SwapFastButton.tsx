import React from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useAppStore } from "@/stores/appStore";


type SwapFastButtonProps = {
  isCounting: boolean;
  loading?: boolean;
  color: string;
  className?: string;
  onPress: () => void;
  onLongPress: () => void;
};

export const SwapFastButton = ({
  isCounting,
  loading = false,
  color,
  className = "",
  onPress,
  onLongPress,
}: SwapFastButtonProps) => {
  const { theme } = useAppStore();

  return (
    <View className="rounded-full bg-background p-1">
      <Pressable
        onLongPress={onLongPress}
        onPress={onPress}
        disabled={loading}
        className={`h-28 w-28 flex-row items-center justify-center rounded-full px-6 ${
          loading ? "opacity-60" : ""
        } ${className}`}
        style={{
          borderWidth: 4,
          borderColor: color,
          backgroundColor: isCounting ? "transparent" : color,
          boxShadow: isCounting ? "none" : `1px 2px 4px ${color}`,
        }}
      >
        {loading ? (
          <ActivityIndicator color={theme.primary} />
        ) : isCounting ? (
          <FontAwesome6 name="stop" size={52} color={color} />
        ) : (
          <FontAwesome6
            name="play"
            size={52}
            color="white"
            style={{ marginLeft: 8 }}
          />
        )}
      </Pressable>
    </View>
  );
};