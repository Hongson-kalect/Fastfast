import { StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";

export type PatternFlake = { x: number; y: number; size: number };

// Mặc định cho nút: dồn về hai đầu, chừa phần giữa cho chữ
const BUTTON_FLAKES: PatternFlake[] = [
  { x: 0.06, y: 0.62, size: 13 },
  { x: 0.15, y: 0.3, size: 9 },
  { x: 0.22, y: 0.78, size: 7 },
  { x: 0.8, y: 0.78, size: 8 },
  { x: 0.87, y: 0.34, size: 10 },
  { x: 0.95, y: 0.68, size: 12 },
];

/** Bông tuyết 6 cánh, mỗi cánh có một nhánh chữ V */
export const flakePath = (cx: number, cy: number, size: number) => {
  const r = size / 2;
  const branch = r * 0.38;
  const parts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    const ex = cx + Math.cos(a) * r;
    const ey = cy + Math.sin(a) * r;
    parts.push(`M${cx},${cy} L${ex},${ey}`);
    // Nhánh V ở 60% cánh
    const bx = cx + Math.cos(a) * r * 0.6;
    const by = cy + Math.sin(a) * r * 0.6;
    for (const side of [-1, 1]) {
      const ba = a + side * 0.7;
      parts.push(`M${bx},${by} L${bx + Math.cos(ba) * branch},${by + Math.sin(ba) * branch}`);
    }
  }
  return parts.join(" ");
};

/** Hoa văn bông tuyết mờ, cắt theo bo góc của khung chứa. Vẽ tĩnh. */
export const SnowflakePattern = ({
  width,
  height,
  radius,
  color,
  flakes = BUTTON_FLAKES,
}: {
  width: number;
  height: number;
  radius: number;
  color: string;
  /** Vị trí theo tỉ lệ khung, cỡ theo px */
  flakes?: PatternFlake[];
}) => (
  <View
    style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: "hidden" }]}
    pointerEvents="none"
  >
    <Svg width={width} height={height}>
      {flakes.map((flake, index) => (
        <Path
          key={index}
          d={flakePath(flake.x * width, flake.y * height, flake.size)}
          stroke={color}
          strokeWidth={Math.max(1.3, flake.size * 0.06)}
          strokeLinecap="round"
        />
      ))}
    </Svg>
  </View>
);
