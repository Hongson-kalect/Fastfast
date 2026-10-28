/**
 * Heatmap ở Journey: tô theo tổng giờ nhịn trong một ngày dương lịch (không theo loại phiên),
 * một màu (primary của theme) với độ đậm tăng dần. 5 mức để mắt phân biệt được.
 */
export const HEATMAP_LEVELS = [
  { minHours: 0, opacity: 0.25 },
  { minHours: 8, opacity: 0.45 },
  { minHours: 12, opacity: 0.65 },
  { minHours: 16, opacity: 0.85 },
  { minHours: 20, opacity: 1 },
] as const;

/** Mức heatmap (0–4) theo tổng giờ nhịn trong ngày. */
export const getHeatmapLevel = (hoursInDay: number) => {
  let level = 0;
  HEATMAP_LEVELS.forEach((item, index) => {
    if (hoursInDay >= item.minHours) level = index;
  });
  return level;
};

/** Nhãn chú thích: "<8h", "8h", "12h", … */
export const heatmapLabel = (level: number) =>
  level === 0
    ? `<${HEATMAP_LEVELS[1].minHours}h`
    : `${HEATMAP_LEVELS[level].minHours}h`;

/** Màu hex "#RRGGBB" kèm độ đậm, VD ("#3B82F6", 0.45) → "#3B82F673". */
export const withOpacity = (hex: string, opacity: number) =>
  hex.slice(0, 7) + Math.round(opacity * 255).toString(16).padStart(2, "0");
