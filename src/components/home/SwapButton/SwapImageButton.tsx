import React from "react";
import { ActivityIndicator, Image, TouchableOpacity } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useAppStore } from "@/stores/appStore";


type SwapImageButtonProps = {
  image?: string;
  loading?: boolean;
  className?: string;
  onPress: () => void;
};

export const SwapImageButton = ({
  image,
  loading = false,
  className = "",
  onPress,
}: SwapImageButtonProps) => {
  const { theme } = useAppStore();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={loading}
      className={`h-18 w-18 flex-row items-center justify-center rounded-full border shadow-md ${
        image
          ? "shadow-primary border-primary"
          : "shadow-text-base/40 border-text-base/40"
      } ${loading ? "opacity-60" : ""} ${className}`}
    >
      {loading ? (
        <ActivityIndicator color={theme.primary} />
      ) : image ? (
        <Image
          source={{ uri: image }}
          className="h-18 w-18 rounded-full"
        />
      ) : (
        <Feather name="image" size={28} color={theme.text} />
      )}
    </TouchableOpacity>
  );
};