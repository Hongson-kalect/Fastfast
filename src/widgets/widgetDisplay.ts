import { getTargetFrameColor } from "@/utils/targetColor";
import type { FastWidgetState, WidgetLabels } from "./widgetState";

/** Phần dùng chung giữa các widget: định dạng thời gian, nút bấm, nội dung lúc không nhịn. */

export type HexColor = `#${string}`;

// Nút trên widget mở app rồi để app thực hiện: thao tác chạy nền trên widget
// không chạy được khi hệ điều hành đã buộc dừng app
export const START_URI = "fastfast://?widgetAction=start";
// Kết thúc phiên cần xác nhận và hiện kết quả
export const FINISH_URI = "fastfast://?widgetAction=finish";

// Dùng khi trạng thái cũ chưa có nhãn (ghi trước khi có đa ngôn ngữ)
export const DEFAULT_LABELS: WidgetLabels = {
  fasting: "FASTING",
  ready: "READY",
  notFasting: "Not fasting",
  tapToOpen: "Tap to open FastFast",
  started: "Started",
  done: "Done",
  start: "Start",
  end: "End",
  lastFast: "Last fast",
  endedAgo: "Ended {time} ago",
  target: "Target",
  hours: "{n}h",
  lessThanHour: "< 1h",
  weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
};

export const pad = (n: number) => String(n).padStart(2, "0");

export const formatClock = (time: number) => {
  const date = new Date(time);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// Widget chỉ được vẽ lại khi app đổi trạng thái, theo chu kỳ 30 phút, và không
// cập nhật gì khi hệ điều hành đã buộc dừng app. Vì vậy chỉ hiện giờ tròn
// (sai lệch vài chục phút không lộ) và các mốc giờ cố định (luôn đúng).

/** Số giờ tròn xuống theo ngôn ngữ app, VD "14 giờ", "< 1 giờ". */
export const formatHours = (ms: number, labels: WidgetLabels) => {
  const hours = Math.floor(Math.max(0, ms) / 3_600_000);
  return hours < 1
    ? (labels.lessThanHour ?? DEFAULT_LABELS.lessThanHour!)
    : (labels.hours ?? DEFAULT_LABELS.hours!).replace("{n}", String(hours));
};

/** Dạng ngắn cho widget mini, VD "14h". */
export const formatShortHours = (ms: number) =>
  `${Math.floor(Math.max(0, ms) / 3_600_000)}h`;

/** Mốc giờ: hôm nay chỉ giờ ("20:15"), ngày khác thêm thứ viết tắt ("T3 20:15"). */
export const formatWhen = (time: number, labels: WidgetLabels) => {
  const date = new Date(time);
  if (date.toDateString() === new Date().toDateString()) return formatClock(time);
  const weekdays = labels.weekdays ?? DEFAULT_LABELS.weekdays!;
  return `${weekdays[date.getDay()]} ${formatClock(time)}`;
};

export const isFastingState = (state: FastWidgetState | null) =>
  !!state?.startTime && !state.endTime;

/**
 * Nội dung lúc không nhịn, theo thứ tự ưu tiên: thời lượng phiên trước
 * (đóng băng) > mục tiêu đang chọn > 0.
 */
export type IdleDisplay =
  | { kind: "last"; durationMs: number; endTime: number }
  | { kind: "target"; hours: number }
  | { kind: "zero" };

export const getIdleDisplay = (state: FastWidgetState | null): IdleDisplay => {
  if (state?.startTime && state.endTime) {
    return {
      kind: "last",
      durationMs: state.endTime - state.startTime,
      endTime: state.endTime,
    };
  }
  if (state?.defaultTarget) return { kind: "target", hours: state.defaultTarget };
  return { kind: "zero" };
};

export const getWidgetColors = (state: FastWidgetState | null) => {
  const isFasting = isFastingState(state);
  // Cùng quy tắc với vòng tròn ở Home: màu mục tiêu, vượt mục tiêu thì theo khung hiện tại
  const primary = getTargetFrameColor(
    isFasting ? (Date.now() - state!.startTime!) / 3_600_000 : 0,
    isFasting ? state!.targetHours : state?.defaultTarget,
    state?.targetFrames ?? [],
    state?.colors.primary ?? "#F2652A",
  );

  return {
    background: (state?.colors.card ?? "#FFFFFF") as HexColor,
    text: (state?.colors.text ?? "#262626") as HexColor,
    primary: primary as HexColor,
    success: (state?.colors.success ?? "#4ADE80") as HexColor,
  };
};
