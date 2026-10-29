import { RADIUS } from "@/constants/design";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { EffectContext } from "../types";
import { snowPalette } from "./palette";
import { PatternFlake, SnowflakePattern } from "./SnowflakePattern";

// Bông tuyết lớn rải ở bốn góc và mép, tránh vùng vòng tròn ở giữa
const CARD_FLAKES: PatternFlake[] = [
  { x: 0.08, y: 0.08, size: 30 },
  { x: 0.2, y: 0.03, size: 14 },
  { x: 0.93, y: 0.1, size: 22 },
  { x: 0.05, y: 0.45, size: 12 },
  { x: 0.96, y: 0.55, size: 16 },
  { x: 0.07, y: 0.91, size: 22 },
  { x: 0.92, y: 0.9, size: 32 },
  { x: 0.78, y: 0.97, size: 12 },
];

/** Hoa văn bông tuyết siêu mờ trên nền ô vòng tròn. Vẽ tĩnh. */
export const ChristmasCard = ({ isDarkMode }: EffectContext) => {
  const [size, setSize] = useState({ width: 0, height: 0 });

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
        <SnowflakePattern
          width={size.width}
          height={size.height}
          radius={RADIUS.xl}
          color={snowPalette(isDarkMode).cardPattern}
          flakes={CARD_FLAKES}
        />
      )}
    </View>
  );
};
