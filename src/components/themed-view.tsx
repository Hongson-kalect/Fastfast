import { View, type ViewProps } from "react-native";

import { ThemeType } from "@/constants/themes";
import { useAppStore } from "@/stores/appStore";

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: keyof ThemeType;
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  type,
  ...otherProps
}: ThemedViewProps) {
  const theme = useAppStore((state) => state.theme);

  return (
    <View
      style={[{ backgroundColor: theme[type ?? "background"] }, style]}
      {...otherProps}
    />
  );
}
