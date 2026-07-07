// themeContext.tsx
import React, { createContext, useState, useContext } from "react";
import { View } from "react-native";
import { lightTheme, darkTheme } from "../configs/theme";

const themes = {
  light: lightTheme,
  dark: darkTheme,
};

type ThemeType = "light" | "dark"; // 'light' | 'dark'
type Theme = typeof lightTheme;

interface ThemeContextProps {
  theme: Theme;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [themeName, setThemeName] = useState<ThemeType>("light");
  const [theme, setTheme] = useState<Theme>(themes[themeName]);

  const toggleTheme = (theme: ThemeType) => {
    const newTheme = themes[theme];
    if (!newTheme) return;
    setThemeName(theme);
    setTheme(newTheme);
  };

  const value = {
    theme,
    setTheme: toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      <View style={{ flex: 1, backgroundColor: themes[themeName].background }}>
        {children}
      </View>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
};
