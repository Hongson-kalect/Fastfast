import { RADIUS, glow } from "@/constants/design";
import { useAppStore } from "@/stores/appStore";
import { getContrastTextColor } from "@/utils/color";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { LinearGradient } from "expo-linear-gradient";
import { ActivityIndicator, Pressable, View } from "react-native";
import { ThemedText } from "../../themed-text";
import { useT } from "@/providers/Language";

type SwapFastButtonProps = {
  isCounting: boolean;
  loading?: boolean;
  color: string;
  className?: string;
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  onLongPress?: () => void;
};

/** Nút hành động chính: viên thuốc gradient "Bắt đầu" / viền "Kết thúc". Nhấn giữ để chỉnh giờ. */
export const SwapFastButton = ({
  isCounting,
  loading = false,
  color,
  className = "",
  onPress,
  onPressIn,
  onPressOut,
  onLongPress,
}: SwapFastButtonProps) => {
  const theme = useAppStore((state) => state.theme);
  const t = useT();
  const textColor = isCounting
    ? color
    : theme.buttonText || getContrastTextColor(color);

  const content = loading ? (
    <ActivityIndicator color={textColor} />
  ) : (
    <View className="flex-row items-center gap-2.5">
      <FontAwesome6
        name={isCounting ? "stop" : "play"}
        size={18}
        color={textColor}
      />
      <ThemedText size="lg" weight="extrabold" colorHex={textColor}>
        {isCounting ? t("home.endFast") : t("home.startFast")}
      </ThemedText>
    </View>
  );

  return (
    <Pressable
      onLongPress={onLongPress}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={loading}
      hitSlop={8}
      className={`${loading ? "opacity-60" : ""} ${className}`}
      style={isCounting ? undefined : glow(color, 0.45)}
    >
      {isCounting ? (
        <View
          className="h-16 items-center justify-center border-2 px-6"
          style={{
            borderRadius: RADIUS.pill,
            borderColor: color,
            backgroundColor: color + "14",
          }}
        >
          {content}
        </View>
      ) : (
        <LinearGradient
          colors={[color, theme.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            height: 64,
            borderRadius: RADIUS.pill,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 24,
          }}
        >
          {content}
        </LinearGradient>
      )}
    </Pressable>
  );
};
