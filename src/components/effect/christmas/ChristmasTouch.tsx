import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { TOUCH_EFFECT_DURATION, TouchEffectProps } from "../types";
import { snowPalette } from "./palette";
import { flakePath } from "./SnowflakePattern";

const PARTICLES = { light: 4, strong: 6 };
const FLAKE_SIZE = 9;

type Particle = { angle: number; distance: number; spin: number };

const createParticles = (count: number): Particle[] =>
  Array.from({ length: count }, (_, index) => ({
    // Toả đều quanh điểm chạm, lệch ngẫu nhiên một chút cho tự nhiên
    angle: (index / count) * 2 * Math.PI + (Math.random() - 0.5) * 0.6,
    distance: 16 + Math.random() * 14,
    spin: (Math.random() - 0.5) * 120,
  }));

const FLAKE_D = flakePath(FLAKE_SIZE / 2, FLAKE_SIZE / 2, FLAKE_SIZE - 1);

const BurstFlake = ({
  particle,
  progress,
  color,
}: {
  particle: Particle;
  progress: SharedValue<number>;
  color: string;
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    const t = progress.value;
    return {
      opacity: 1 - t,
      transform: [
        { translateX: Math.cos(particle.angle) * particle.distance * t },
        // Hơi rơi xuống ở cuối như bông tuyết thật
        { translateY: Math.sin(particle.angle) * particle.distance * t + 6 * t * t },
        { rotate: `${particle.spin * t}deg` },
        { scale: 1 - 0.4 * t },
      ],
    };
  });

  return (
    <Animated.View style={[styles.flake, animatedStyle]}>
      <Svg width={FLAKE_SIZE} height={FLAKE_SIZE}>
        <Path d={FLAKE_D} stroke={color} strokeWidth={1.4} strokeLinecap="round" />
      </Svg>
    </Animated.View>
  );
};

/** Vài bông tuyết nhỏ toả ra từ điểm chạm rồi tan */
export const ChristmasTouch = ({ x, y, intensity, isDarkMode }: TouchEffectProps) => {
  const [particles] = useState(() => createParticles(PARTICLES[intensity]));
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, {
      duration: TOUCH_EFFECT_DURATION,
      easing: Easing.out(Easing.quad),
    });
  }, [progress]);

  // Nền sáng dùng xanh xám đậm hơn để thấy được; nền tối dùng trắng xám
  const color = isDarkMode ? snowPalette(true).flake : "#7D9BB8";

  return (
    <View style={[styles.origin, { left: x, top: y }]}>
      {particles.map((particle, index) => (
        <BurstFlake key={index} particle={particle} progress={progress} color={color} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  origin: {
    position: "absolute",
    width: 0,
    height: 0,
  },
  flake: {
    position: "absolute",
    left: -FLAKE_SIZE / 2,
    top: -FLAKE_SIZE / 2,
  },
});
