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
    Math.min(255, parseInt(cleanedHex.substring(0, 2), 16) * (1 - amount))
  );
  const g = Math.max(
    0,
    Math.min(255, parseInt(cleanedHex.substring(2, 4), 16) * (1 - amount))
  );
  const b = Math.max(
    0,
    Math.min(255, parseInt(cleanedHex.substring(4, 6), 16) * (1 - amount))
  );

  return `#${Math.round(r).toString(16).padStart(2, "0")}${Math.round(g)
    .toString(16)
    .padStart(2, "0")}${Math.round(b).toString(16).padStart(2, "0")}`;
};
