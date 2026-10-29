import { useState } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { ButtonEffectProps } from "../types";
import { snowPalette } from "./palette";
import { SnowCap } from "./SnowCap";
import { SnowflakePattern } from "./SnowflakePattern";

/** Mũ Noel vẽ bằng SVG (không có emoji mũ Noel riêng) */
const SantaHat = ({ fur }: { fur: string }) => (
  <Svg width={46} height={40} viewBox="0 0 46 40">
    {/* Thân mũ, chóp gập sang phải */}
    <Path d="M6 30 C 9 15, 20 5, 35 8 C 33 14, 33 21, 38 30 Z" fill="#D7263D" />
    <Path d="M24 7.5 C 30 6, 34 7, 35 8 C 33 14, 33 21, 38 30 L 31 30 C 28 20, 28 12, 24 7.5 Z" fill="#B01E32" />
    {/* Viền lông trắng và quả bông */}
    <Rect x={2} y={27} width={40} height={10} rx={5} fill={fur} />
    <Circle cx={36} cy={8} r={5} fill={fur} />
  </Svg>
);

// Lớp tuyết theo loại nút: nút chính đậm nhất, các nút phụ chỉ phủ mỏng
const CAP = {
  primary: { thickness: 7, dripScale: 1, opacity: 1 },
  secondary: { thickness: 2.5, dripScale: 0.25, opacity: 0.7 },
  chip: { thickness: 2.5, dripScale: 0.35, opacity: 0.75 },
};

/**
 * Trang trí nút theo Giáng sinh, toàn bộ vẽ tĩnh:
 * - mọi nút: lớp tuyết đọng trên mép trên
 * - nút chính: thêm hoa văn bông tuyết mờ hai đầu nút
 * - nút chính, mức "strong": thêm mũ Noel đội lệch góc trái
 */
export const ChristmasButton = ({
  intensity,
  isDarkMode,
  variant,
  radius,
  color,
  isCounting,
}: ButtonEffectProps) => {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const isPrimary = variant === "primary";
  const palette = snowPalette(isDarkMode);
  const cap = CAP[variant];

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setSize({ width, height });
      }}
    >
      {size.width > 0 && (
        <>
          {isPrimary && (
            <SnowflakePattern
              width={size.width}
              height={size.height}
              radius={Math.min(radius, size.height / 2)}
              // Nút "Bắt đầu" là nền gradient đậm: hoa văn trắng; "Kết thúc" là viền: theo màu nút
              color={isCounting ? color + "55" : palette.pattern}
            />
          )}

          <SnowCap
            width={size.width}
            height={size.height}
            radius={radius}
            thickness={cap.thickness}
            dripScale={cap.dripScale}
            color={palette.snow}
            shadowColor={palette.shadow}
            strokeColor={palette.stroke}
            opacity={palette.capOpacity * cap.opacity}
          />
        </>
      )}

      {isPrimary && intensity === "strong" && (
        <View style={styles.hat}>
          <SantaHat fur={palette.snow} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  hat: {
    position: "absolute",
    left: 6,
    top: -22,
    transform: [{ rotate: "-20deg" }],
  },
});
