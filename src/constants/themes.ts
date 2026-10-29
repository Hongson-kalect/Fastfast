import { lunarToSolar } from "@/utils/lunar";


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
  buttonText: string;
  background: string;
  background2: string;
  card: string;
};
type PremiumThemeType = { type: "premium" };
type NormalThemeType = { type: "normal" };
/** Theme theo sự kiện, lặp lại hằng năm: miễn phí trong dịp sự kiện, bán thêm
 * `saleDays` ngày, rồi khoá đến lần sau (người đã mua giữ mãi) */
type LimitedThemeType = {
  type: "limited";
  /** Ngày tính theo âm lịch Việt Nam (UTC+7) thay vì dương lịch */
  isMoonTime?: boolean;
  /** "MM-DD", ngày đầu được dùng miễn phí */
  freeFrom: string;
  /** "MM-DD", ngày cuối được dùng miễn phí (tính cả ngày đó); nhỏ hơn
   * `freeFrom` nghĩa là vắt sang năm sau */
  freeTo: string;
  /** Số ngày còn bán sau ngày miễn phí cuối; 0 = không bán (chỉ miễn phí trong dịp, hết dịp là khoá) */
  saleDays: number;
};
export type ThemeItem = {
  light: ThemeType;
  dark: ThemeType;
  /** Bộ icon đi kèm theme (key trong EMOTION_PACKS / TARGET_PACKS); chọn theme sẽ hỏi có đổi không */
  iconPacks?: { emotion?: string; target?: string };
  /** Bộ effect trang trí (key trong EFFECTS); cường độ do cài đặt `effect_intensity` */
  effect?: "christmas";
} & (PremiumThemeType | NormalThemeType | LimitedThemeType);

