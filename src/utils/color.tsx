

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
