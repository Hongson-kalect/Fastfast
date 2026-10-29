import { ButtonEffect } from "@/components/effect/slots";
import { RADIUS } from "@/constants/design";
import { useAppStore } from "@/stores/appStore";
import Feather from "@expo/vector-icons/Feather";
import { resolveImageUri } from "@/utils/image";
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
  const theme = useAppStore((state) => state.theme);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={loading}
      hitSlop={8}
      style={{ borderRadius: RADIUS.md }}
      className={`h-16 w-16 flex-row items-center justify-center overflow-hidden border bg-card ${
        image ? "border-primary/50" : "border-text-base/10"
      } ${loading ? "opacity-60" : ""} ${className}`}
    >
      {loading ? (
        <ActivityIndicator color={theme.primary} />
      ) : image ? (
        <Image
          source={{ uri: resolveImageUri(image) ?? undefined }}
          className="h-16 w-16"
        />
      ) : (
        <Feather name="camera" size={22} color={theme.text + "CC"} />
      )}

      <ButtonEffect
        variant="secondary"
        radius={RADIUS.md}
        color={theme.primary}
        isCounting={false}
      />
    </TouchableOpacity>
  );
};
