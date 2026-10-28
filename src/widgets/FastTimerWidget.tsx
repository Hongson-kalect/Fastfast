// Thư viện widget cần hàm render thuần; tắt React Compiler cho file này
"use no memo";

import { FlexWidget, TextWidget } from "react-native-android-widget";
import type { FastWidgetState, WidgetLabels } from "./widgetState";

type HexColor = `#${string}`;

// Dùng khi trạng thái cũ chưa có nhãn (ghi trước khi có đa ngôn ngữ)
const DEFAULT_LABELS: WidgetLabels = {
  fasting: "FASTING",
  ready: "READY",
  notFasting: "Not fasting",
  tapToOpen: "Tap to open FastFast",
  started: "Started",
  done: "Done",
};

const pad = (n: number) => String(n).padStart(2, "0");

const formatClock = (time: number) => {
  const date = new Date(time);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// Widget Android không tự đếm từng giây: hiển thị giờ:phút, cập nhật khi app
// đổi trạng thái và theo chu kỳ 30 phút của hệ thống.
const formatElapsed = (ms: number) => {
  const minutes = Math.max(0, Math.floor(ms / 60000));
  return `${Math.floor(minutes / 60)}h ${pad(minutes % 60)}m`;
};

/** Widget màn hình chính: trạng thái phiên nhịn, thời gian đã nhịn, giờ xong. */
export function FastTimerWidget({ state }: { state: FastWidgetState | null }) {
  const colors = {
    background: (state?.colors.card ?? "#FFFFFF") as HexColor,
    text: (state?.colors.text ?? "#262626") as HexColor,
    primary: (state?.colors.primary ?? "#F2652A") as HexColor,
  };

  const labels = state?.labels ?? DEFAULT_LABELS;
  const isFasting = !!state?.startTime && !state.endTime;
  const now = Date.now();

  const targetEnd =
    isFasting && state?.targetHours
      ? state.startTime! + state.targetHours * 3600 * 1000
      : null;
  // Có mục tiêu: tiến độ tới mục tiêu; nhịn tự do: thanh đầy; chưa nhịn: thanh rỗng
  const progress = !isFasting
    ? 0
    : targetEnd
      ? Math.min(1, (now - state!.startTime!) / (targetEnd - state!.startTime!))
      : 1;

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: "match_parent",
        width: "match_parent",
        backgroundColor: colors.background,
        borderRadius: 24,
        padding: 16,
        justifyContent: "space-between",
      }}
    >
      <TextWidget
        text={isFasting ? labels.fasting : labels.ready}
        style={{
          fontSize: 12,
          fontWeight: "bold",
          letterSpacing: 0.1,
          color: isFasting ? colors.primary : colors.text,
        }}
      />

      <TextWidget
        text={isFasting ? formatElapsed(now - state!.startTime!) : labels.notFasting}
        style={{ fontSize: 30, fontWeight: "bold", color: colors.text }}
      />

      {/* Thanh tiến độ, luôn hiện để bố cục widget không bị trống */}
      <FlexWidget
        style={{
          width: "match_parent",
          height: 6,
          borderRadius: 3,
          backgroundColor: `${colors.text}22` as HexColor,
          flexDirection: "row",
        }}
      >
        {progress > 0 ? (
          <FlexWidget
            style={{
              height: 6,
              borderRadius: 3,
              flex: Math.max(progress, 0.02),
              backgroundColor: colors.primary,
            }}
          />
        ) : null}
        <FlexWidget style={{ height: 6, flex: Math.max(1 - progress, 0) }} />
      </FlexWidget>

      <TextWidget
        text={
          isFasting
            ? `${labels.started} ${formatClock(state!.startTime!)}${
                targetEnd ? ` · ${labels.done} ${formatClock(targetEnd)}` : ""
              }`
            : labels.tapToOpen
        }
        style={{ fontSize: 12, color: `${colors.text}AA` as HexColor }}
      />
    </FlexWidget>
  );
}
