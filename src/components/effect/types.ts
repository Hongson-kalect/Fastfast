import { ComponentType } from "react";

/** Ngữ cảnh chung mọi effect nhận được (cường độ "off" đã bị lọc trước) */
export type EffectContext = {
  intensity: "light" | "strong";
  isDarkMode: boolean;
  /** false khi tab không focus hoặc hệ thống bật giảm chuyển động: chỉ vẽ tĩnh */
  animate: boolean;
};

export type ButtonEffectProps = EffectContext & {
  /**
   * primary: nút Bắt đầu / Kết thúc; secondary: nút vuông nhỏ (ảnh, mood);
   * chip: huy hiệu / vòng nhỏ ở header
   */
  variant: "primary" | "secondary" | "chip";
  /** Bo góc của nút, để trang trí ôm đúng mép */
  radius: number;
  /** Màu chủ đạo của nút */
  color: string;
  isCounting: boolean;
};

/** Thời gian sống của một hiệu ứng chạm; component `touch` nên chạy xong trong khoảng này */
export const TOUCH_EFFECT_DURATION = 600;

export type TouchEffectProps = EffectContext & {
  /** Toạ độ chạm trên màn hình */
  x: number;
  y: number;
};

/**
 * Một bộ effect gồm các mảnh gắn vào từng "slot" trên giao diện. Slot nào
 * không khai báo thì phần đó giữ nguyên giao diện gốc.
 */
export type EffectDefinition = {
  /** Lớp nền toàn màn hình, nằm dưới nội dung (tuyết rơi thưa...) */
  screen?: ComponentType<EffectContext>;
  /** Hoa văn nền của thẻ lớn (ô vòng tròn đếm giờ), nằm dưới nội dung thẻ */
  card?: ComponentType<EffectContext>;
  /** Nền thanh tab, nằm dưới icon và nhãn */
  tabBar?: ComponentType<EffectContext>;
  /** Trang trí trên các nút hành động (nằm trong nút, không nhận chạm) */
  button?: ComponentType<ButtonEffectProps>;
  /** Hiệu ứng ngắn tại điểm chạm, bị gỡ sau TOUCH_EFFECT_DURATION */
  touch?: ComponentType<TouchEffectProps>;
};