// Nền xanh than nhẹ thay vì xám trung tính để có chiều sâu; card sáng hơn nền một bậc
export const defaultDark = {
  primary: "#3B82F6",
  secondary: "#60A5FA",
  tertiary: "#93C5FD",

  success: "#4ADE80",
  error: "#F87171",
  warning: "#FBBF24",
  info: "#60A5FA",

  title: "#EEF2FF",
  text: "#E2E8F0",

  buttonText: "#FFFFFF",

  background: "#0E1117",
  background2: "#1A1F2B",
  card: "#161B24",
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

      buttonText: "#FFFFFF",

      background: "#F8FAFC",
      background2: "#F1F5F9",
      card: "#FFFFFF",
    },

    dark: defaultDark,
  },

  black: {
    type: "normal",
    light: {
      primary: "#171717",
      secondary: "#404040",
      tertiary: "#737373",

      success: "#16A34A",
      error: "#DC2626",
      warning: "#D97706",
      info: "#525252",

      title: "#000000",
      text: "#262626",

      buttonText: "#FFFFFF",

      background: "#FFFFFF",
      background2: "#F5F5F5",
      card: "#FFFFFF",
    },

    dark: {
      primary: "#FFFFFF",
      secondary: "#D4D4D4",
      tertiary: "#A3A3A3",

      success: "#81C784",
      error: "#F87171",
      warning: "#FFB74D",
      info: "#D4D4D4",

      title: "#FFFFFF",
      text: "#E5E5E5",

      buttonText: "#000000",

      background: "#000000",
      background2: "#171717",
      card: "#262626",
    },
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

      buttonText: "#FFFFFF",

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

      buttonText: "#000000",

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

      buttonText: "#FFFFFF",

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

      buttonText: "#000000",

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
    // Quanh Trung thu (15/8 âm lịch)
    isMoonTime: true,
    freeFrom: "08-11",
    freeTo: "08-18",
    saleDays: 7,
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

      buttonText: "#FFFFFF",

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

      buttonText: "#000000",

      background: "#180F12",
      background2: "#211519",
      card: "#2A1B20",
    },
  },

  // ─────────────────────────────────────────────
  // EMBER — cam lửa, hợp chủ đề "đốt mỡ"
  // ─────────────────────────────────────────────
  ember: {
    type: "normal",
    light: {
      primary: "#F2652A",
      secondary: "#FB923C",
      tertiary: "#F43F5E",

      success: "#16A34A",
      error: "#DC2626",
      warning: "#D97706",
      info: "#0EA5E9",

      title: "#2A1608",
      text: "#4A3428",

      buttonText: "#FFFFFF",

      background: "#FFF8F3",
      background2: "#FCEDE3",
      card: "#FFFFFF",
    },

    dark: {
      primary: "#FF7A45",
      secondary: "#FFB547",
      tertiary: "#FF4D6D",

      success: "#34D399",
      error: "#F87171",
      warning: "#FBBF24",
      info: "#60A5FA",

      title: "#FFF1E8",
      text: "#F3E6DD",

      buttonText: "#1A0B04",

      background: "#140E0B",
      background2: "#22170F",
      card: "#1C1410",
    },
  },

  // ─────────────────────────────────────────────
  // OCEAN — xanh ngọc, mát và tỉnh táo
  // ─────────────────────────────────────────────
  ocean: {
    type: "normal",
    light: {
      primary: "#0891B2",
      secondary: "#06B6D4",
      tertiary: "#14B8A6",

      success: "#16A34A",
      error: "#DC2626",
      warning: "#D97706",
      info: "#0284C7",

      title: "#082F3A",
      text: "#2F4A52",

      buttonText: "#FFFFFF",

      background: "#F3FBFC",
      background2: "#E5F5F8",
      card: "#FFFFFF",
    },

    dark: {
      primary: "#22D3EE",
      secondary: "#2DD4BF",
      tertiary: "#67E8F9",

      success: "#34D399",
      error: "#F87171",
      warning: "#FBBF24",
      info: "#38BDF8",

      title: "#E0FAFF",
      text: "#D5EEF2",

      buttonText: "#04161B",

      background: "#071317",
      background2: "#0E2128",
      card: "#0B1B21",
    },
  },

  // ─────────────────────────────────────────────
  // SAKURA — hồng anh đào (premium)
  // ─────────────────────────────────────────────
  sakura: {
    type: "premium",
    light: {
      primary: "#EC4899",
      secondary: "#F472B6",
      tertiary: "#A855F7",

      success: "#16A34A",
      error: "#DC2626",
      warning: "#D97706",
      info: "#8B5CF6",

      title: "#3B0A25",
      text: "#57304A",

      buttonText: "#FFFFFF",

      background: "#FFF7FB",
      background2: "#FCE7F3",
      card: "#FFFFFF",
    },

    dark: {
      primary: "#F472B6",
      secondary: "#F9A8D4",
      tertiary: "#C084FC",

      success: "#86EFAC",
      error: "#FB7185",
      warning: "#FBBF24",
      info: "#C084FC",

      title: "#FFE4F1",
      text: "#F5DCEA",

      buttonText: "#2A0A1B",

      background: "#170D13",
      background2: "#24141E",
      card: "#1E1119",
    },
  },

  // ─────────────────────────────────────────────
  // MIDNIGHT — chàm đêm (premium)
  // ─────────────────────────────────────────────
  midnight: {
    type: "premium",
    light: {
      primary: "#4F46E5",
      secondary: "#6366F1",
      tertiary: "#0EA5E9",

      success: "#16A34A",
      error: "#DC2626",
      warning: "#D97706",
      info: "#0EA5E9",

      title: "#1E1B4B",
      text: "#3A3B5C",

      buttonText: "#FFFFFF",

      background: "#F6F7FF",
      background2: "#ECEEFE",
      card: "#FFFFFF",
    },

    dark: {
      primary: "#818CF8",
      secondary: "#A5B4FC",
      tertiary: "#38BDF8",

      success: "#4ADE80",
      error: "#F87171",
      warning: "#FBBF24",
      info: "#38BDF8",

      title: "#EEF0FF",
      text: "#DADCF5",

      buttonText: "#0B0D1E",

      background: "#0B0D1E",
      background2: "#151935",
      card: "#11142A",
    },
  },
  // ─────────────────────────────────────────────
  // CHRISTMAS — đỏ, xanh thông, vàng nến (limited, tháng 12)
  // Theme tạo không khí sự kiện / để chia sẻ: miễn phí cả tháng, không bán
  // ─────────────────────────────────────────────
  christmas: {
    type: "limited",
    freeFrom: "12-01",
    freeTo: "12-31",
    saleDays: 0,
    iconPacks: { emotion: "christmas_mood", target: "christmas_targets" },
    effect: "christmas",
    light: {
      primary: "#C0262D",
      secondary: "#15803D",
      tertiary: "#C9961A",

      success: "#15803D",
      error: "#DC2626",
      warning: "#D97706",
      info: "#0369A1",

      title: "#2A0E10",
      text: "#4A3A36",

      buttonText: "#FFFFFF",

      background: "#FFFAF4",
      background2: "#F8EEE2",
      card: "#FFFFFF",
    },

    dark: {
      primary: "#E5484D",
      secondary: "#3DBE7F",
      tertiary: "#F2C14E",

      success: "#4ADE80",
      error: "#F87171",
      warning: "#FBBF24",
      info: "#60A5FA",

      title: "#FFF4E6",
      text: "#EDE3D6",

      buttonText: "#FFFFFF",

      background: "#0C1511",
      background2: "#16241D",
      card: "#121E18",
    },
  },
} satisfies Record<string, ThemeItem>;

