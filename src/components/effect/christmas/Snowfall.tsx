import { useEffect, useState } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { EffectContext } from "../types";
import { snowPalette } from "./palette";

// Cực thưa: chỉ đủ gợi không khí, không phải "bão tuyết"
const FLAKE_COUNT = { light: 6, strong: 12 };

type Flake = {
  x: number;
  size: number;
  opacity: number;
  duration: number;
  swing: number;
  phase: number;
};

const createFlake = (width: number): Flake => ({
  x: Math.random() * width,
  size: Math.random() * 2.5 + 2,
  opacity: Math.random() * 0.3 + 0.25,
  // Rơi chậm, 14–22s cho hết chiều cao màn hình
  duration: Math.random() * 8000 + 14000,
  swing: Math.random() * 14 + 6,
  // Lệch pha để các hạt không cùng xuất phát từ mép trên
  phase: Math.random(),
});

const Flake = ({ flake, height, color }: { flake: Flake; height: number; color: string }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: flake.duration, easing: Easing.linear }),
      -1,
      false,
    );
    return () => cancelAnimation(progress);
  }, [flake.duration, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const t = (progress.value + flake.phase) % 1;
    return {
      transform: [
        { translateY: t * (height + 20) - 10 },
        { translateX: Math.sin(t * Math.PI * 4) * flake.swing },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.flake,
        {
          left: flake.x,
          width: flake.size,
          height: flake.size,
          borderRadius: flake.size / 2,
          opacity: flake.opacity,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
};

const FlakeLayer = ({ count, width, height, color }: {
  count: number;
  width: number;
  height: number;
  color: string;
}) => {
  const [flakes] = useState(() => Array.from({ length: count }, () => createFlake(width)));
  return (
    <>
      {flakes.map((flake, index) => (
        <Flake key={index} flake={flake} height={height} color={color} />
      ))}
    </>
  );
};

/**
 * Tuyết rơi rất thưa phía sau nội dung: chỉ thấy ở khoảng trống giữa các thẻ,
 * không bao giờ bay qua chữ. Gỡ hẳn khi không animate (rời tab / giảm chuyển động).
 */
export const Snowfall = ({ intensity, isDarkMode, animate }: EffectContext) => {
  const { width, height } = useWindowDimensions();
  if (!animate) return null;

  const count = FLAKE_COUNT[intensity];
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Đổi cường độ / xoay màn hình thì tạo lại bộ hạt */}
      <FlakeLayer
        key={`${count}-${width}`}
        count={count}
        width={width}
        height={height}
        color={snowPalette(isDarkMode).flake}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  flake: {
    position: "absolute",
    top: 0,
  },
});
