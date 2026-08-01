// src/components/ThemeProvider.tsx
import { useAppStore } from "@/stores/appStore";
import { useColorScheme, VariableContextProvider } from "nativewind";
import React from "react";
import { View } from "react-native";

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { theme } = useAppStore();
  const { setColorScheme } = useColorScheme();

  // useEffect(() => {
  //   setColorScheme(theme.mode);
  // }, [theme.mode]);

  return (
    <VariableContextProvider
      value={{
        "--dynamic-primary": theme.primary,
        "--dynamic-secondary": theme.secondary,
        "--dynamic-title": theme.title,
        "--dynamic-text-base": theme.text,
        "--dynamic-textSecondary": theme.textSecondary,
        "--dynamic-background": theme.background,
        "--dynamic-backgroundSecondary": theme.backgroundSecondary,
        "--dynamic-backgroundElement": theme.backgroundElement,
        "--dynamic-backgroundSelected": theme.backgroundSelected,
        "--dynamic-error": theme.error,
        "--dynamic-warning": theme.warning,
        "--dynamic-success": theme.success,
      }}
    >
      <View className="flex-1">{children}</View>
    </VariableContextProvider>
  );
};
