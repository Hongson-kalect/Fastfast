import React, { useEffect } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const SNOW_COUNT = 30; // Số lượng hạt tuyết (30-40 hạt là đẹp và nhẹ)

interface SnowflakeProps {
  index: number;
}

const Snowflake: React.FC<SnowflakeProps> = ({ index }) => {
  // Config ngẫu nhiên cho từng hạt tuyết
  const startX = Math.random() * SCREEN_WIDTH;
  const size = Math.random() * 6 + 4; // Kích thước hạt từ 4px - 10px
  const opacity = Math.random() * 0.7 + 0.3; // Độ mờ từ 0.3 - 1.0
  const duration = Math.random() * 4000 + 4000; // Tốc độ rơi: 4s - 8s
  const swing = Math.random() * 30 - 15; // Đung đưa ngang -15px tới 15px

  const translateY = useSharedValue(-20);
  const translateX = useSharedValue(startX);

  useEffect(() => {
    // Animation rơi xuống lặp vô hạn
    translateY.value = withRepeat(
      withTiming(SCREEN_HEIGHT + 20, {
        duration,
        easing: Easing.linear,
      }),
      -1,
      false,
    );

    // Animation đung đưa sang 2 bên
    translateX.value = withRepeat(
      withSequence(
        withTiming(startX + swing, { duration: duration / 2 }),
        withTiming(startX - swing, { duration: duration / 2 }),
      ),
      -1,
      true,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: translateY.value },
        { translateX: translateX.value },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.snowflake,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          opacity,
        },
        animatedStyle,
      ]}
    />
  );
};

export const SnowEffect = () => {
  return (
    <View style={styles.container} pointerEvents="none">
      {Array.from({ length: SNOW_COUNT }).map((_, index) => (
        <Snowflake key={index} index={index} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    zIndex: 9999, // Luôn nằm trên cùng các UI khác
  },
  snowflake: {
    position: "absolute",
    backgroundColor: "#32ADE6", // Màu tuyết (có thể đổi sang '#FFFFFF' hoặc thêm shadow nhẹ)
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
  },
});
