import { useAppStore } from "@/stores/appStore";
import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Path } from "react-native-svg";
import { ThemedText } from "../themed-text";

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface LiquidCircleProps {
  percent: number; // Từ 0 đến 100 (Tiến trình Habit)
  retainPercent?: number; // Từ 0 đến 100 (Tiến trình viền nạp Shield)
  color?: string; // Màu nước & viền Habit (Mặc định: #9333EA)
  retainColor?: string; // Màu viền Retain khi nạp Shield (Mặc định: #3B82F6)
  size?: number; // Đường kính hình tròn (Mặc định: 100px)
}

const LiquidCircle: React.FC<LiquidCircleProps> = ({
  percent = 50,
  retainPercent = 0,
  color = "#9333EA",
  retainColor = "#3B82F6",
  size = 100,
}) => {
  const { settings, theme } = useAppStore();
  const waveOffset = useSharedValue(0);
  const fillLevel = useSharedValue(0);
  const retainLevel = useSharedValue(0);

  // Giới hạn percent trong khoảng 0 - 100
  const clampedPercent = Math.min(Math.max(percent, 0), 100);
  const clampedRetain = Math.min(Math.max(retainPercent, 0), 100);

  // Thông số vẽ viền Retain Outer Ring
  const strokeWidth = 4;
  const outerSize = size + strokeWidth * 2 + 4; // Kích thước tổng thể bao gồm cả viền ngoài
  const radius = size / 2 + strokeWidth / 2 + 1;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    // Animation cuộn sóng chạy vô tận
    waveOffset.value = withRepeat(
      withTiming(2 * Math.PI, {
        duration: 2000,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  }, []);

  useEffect(() => {
    // Animation dâng mực nước mượt mà khi percent thay đổi
    fillLevel.value = withTiming(clampedPercent, {
      duration: 1000,
      easing: Easing.out(Easing.quad),
    });

    // Animation nạp viền Retain
    retainLevel.value = withTiming(clampedRetain, {
      duration: 800,
      easing: Easing.out(Easing.quad),
    });
  }, [clampedPercent, clampedRetain]);

  // Tạo đường dẫn Sine Wave động cho SVG Path
  const animatedPathProps = useAnimatedProps(() => {
    const waveAmplitude = 4; // Độ cao của đỉnh sóng (pixel)
    const waveFrequency = 1.5; // Số lượng ngọn sóng

    // Tính toán chiều cao mực nước từ bottom
    const currentFill = (fillLevel.value / 100) * size;
    const waterY = size - currentFill;

    let path = `M 0 ${waterY}`;

    // Vẽ từng điểm của đường sóng sine
    for (let x = 0; x <= size; x += 5) {
      const angle = (x / size) * Math.PI * 2 * waveFrequency + waveOffset.value;
      const y = waterY + Math.sin(angle) * waveAmplitude;
      path += ` L ${x} ${y}`;
    }

    // Đóng khung Path xuống góc dưới cùng của hình tròn
    path += ` L ${size} ${size} L 0 ${size} Z`;

    return { d: path };
  });

  // Animated Props cho viền Retain
  const animatedRetainCircleProps = useAnimatedProps(() => {
    const strokeDashoffset =
      circumference - (circumference * retainLevel.value) / 100;
    return {
      strokeDashoffset,
    };
  });

  return (
    <View
      style={{ width: outerSize, height: outerSize }}
      className="relative items-center justify-center"
    >
      {/* 1. KHUNG CHÍNH (INNER BUBBLE) */}
      <View
        style={{
          width: size,
          height: size,
          borderColor: color + "88",
          boxShadow: `0px 3px 6px ${color}66`,
        }}
        className="relative z-10 items-center justify-center overflow-hidden rounded-full border-2 bg-background"
      >
        {/* Khung chứa SVG Nước Sóng Sánh */}
        <View className="absolute inset-0">
          <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {/* Lớp sóng mờ phía sau tạo độ sâu (Parallax effect) */}
            <AnimatedPath
              animatedProps={animatedPathProps}
              fill={color}
              opacity={0.4}
              transform="translate(-5, -2)"
            />

            {/* Lớp sóng chính phía trước */}
            <AnimatedPath
              animatedProps={animatedPathProps}
              fill={color}
              opacity={0.85}
            />
          </Svg>
        </View>

        {/* TEXT HIỂN THỊ % ĐỢT SÓNG LÊN */}
        <View className="z-10 items-center justify-center">
          <ThemedText
            size="xxxl"
            weight="bold"
            color="text"
            style={{
              fontSize: Math.floor(size / 3),
              lineHeight: Math.floor(size / 3) + 4,
            }}
          >
            {Math.round(clampedPercent)}
          </ThemedText>

          <ThemedText size="xxs" weight="bold" color="text" opacity="medium">
            %
          </ThemedText>
        </View>
      </View>

      {/* 2. VIỀN RETAIN OUTER RING (XOAY TỪ MỐC 12 GIỜ) */}
      <View className="absolute left-0 top-0 z-20">
        <Svg
          width={outerSize}
          height={outerSize}
          style={{ transform: [{ rotate: "-90deg" }] }}
        >
          {/* Track chìm phía dưới */}
          <Circle
            cx={outerSize / 2}
            cy={outerSize / 2}
            r={radius}
            stroke={theme.text}
            strokeOpacity={0.15}
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {/* Viền Retain nạp chạy theo retainPercent */}
          {clampedRetain > 0 && (
            <AnimatedCircle
              cx={outerSize / 2}
              cy={outerSize / 2}
              r={radius}
              stroke={retainColor}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={circumference}
              animatedProps={animatedRetainCircleProps}
              strokeLinecap="round"
            />
          )}
        </Svg>
      </View>
    </View>
  );
};

export default LiquidCircle;
