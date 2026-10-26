export const isColorDark = (hex: string): boolean => {
  // Bỏ dấu # nếu có
  const cleanedHex = hex.replace("#", ""); // Chuyển sang R, G, B
  const r = parseInt(cleanedHex.substring(0, 2), 16);
  const g = parseInt(cleanedHex.substring(2, 4), 16);
  const b = parseInt(cleanedHex.substring(4, 6), 16); // Tính độ sáng theo công thức tiêu chuẩn
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b; // Ngưỡng xác định: dưới 128 là tối
  return luminance < 128;
};

const adjustColorBrightness = (hex: string, percent: number): string => {
  let cleanHex = hex.replace("#", "");

  let alpha = "";

  if (cleanHex.length === 8) {
    alpha = cleanHex.slice(6, 8);
    cleanHex = cleanHex.slice(0, 6);
  }

  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split("")
      .map((char) => char + char)
      .join("");
  }

  const num = parseInt(cleanHex, 16);

  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;

  const value = Math.max(-1, Math.min(1, percent));

  if (value > 0) {
    r = Math.round(r + (255 - r) * value);
    g = Math.round(g + (255 - g) * value);
    b = Math.round(b + (255 - b) * value);
  } else {
    r = Math.round(r * (1 + value));
    g = Math.round(g * (1 + value));
    b = Math.round(b * (1 + value));
  }

  const toHex = (value: number) => value.toString(16).padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}${alpha}`.toUpperCase();
};

export const lighter = (hex: string, amount: number = 0.2): string => {
  return adjustColorBrightness(hex, Math.abs(amount));
};

export const darker = (hex: string, amount: number = 0.2): string => {
  return adjustColorBrightness(hex, -Math.abs(amount));
};

export const darkenColor = (hex: string, amount: number = 0.1): string => {
  return darker(hex, amount);
};

type RGB = {
  r: number;
  g: number;
  b: number;
  a: number;
};

const parseColor = (color: string): RGB | null => {
  const hex = color.trim();

  const match = hex.match(/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i);

  if (!match) return null;

  let value = match[1];

  if (value.length <= 4) {
    value = value
      .split("")
      .map((char) => char + char)
      .join("");
  }

  const hasAlpha = value.length === 8;

  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
    a: hasAlpha ? parseInt(value.slice(6, 8), 16) / 255 : 1,
  };
};

const compositeColor = (foreground: RGB, background: RGB): RGB => {
  const a = foreground.a + background.a * (1 - foreground.a);

  if (a === 0) {
    return { r: 0, g: 0, b: 0, a: 0 };
  }

  return {
    r:
      (foreground.r * foreground.a +
        background.r * background.a * (1 - foreground.a)) /
      a,
    g:
      (foreground.g * foreground.a +
        background.g * background.a * (1 - foreground.a)) /
      a,
    b:
      (foreground.b * foreground.a +
        background.b * background.a * (1 - foreground.a)) /
      a,
    a,
  };
};

const getLuminance = ({ r, g, b }: RGB): number => {
  const linearize = (value: number) => {
    const channel = value / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
};

export const getContrastTextColor = (
  backgroundColor: string,
  underlayColor = "#FFFFFF",
): "#000000" | "#FFFFFF" => {
  const foreground = parseColor(backgroundColor);
  const underlay = parseColor(underlayColor);

  if (!foreground || !underlay) return "#000000";

  const background =
    foreground.a < 1 ? compositeColor(foreground, underlay) : foreground;

  const luminance = getLuminance(background);

  const blackContrast = (luminance + 0.05) / 0.05;
  const whiteContrast = 1.05 / (luminance + 0.05);

  return blackContrast >= whiteContrast ? "#000000" : "#FFFFFF";
};
