import { Text, type TextProps } from "react-native";

import { Opacity, TextSize, TextWeight } from "@/constants/theme";
import { ThemeType } from "@/constants/themes";
import { useAppStore } from "@/stores/appStore";
import { useMemo } from "react";

export type ThemedTextProps = TextProps & {
  color?: keyof ThemeType;
  size?: keyof typeof TextSize;
  weight?: keyof typeof TextWeight;
  colorHex?: string;
  opacity?: keyof typeof Opacity;
};

export function ThemedText({
  style,
  size = "md",
  weight = "regular",
  color,
  colorHex,
  ...rest
}: ThemedTextProps) {
  // const theme = useTheme();
  const { theme } = useAppStore();
  const colors = useMemo(() => {
    return theme;
  }, [theme]);

  return (
    <Text
      style={[
        {
          fontWeight: TextWeight[weight],
          ...TextSize[size],
          color: color ? colors[color] : colorHex || colors["text"],
          opacity: Opacity[rest.opacity || "full"],
        },
        style,
      ]}
      {...rest}
    />
  );
}
