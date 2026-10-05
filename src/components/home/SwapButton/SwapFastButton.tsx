import { useAppStore } from "@/stores/appStore";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { ActivityIndicator, Pressable, View } from "react-native";

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
    <View
      className="rounded-full bg-background p-1.5 shadow-lg"
      style={{ shadowColor: color }}
    >
      <Pressable
        onLongPress={onLongPress}
        onPress={onPress}
        disabled={loading}
        hitSlop={8}
        className={`h-24 w-24 items-center justify-center rounded-full border-4 ${
          loading ? "opacity-60" : ""
        } ${className}`}
        style={{
          borderColor: color,
          backgroundColor: isCounting ? "transparent" : color,
        }}
      >
        {loading ? (
          <ActivityIndicator color={isCounting ? color : "white"} />
        ) : isCounting ? (
          <FontAwesome6 name="stop" size={40} color={color} />
        ) : (
          <FontAwesome6
            name="play"
            size={40}
            color="white"
            style={{ marginLeft: 6 }} // Căn lề icon Play cho cân thị giác
          />
        )}
      </Pressable>
    </View>
  );
};
