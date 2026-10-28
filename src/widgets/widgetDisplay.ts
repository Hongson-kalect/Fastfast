import { getTargetFrameColor } from "@/utils/targetColor";
import type { FastWidgetState, WidgetLabels } from "./widgetState";

/** Phần dùng chung giữa các widget: định dạng thời gian, nút bấm, nội dung lúc không nhịn. */

export type HexColor = `#${string}`;

/** clickAction của các nút; widgetTaskHandler xử lý ngay trong headless JS */
export const WIDGET_ACTIONS = {
  startFast: "START_FAST",
  setMood: "SET_MOOD",
} as const;

// Kết thúc phiên cần xác nhận và hiện kết quả nên mở app thay vì làm ngay trên widget
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
};

export const pad = (n: number) => String(n).padStart(2, "0");

export const formatClock = (time: number) => {
  const date = new Date(time);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// Widget Android không tự đếm từng giây: hiển thị giờ:phút, cập nhật khi app
// đổi trạng thái và theo chu kỳ 30 phút của hệ thống.
export const formatDuration = (ms: number) => {
  const minutes = Math.max(0, Math.floor(ms / 60000));
  return `${Math.floor(minutes / 60)}h ${pad(minutes % 60)}m`;
};

/** Như formatDuration nhưng bỏ giờ khi bằng 0, VD "2m", "3h 05m". */
export const formatElapsedShort = (ms: number) => {
  const minutes = Math.max(0, Math.floor(ms / 60000));
  return minutes < 60 ? `${minutes}m` : formatDuration(ms);
};

/** Dạng gọn cho widget nhỏ, VD "16:05". */
export const formatShortDuration = (ms: number) => {
  const minutes = Math.max(0, Math.floor(ms / 60000));
  return `${Math.floor(minutes / 60)}:${pad(minutes % 60)}`;
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
  };
};
