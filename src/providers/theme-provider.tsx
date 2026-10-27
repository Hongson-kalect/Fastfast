import { useAppStore } from "@/stores/appStore";
import { VariableContextProvider } from "nativewind";
import React from "react";
import { View } from "react-native";

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const theme = useAppStore((state) => state.theme);
  
  return (
    <VariableContextProvider
      value={{
        "--dynamic-primary": theme.primary,
        "--dynamic-secondary": theme.secondary,
        "--dynamic-tertiary": theme.tertiary,
        "--dynamic-title": theme.title,
        "--dynamic-text-base": theme.text,
        "--dynamic-text-button": theme.buttonText,
        "--dynamic-background": theme.background,
        "--dynamic-background2": theme.background2,
        "--dynamic-card": theme.card,
        "--dynamic-error": theme.error,
        "--dynamic-warning": theme.warning,
        "--dynamic-success": theme.success,
        "--dynamic-info": theme.info,
      }}
    >
      <View className="flex-1">{children}</View>
    </VariableContextProvider>
  );
};
