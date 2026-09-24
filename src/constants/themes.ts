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
type PremiumThemeType = { type: "premium" };
type NormalThemeType = { type: "normal" };
type LimitedThemeType = {
  type: "limited";
  isMoonTime?: boolean;
  freeStartAt: string;
  freeEndAt: string;
  saleEndAt?: string;
};
export type ThemeItem = {
  light: ThemeType;
  dark: ThemeType;
} & (PremiumThemeType | NormalThemeType | LimitedThemeType);

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

export const themes: { [key: string]: ThemeItem } = {
  // ─────────────────────────────────────────────
  // SKY
  // ─────────────────────────────────────────────
  default: {
    type: "normal",
    light: {
      primary: "#0284C7",
      secondary: "#0369A1",
      tertiary: "#38BDF8",

      success: "#16A34A",
      error: "#DC2626",
      warning: "#D97706",
      info: "#0284C7",

      title: "#0F172A",
      text: "#334155",

      background: "#F8FAFC",
      background2: "#F1F5F9",
      card: "#FFFFFF",
    },

    dark: defaultDark,
  },

  // ─────────────────────────────────────────────
  // VIOLET
  // ─────────────────────────────────────────────
  violet: {
    type: "normal",
    light: {
      primary: "#7C3AED",
      secondary: "#6D28D9",
      tertiary: "#A78BFA",

      success: "#16A34A",
      error: "#DC2626",
      warning: "#D97706",
      info: "#6366F1",

      title: "#1E1B4B",
      text: "#37334D",

      background: "#FAF9FF",
      background2: "#F3F1FA",
      card: "#FFFFFF",
    },

    dark: {
      primary: "#8B5CF6",
      secondary: "#A78BFA",
      tertiary: "#C4B5FD",

      success: "#81C784",
      error: "#F87171",
      warning: "#FFB74D",
      info: "#818CF8",

      title: "#EDE9FE",
      text: "#F5F3FF",

      background: "#14121A",
      background2: "#1C1924",
      card: "#24202E",
    },
  },

  // ─────────────────────────────────────────────
  // EMERALD
  // ─────────────────────────────────────────────
  emerald: {
    type: "premium",
    light: {
      primary: "#059669",
      secondary: "#047857",
      tertiary: "#34D399",

      success: "#16A34A",
      error: "#DC2626",
      warning: "#D97706",
      info: "#0891B2",

      title: "#022C22",
      text: "#33413C",

      background: "#F7FCFA",
      background2: "#EEF8F4",
      card: "#FFFFFF",
    },

    dark: {
      primary: "#10B981",
      secondary: "#34D399",
      tertiary: "#6EE7B7",

      success: "#86EFAC",
      error: "#F87171",
      warning: "#FBBF24",
      info: "#67E8F9",

      title: "#D1FAE5",
      text: "#F0FDF4",

      background: "#0F1714",
      background2: "#17211D",
      card: "#1D2924",
    },
  },

  // ─────────────────────────────────────────────
  // ROSE
  // ─────────────────────────────────────────────
  rose: {
    type: "limited",
    freeStartAt: "2026-09-21",
    freeEndAt: "2026-09-28",
    light: {
      primary: "#E11D48",
      secondary: "#BE123C",
      tertiary: "#FB7185",

      success: "#16A34A",
      error: "#DC2626",
      warning: "#D97706",
      info: "#0284C7",

      title: "#4C0519",
      text: "#4A3440",

      background: "#FFF9FA",
      background2: "#FFF1F3",
      card: "#FFFFFF",
    },

    dark: {
      primary: "#F43F5E",
      secondary: "#FB7185",
      tertiary: "#FDA4AF",

      success: "#86EFAC",
      error: "#FB7185",
      warning: "#FBBF24",
      info: "#60A5FA",

      title: "#FFE4E6",
      text: "#FFF1F2",

      background: "#180F12",
      background2: "#211519",
      card: "#2A1B20",
    },
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

type ThemeAccessState =
  | "available"
  | "free"
  | "premium"
  | "purchase"
  | "unavailable";

export const getThemeAccess = (
  themeData: ThemeItem,
  owned: boolean,
  now = new Date(),
): ThemeAccessState => {
  if (owned) return "available";

  if (themeData.type === "normal") {
    return "available";
  }

  if (themeData.type === "premium") {
    return "premium";
  }

  const freeStart = themeData.freeStartAt
    ? new Date(themeData.freeStartAt)
    : null;

  const freeEnd = themeData.freeEndAt ? new Date(themeData.freeEndAt) : null;

  const saleEnd = themeData.saleEndAt ? new Date(themeData.saleEndAt) : null;

  if ((!freeStart || now >= freeStart) && (!freeEnd || now <= freeEnd)) {
    return "free";
  }

  if (!saleEnd || now <= saleEnd) {
    return "purchase";
  }

  return "unavailable";
};
