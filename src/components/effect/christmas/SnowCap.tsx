import Svg, { Path } from "react-native-svg";

type Props = {
  width: number;
  height: number;
  /** Bo góc của nút: lớp tuyết ôm theo mép trên, mỏng dần ở hai góc */
  radius: number;
  /** Độ dày lớp tuyết ở giữa */
  thickness: number;
  color: string;
  /** Viền / bóng nhạt dưới lớp tuyết để thấy được cả trên nền sáng */
  shadowColor: string;
  opacity?: number;
  /** Viền mảnh quanh lớp tuyết; cần trên nền sáng, nơi tuyết trắng lẫn vào nút trắng */
  strokeColor?: string;
  /** Hệ số độ dài giọt rủ; 0 = mép dưới chỉ gợn nhẹ */
  dripScale?: number;
};

// Vị trí (tỉ lệ bề ngang) và độ dài các giọt tuyết rủ xuống
const DRIPS = [
  { at: 0.17, length: 0.7 },
  { at: 0.36, length: 0.4 },
  { at: 0.63, length: 0.85 },
  { at: 0.84, length: 0.5 },
];
const STEP = 2;

/** Mép trên của nút bo góc tại x: 0 ở đoạn thẳng, cong xuống ở hai góc */
const edgeY = (x: number, width: number, r: number) => {
  const dx = x < r ? r - x : x > width - r ? x - (width - r) : 0;
  return r - Math.sqrt(Math.max(r * r - dx * dx, 0));
};

const buildPath = (
  width: number,
  height: number,
  radius: number,
  thickness: number,
  dripScale: number,
) => {
  const r = Math.min(radius, height / 2, width / 2);
  const start = r * 0.3;
  const end = width - r * 0.3;
  const span = end - start;

  const top: string[] = [];
  const bottom: string[] = [];
  for (let x = start; x <= end + 0.01; x += STEP) {
    const u = (x - start) / span;
    const taper = Math.min(1, u / 0.12, (1 - u) / 0.12);
    // Mép dưới gợn nhẹ (cố định theo x, không ngẫu nhiên) cộng các giọt rủ
    const wave = 0.85 + 0.12 * Math.sin(x * 0.23) + 0.08 * Math.sin(x * 0.57 + 1);
    const drip = DRIPS.reduce(
      (sum, item) =>
        sum + item.length * dripScale * thickness * Math.exp(-(((x - item.at * width) / 3.5) ** 2)),
      0,
    );
    const yTop = edgeY(x, width, r);
    top.push(`${x.toFixed(1)},${yTop.toFixed(1)}`);
    bottom.push(`${x.toFixed(1)},${(yTop + (thickness * wave + drip) * taper).toFixed(1)}`);
  }
  return `M${top.join(" L")} L${bottom.reverse().join(" L")} Z`;
};

/** Lớp tuyết đọng trên mép trên của nút, có vài giọt rủ xuống. Vẽ tĩnh. */
export const SnowCap = ({
  width,
  height,
  radius,
  thickness,
  color,
  shadowColor,
  opacity = 1,
  strokeColor,
  dripScale = 1,
}: Props) => {
  const path = buildPath(width, height, radius, thickness, dripScale);
  return (
    <Svg
      width={width}
      height={height}
      style={{ position: "absolute", left: 0, top: 0, opacity }}
    >
      {/* Bóng lệch xuống 1.5px tạo độ dày */}
      <Path d={path} fill={shadowColor} transform="translate(0 1.5)" />
      <Path d={path} fill={color} stroke={strokeColor} strokeWidth={strokeColor ? 1 : 0} />
    </Svg>
  );
};
