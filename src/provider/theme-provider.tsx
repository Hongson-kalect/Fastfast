// src/components/ThemeProvider.tsx
import { useColorScheme, VariableContextProvider } from "nativewind";
import React, { useEffect } from "react";
import { View } from "react-native";
import { useAppSettingsStore } from "../store/useAppSettingStore";

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { theme } = useAppSettingsStore();
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    // Đồng bộ cơ chế light/dark ẩn của NativeWind
    setColorScheme(theme.mode);
  }, [theme.mode]);

  return (
    <VariableContextProvider
      value={{
        "--dynamic-primary": theme.colors.primary,
        "--dynamic-secondary": theme.colors.secondary,
        "--dynamic-title": theme.colors.title,
        "--dynamic-text-base": theme.colors.text,
        "--dynamic-textSecondary": theme.colors.textSecondary,
        "--dynamic-background": theme.colors.background,
        "--dynamic-backgroundSecondary": theme.colors.backgroundSecondary,
        "--dynamic-backgroundElement": theme.colors.backgroundElement,
        "--dynamic-backgroundSelected": theme.colors.backgroundSelected,
        "--dynamic-error": theme.colors.error,
        "--dynamic-success": theme.colors.success,
      }}
    >
      <View className="flex-1">{children}</View>
    </VariableContextProvider>
  );
};
