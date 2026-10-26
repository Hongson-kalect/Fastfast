export const Opacity = {
  full: 1,
  high: 0.9,
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
  extrabold: "800",
} as const;

// Font Mulish theo từng độ đậm. Android bỏ qua fontWeight khi dùng font custom,
// nên mỗi độ đậm phải trỏ tới đúng file font.
export const FontByWeight: Record<keyof typeof TextWeight, string> = {
  light: "MulishLight",
  regular: "MulishRegular",
  medium: "MulishMedium",
  semibold: "MulishSemiBold",
  bold: "MulishBold",
  extrabold: "MulishExtraBold",
};
