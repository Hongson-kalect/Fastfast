import { View, type ViewProps } from "react-native";

import { ThemeColors, useAppSettingsStore } from "@/store/useAppSettingStore";

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
  const { theme } = useAppSettingsStore();

  return (
    <View
      style={[{ backgroundColor: theme.colors[type ?? "background"] }, style]}
      {...otherProps}
    />
  );
}
