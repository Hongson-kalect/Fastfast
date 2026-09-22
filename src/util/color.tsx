export const isColorDark = (hex: string): boolean => {
  // Bỏ dấu # nếu có
  const cleanedHex = hex.replace("#", "");

  // Chuyển sang R, G, B
  const r = parseInt(cleanedHex.substring(0, 2), 16);
  const g = parseInt(cleanedHex.substring(2, 4), 16);
  const b = parseInt(cleanedHex.substring(4, 6), 16);

  // Tính độ sáng theo công thức tiêu chuẩn
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

  // Ngưỡng xác định: dưới 128 là tối
  return luminance < 128;
};

export const darkenColor = (hex: string, amount: number = 0.1): string => {
  const cleanedHex = hex.replace("#", "");

  const r = Math.max(
    0,
    Math.min(255, parseInt(cleanedHex.substring(0, 2), 16) * (1 - amount)),
  );
  const g = Math.max(
    0,
    Math.min(255, parseInt(cleanedHex.substring(2, 4), 16) * (1 - amount)),
  );
  const b = Math.max(
    0,
    Math.min(255, parseInt(cleanedHex.substring(4, 6), 16) * (1 - amount)),
  );

  return `#${Math.round(r).toString(16).padStart(2, "0")}${Math.round(g)
    .toString(16)
    .padStart(2, "0")}${Math.round(b).toString(16).padStart(2, "0")}`;
};

/**
 * Điều chỉnh độ sáng của mã màu Hex.
 * @param hex Mã màu dạng Hex (ví dụ: '#38BDF8' hoặc '#38BDF840')
 * @param percent Phần trăm điều chỉnh (-1.0 đến 1.0). Dương = Sáng hơn, Âm = Tối hơn
 */
const adjustColorBrightness = (hex: string, percent: number): string => {
  // Loại bỏ dấu # nếu có
  let cleanHex = hex.replace("#", "");

  // Tách lấy phần Alpha nếu là Hex 8 ký tự (#RRGGBBAA)
  let alpha = "";
  if (cleanHex.length === 8) {
    alpha = cleanHex.slice(6, 8);
    cleanHex = cleanHex.slice(0, 6);
  }

  // Chuyển Hex 3 ký tự (#RGB) sang 6 ký tự (#RRGGBB) nếu cần
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split("")
      .map((char) => char + char)
      .join("");
  }

  // Chuyển sang giá trị RGB
  const num = parseInt(cleanHex, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;

  // Tính toán RGB mới theo phần trăm
  if (percent > 0) {
    // Làm sáng: tiến dần về 255 (trắng)
    r = Math.round(r + (255 - r) * percent);
    g = Math.round(g + (255 - g) * percent);
    b = Math.round(b + (255 - b) * percent);
  } else {
    // Làm tối: tiến dần về 0 (đen)
    r = Math.round(r * (1 + percent));
    g = Math.round(g * (1 + percent));
    b = Math.round(b * (1 + percent));
  }

  // Đảm bảo giá trị luôn nằm trong khoảng [0, 255]
  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));

  // Chuyển lại thành chuỗi Hex 2 chữ số
  const toHex = (n: number) => n.toString(16).padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}${alpha}`.toUpperCase();
};

/**
 * Làm sáng màu Hex
 * @param hex Mã màu Hex
 * @param amount Tỉ lệ làm sáng từ 0.0 đến 1.0 (Mặc định: 0.2 = sáng hơn 20%)
 */
export const lighter = (hex: string, amount: number = 0.2): string => {
  return adjustColorBrightness(hex, Math.abs(amount));
};

/**
 * Làm tối màu Hex
 * @param hex Mã màu Hex
 * @param amount Tỉ lệ làm tối từ 0.0 đến 1.0 (Mặc định: 0.2 = tối hơn 20%)
 */
export const darker = (hex: string, amount: number = 0.2): string => {
  return adjustColorBrightness(hex, -Math.abs(amount));
};