export type ThemeKey = keyof typeof themes;

export const extractTheme = ({
  theme,
  isDarkMode,
}: {
  theme?: ThemeKey;
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

const parseMonthDay = (value: string) => {
  const [month, day] = value.split("-").map(Number);
  return { month, day };
};

/** Ngày "MM-DD" của năm `year` (âm lịch nếu isMoonTime), lúc 0h giờ máy */
const resolveDay = (value: string, year: number, isMoonTime?: boolean) => {
  const { month, day } = parseMonthDay(value);
  return isMoonTime
    ? lunarToSolar(day, month, year)
    : new Date(year, month - 1, day);
};

const addDays = (date: Date, days: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

/** Dịp sự kiện bắt đầu trong năm `year`: [freeStart, freeEnd) rồi [freeEnd, saleEnd) */
const getLimitedWindow = (theme: LimitedThemeType, year: number) => {
  const crossesYear = theme.freeTo < theme.freeFrom;
  const freeStart = resolveDay(theme.freeFrom, year, theme.isMoonTime);
  const lastFreeDay = resolveDay(
    theme.freeTo,
    crossesYear ? year + 1 : year,
    theme.isMoonTime,
  );
  const freeEnd = addDays(lastFreeDay, 1);
  return { freeStart, lastFreeDay, freeEnd, saleEnd: addDays(freeEnd, theme.saleDays) };
};

/**
 * Trạng thái theme limited tại `now`: "free" trong dịp sự kiện, "purchase" trong
 * `saleDays` ngày sau đó, còn lại "unavailable". Xét cả dịp bắt đầu năm trước
 * vì dịp vắt qua năm mới / thời gian bán có thể kéo sang năm nay.
 */
export const getLimitedThemeStatus = (
  theme: ThemeItem,
  now = new Date(),
): { state: "free" | "purchase" | "unavailable"; until?: Date } => {
  if (theme.type !== "limited") return { state: "unavailable" };

  const year = now.getFullYear();
  for (const event of [getLimitedWindow(theme, year - 1), getLimitedWindow(theme, year)]) {
    if (now >= event.freeStart && now < event.freeEnd) {
      return { state: "free", until: event.lastFreeDay };
    }
    if (now >= event.freeEnd && now < event.saleEnd) {
      return { state: "purchase", until: addDays(event.saleEnd, -1) };
    }
  }
  return { state: "unavailable" };
};

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

  return getLimitedThemeStatus(themeData, now).state;
};
