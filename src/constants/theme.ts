/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import "@/global.css";

import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#000000",
    background: "#ffffff",
    backgroundElement: "#F0F0F3",
    backgroundSelected: "#E0E1E6",
    textSecondary: "#60646C",
  },
  dark: {
    text: "#ffffff",
    background: "#000000",
    backgroundElement: "#212225",
    backgroundSelected: "#2E3135",
    textSecondary: "#B0B4BA",
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "var(--font-display)",
    serif: "var(--font-serif)",
    rounded: "var(--font-rounded)",
    mono: "var(--font-mono)",
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Opacity = {
  full: 1,
  hight: 0.9,
  medium: 0.7,
  half: 0.5,
  low: 0.3,
  fade: 0.1,
  none: 0,
};

export const TextSize = {
  tiny: {
    fontSize: 8,
    lineHeight: 10,
  },
  xxs: {
    fontSize: 10,
    lineHeight: 13,
  },
  xs: {
    fontSize: 12,
    lineHeight: 16,
  },

  sm: {
    fontSize: 14,
    lineHeight: 20,
  },

  md: {
    fontSize: 16,
    lineHeight: 24,
  },

  lg: {
    fontSize: 18,
    lineHeight: 26,
  },

  xl: {
    fontSize: 20,
    lineHeight: 28,
  },

  xxl: {
    fontSize: 24,
    lineHeight: 32,
  },

  xxxl: {
    fontSize: 32,
    lineHeight: 40,
  },

  display: {
    fontSize: 40,
    lineHeight: 48,
  },

  displayLarge: {
    fontSize: 48,
    lineHeight: 56,
  },
} as const;

export const TextWeight = {
  light: "300",
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
