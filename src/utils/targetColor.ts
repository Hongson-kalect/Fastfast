/** Khung giờ của một mục tiêu: [hours, toHours) và màu đại diện. */
export type TargetFrame = { hours: number; toHours?: number; color: string };

/**
 * Màu theo mục tiêu cho vòng tròn / widget:
 * - Chưa qua khung của mục tiêu đang chọn: màu mục tiêu đó.
 * - Đã vượt: màu mục tiêu có khung chứa thời gian hiện tại (cho thấy đã vượt mục tiêu).
 * - Nhịn tự do: màu khung hiện tại, chưa tới mốc nhỏ nhất thì dùng `fallback`.
 * Không phụ thuộc store hay i18n để widget (headless JS) dùng lại được.
 */
export const getTargetFrameColor = (
  elapsedHours: number,
  targetHours: number | null | undefined,
  frames: TargetFrame[],
  fallback: string,
) => {
  const target =
    targetHours != null ? frames.find((frame) => frame.hours === targetHours) : undefined;
  if (target && elapsedHours < (target.toHours ?? Infinity)) return target.color;

  const current = frames.find(
    (frame) =>
      elapsedHours >= frame.hours && elapsedHours < (frame.toHours ?? Infinity),
  );
  return current?.color ?? target?.color ?? fallback;
};
