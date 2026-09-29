export const isColorDark = (hex: string): boolean => { 
  // Bỏ dấu # nếu có 
  const cleanedHex = hex.replace("#", ""); // Chuyển sang R, G, B
  const r = parseInt(cleanedHex.substring(0, 2), 16); const g = parseInt(cleanedHex.substring(2, 4), 16); const b = parseInt(cleanedHex.substring(4, 6), 16); // Tính độ sáng theo công thức tiêu chuẩn 
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b; // Ngưỡng xác định: dưới 128 là tối 
  return luminance < 128; };

const adjustColorBrightness = (
  hex: string,
  percent: number,
): string => {
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

  const toHex = (value: number) =>
    value.toString(16).padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}${alpha}`.toUpperCase();
};

export const lighter = (
  hex: string,
  amount: number = 0.2,
): string => {
  return adjustColorBrightness(hex, Math.abs(amount));
};

export const darker = (
  hex: string,
  amount: number = 0.2,
): string => {
  return adjustColorBrightness(hex, -Math.abs(amount));
};

export const darkenColor = (
  hex: string,
  amount: number = 0.1,
): string => {
  return darker(hex, amount);
};