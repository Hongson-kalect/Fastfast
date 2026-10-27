

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

// APCA (SAPC 0.0.98G-4g): đo tương phản theo cảm nhận, hợp hơn công thức
// WCAG 2 với các màu bão hoà tầm trung (cam, xanh dương, hồng...) vốn bị
// WCAG 2 chọn chữ đen dù chữ trắng dễ đọc hơn.
const APCA = {
  blackThreshold: 0.022,
  blackClamp: 1.414,
  scale: 1.14,
  offset: 0.027,
  loClip: 0.1,
};

// Độ sáng theo APCA: gamma 2.4 đơn giản, kẹp vùng gần đen
const getApcaLuminance = ({ r, g, b }: RGB): number => {
  const channel = (value: number) => (value / 255) ** 2.4;
  const y =
    0.2126729 * channel(r) + 0.7151522 * channel(g) + 0.072175 * channel(b);

  return y > APCA.blackThreshold
    ? y
    : y + (APCA.blackThreshold - y) ** APCA.blackClamp;
};

/** Độ tương phản Lc (giá trị tuyệt đối, 0–~108) của chữ trên nền. */
const getApcaContrast = (text: RGB, background: RGB): number => {
  const yText = getApcaLuminance(text);
  const yBackground = getApcaLuminance(background);

  // Chữ tối trên nền sáng và ngược lại dùng số mũ khác nhau
  const sapc =
    yBackground > yText
      ? (yBackground ** 0.56 - yText ** 0.57) * APCA.scale
      : (yBackground ** 0.65 - yText ** 0.62) * APCA.scale;

  const magnitude = Math.abs(sapc);
  return magnitude < APCA.loClip ? 0 : (magnitude - APCA.offset) * 100;
};

const BLACK: RGB = { r: 0, g: 0, b: 0, a: 1 };
const WHITE: RGB = { r: 255, g: 255, b: 255, a: 1 };

export const getContrastTextColor = (
  backgroundColor: string,
  underlayColor = "#FFFFFF",
): "#000000" | "#FFFFFF" => {
  const foreground = parseColor(backgroundColor);
  const underlay = parseColor(underlayColor);

  if (!foreground || !underlay) return "#000000";

  const background =
    foreground.a < 1 ? compositeColor(foreground, underlay) : foreground;

  return getApcaContrast(WHITE, background) > getApcaContrast(BLACK, background)
    ? "#FFFFFF"
    : "#000000";
};
