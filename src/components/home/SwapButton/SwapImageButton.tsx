import { useAppStore } from "@/stores/appStore";
import Feather from "@expo/vector-icons/Feather";
import { ActivityIndicator, Image, TouchableOpacity } from "react-native";

type SwapImageButtonProps = {
  image?: string;
  loading?: boolean;
  className?: string;
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
};

export const SwapImageButton = ({
  image,
  loading = false,
  className = "",
  onPress,
  onPressIn,
  onPressOut,
}: SwapImageButtonProps) => {
  const { theme } = useAppStore();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={loading}
      hitSlop={8}
      className={`h-18 w-18 flex-row items-center justify-center rounded-full overflow-hidden border shadow-inner ${
        image
          ? "shadow-primary/50 border-primary/50"
          : "shadow-text-base/10 border-text-base/10"
      } ${loading ? "opacity-60" : ""} ${className}`}
    >
      {loading ? (
        <ActivityIndicator color={theme.primary} />
      ) : image ? (
        <Image source={{ uri: image }} className="h-18 w-18" />
      ) : (
        <Feather name="image" size={28} color={theme.text} />
      )}
    </TouchableOpacity>
  );
};
