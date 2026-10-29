import { RADIUS } from "@/constants/design";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { EffectContext } from "../types";
import { snowPalette } from "./palette";
import { SnowCap } from "./SnowCap";

/** Lớp tuyết mỏng đọng trên mép thanh tab nổi. Vẽ tĩnh. */
export const ChristmasTabBar = ({ isDarkMode, intensity }: EffectContext) => {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const palette = snowPalette(isDarkMode);

  return (
    <View
      style={[StyleSheet.absoluteFill, { borderRadius: RADIUS.lg, overflow: "hidden" }]}
      pointerEvents="none"
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setSize({ width, height });
      }}
    >
      {size.width > 0 && (
        <SnowCap
          width={size.width}
          height={size.height}
          radius={RADIUS.lg}
          thickness={intensity === "strong" ? 3.5 : 2.5}
          color={palette.snow}
          // Không đổ bóng: lớp mảnh mà có bóng tối trông như vệt bẩn trên nền tối
          shadowColor="transparent"
          strokeColor={palette.stroke}
          opacity={palette.capOpacity}
        />
      )}
    </View>
  );
};
