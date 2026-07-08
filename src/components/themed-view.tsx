import { View, type ViewProps } from "react-native";

import { ThemeColors } from "@/store/useAppSettingStore";
import { useAppStore } from "@/stores/appStore";

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: keyof ThemeColors;
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  type,
  ...otherProps
}: ThemedViewProps) {
  const { theme } = useAppStore();

  return (
    <View
      style={[{ backgroundColor: theme[type ?? "background"] }, style]}
      {...otherProps}
    />
  );
}
