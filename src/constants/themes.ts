export type ThemeObjType = keyof typeof themes;
export type ThemeType = {
  primary: string;
  secondary: string;
  tertiary: string;
  success: string;
  error: string;
  warning: string;
  info: string;
  title: string;
  text: string;
  background: string;
  background2: string;
  card: string;
};
export const defaultDark = {
  primary: "#3B82F6",
  secondary: "#64B5F6",
  tertiary: "#BBDEFB",

  success: "#81C784",
  error: "#E60000",
  warning: "#FFB74D",
  info: "#64B5F6",

  title: "#E3F2FD",
  text: "#FFFFFF",

  background: "#121212",
  background2: "#18181B",
  card: "#1E1E1E",
};

export const themes = {
  default: {
    light: {
      primary: "#0284C7", // Sky 600 - Xanh da trời hiện đại, đủ độ tương phản trên nền sáng
      secondary: "#0369A1", // Sky 700 - Tông đậm hơn để làm accent/hover
      tertiary: "#38BDF8", // Sky 400

      success: "#16A34A",
      error: "#DC2626",
      warning: "#D97706",
      info: "#0284C7",

      title: "#0F172A", // Slate 900 - Xanh đen đậm (sang hơn màu đen thuần #000)
      text: "#334155", // Slate 700 - Chữ xám đậm dịu mắt khi đọc dài

      background: "#F8FAFC", // Slate 50 - Off-white mát mắt, đỡ chói hơn #FFFFFF
      background2: "#F1F5F9", // Slate 100 - Dùng cho section/background secondary
      card: "#FFFFFF", // Card dùng màu trắng thuần kết hợp shadow nhẹ
    },

    dark: defaultDark,
  },
} as const;

export const extractTheme = ({
  theme,
  isDarkMode,
}: {
  theme?: string;
  isDarkMode?: boolean;
}): ThemeType => {
  const themeId = theme || "default";
  const themeObj = themes?.[themeId] || themes["default"];

  const mode = isDarkMode ?? true;
  return mode ? themeObj["dark"] : themeObj["light"];
};
