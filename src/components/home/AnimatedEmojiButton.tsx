// components/AnimatedEmojiButton.tsx
import { RADIAL_ANGLES, RADIUS } from "@/constants/data";
import { Text, TouchableOpacity } from "react-native";
import Animated, {
  SharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

interface Props {
  index: number;
  emoji: string;
  isOpen: SharedValue<boolean>;
  onSelect: (emoji: string) => void;
}

export const AnimatedEmojiButton = ({
  index,
  emoji,
  isOpen,
  onSelect,
}: Props) => {
  const animatedStyle = useAnimatedStyle(() => {
    // Chuyển đổi góc từ Độ sang Radian
    const angleRad = (RADIAL_ANGLES[index] * Math.PI) / 180;

    // Nếu mở thì nhân với Bán kính, nếu đóng thì thu về tâm (0)
    const distance = isOpen.value ? RADIUS : 0;

    const translateX = distance * Math.cos(angleRad);
    const translateY = distance * Math.sin(angleRad); // Trong RN, Y âm là bay lên trên

    return {
      transform: [
        { translateX: withSpring(translateX, { damping: 12, stiffness: 90 }) },
        { translateY: withSpring(translateY, { damping: 12, stiffness: 90 }) },
        { scale: withSpring(isOpen.value ? 1.2 : 0, { damping: 10 }) },
      ],
      opacity: withSpring(isOpen.value ? 1 : 0),
    };
  });

  return (
    <Animated.View style={[animatedStyle, { position: "absolute" }]}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onSelect(emoji)}
        className="h-12 w-12 items-center justify-center rounded-full border border-text-base/10 bg-background2 shadow-lg shadow-background/50"
      >
        <Text className="text-2xl">{emoji}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
