import { LinearGradient } from "expo-linear-gradient"; // Cần cài expo-linear-gradient
import { useEffect } from "react";
import {
  DimensionValue,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import Animated, {
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

type Props = {
  width: DimensionValue;
  height: DimensionValue;
  style?: StyleProp<ViewStyle>;
  active?: boolean;
};

export const SkeletonReact = ({
  width = "100%",
  height = 24,
  style,
  active = true,
}: Props) => {
  const translateX = useSharedValue(-1);

  useEffect(() => {
    if (active) {
      translateX.value = -1;
      translateX.value = withRepeat(
        withTiming(1, { duration: 1500 }),
        -1,
        false,
      );
    } else {
      // Nếu không active, hủy animation và đưa về vị trí cũ
      cancelAnimation(translateX);
      translateX.value = -1;
    }

    // CLEANUP FUNCTION: Cực kỳ quan trọng
    return () => {
      cancelAnimation(translateX);
    };
  }, [active, translateX]); // Thêm translateX vào dependency để chuẩn linter

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: interpolate(translateX.value, [-1, 1], [-150, 150]), // Điều chỉnh khoảng cách lướt
        },
      ],
    };
  });

  return (
    <View
      style={[
        {
          width,
          height,
          backgroundColor: "#D1D9DD",
          borderRadius: 4,
          overflow: "hidden",
        },
        style,
      ]}
    >
      {active && (
        <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
          <LinearGradient
            colors={["transparent", "rgba(255, 255, 255, 0.7)", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}
    </View>
  );
};
