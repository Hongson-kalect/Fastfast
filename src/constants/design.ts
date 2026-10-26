import { ThemeType } from "./themes";

// Design tokens dùng chung (xem docs/DESIGN.md). Màu luôn lấy từ theme động.

export const RADIUS = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 32,
  pill: 999,
} as const;

export const SCREEN_PADDING = 20;

// Chiều cao tab bar nổi + khoảng cách đáy → nội dung cuộn cần chừa ra
export const TAB_BAR_HEIGHT = 64;
export const TAB_BAR_BOTTOM_GAP = 12;
// Tab bar rộng hơn lề nội dung (SCREEN_PADDING) để nổi thành một lớp riêng
export const TAB_BAR_SIDE_GAP = 12;
export const TAB_BAR_SPACE = TAB_BAR_HEIGHT + TAB_BAR_BOTTOM_GAP + 24;

/** Gradient nhấn cho hành động chính, ghép từ màu theme. */
export const accentGradient = (theme: ThemeType) =>
  [theme.primary, theme.secondary] as const;

/** Nền card nổi: card pha nhẹ màu primary để có chiều sâu mà không cần bóng. */
export const heroGradient = (theme: ThemeType) =>
  [theme.primary + "26", theme.card, theme.card] as const;

/** Bóng mềm cùng tông màu (chỉ dùng cho phần tử nổi). */
export const glow = (color: string, strength = 0.35) => ({
  shadowColor: color,
  shadowOpacity: strength,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 6 },
  elevation: 8,
});
