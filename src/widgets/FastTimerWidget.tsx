// Thư viện widget cần hàm render thuần; tắt React Compiler cho file này
"use no memo";

import { FlexWidget, TextWidget } from "react-native-android-widget";
import {
  DEFAULT_LABELS,
  FINISH_URI,
  formatHours,
  formatWhen,
  getIdleDisplay,
  getWidgetColors,
  HexColor,
  isFastingState,
  START_URI,
} from "./widgetDisplay";
import type { FastWidgetState } from "./widgetState";

// Thấp hơn mức này (widget 4×1) thì gộp số giờ, mục tiêu và nút vào một hàng
const SHORT_HEIGHT = 100;
const PADDING = 14;

const PillButton = ({
  label,
  color,
  textColor,
  uri,
}: {
  label: string;
  color: HexColor;
  textColor: HexColor;
  uri: string;
}) => (
  <FlexWidget
    clickAction="OPEN_URI"
    clickActionData={{ uri }}
    style={{
      backgroundColor: color,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 7,
    }}
  >
    <TextWidget
      text={label}
      style={{ fontSize: 13, fontWeight: "bold", color: textColor }}
    />
  </FlexWidget>
);

/**
 * Tên mục tiêu + số giờ, VD "Chiến binh · 20h". Chiếm tối đa `width`;
 * thiếu chỗ thì cắt tên, số giờ luôn hiện.
 */
const TargetLabel = ({
  name,
  hours,
  width,
  color,
}: {
  name?: string;
  hours: number;
  width: number;
  color: HexColor;
}) => (
  <FlexWidget
    style={{
      width,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
    }}
  >
    {name ? (
      <FlexWidget style={{ flex: 1, alignItems: "flex-end" }}>
        <TextWidget
          text={name}
          maxLines={1}
          truncate="END"
          style={{ fontSize: 12, fontWeight: "bold", color, textAlign: "right" }}
        />
      </FlexWidget>
    ) : null}
    <TextWidget
      text={name ? ` · ${hours}h` : `${hours}h`}
      style={{ fontSize: 12, fontWeight: "bold", color }}
    />
  </FlexWidget>
);

/**
 * Widget màn hình chính: trạng thái phiên nhịn, số giờ, tiến độ tới mục tiêu.
 * Chỉ hiển thị; nút bấm mở app để app thực hiện.
 */
export function FastTimerWidget({
  state,
  width = 0,
  height = 0,
}: {
  state: FastWidgetState | null;
  width?: number;
  height?: number;
}) {
  const colors = getWidgetColors(state);
  const labels = { ...DEFAULT_LABELS, ...state?.labels };
  const isFasting = isFastingState(state);
  const idle = getIdleDisplay(state);
  const now = Date.now();
  const isShort = height > 0 && height < SHORT_HEIGHT;

  const targetHours = isFasting ? state?.targetHours : state?.defaultTarget;
  const targetEnd =
    isFasting && targetHours
      ? state!.startTime! + targetHours * 3_600_000
      : null;
  const progress = targetEnd
    ? Math.min(1, (now - state!.startTime!) / (targetEnd - state!.startTime!))
    : 0;
  const reached = progress >= 1;
  const accent = reached ? colors.success : colors.primary;

  // Không nhịn: số giờ phiên trước, làm mờ như bị đóng băng
  const hoursText = isFasting
    ? formatHours(now - state!.startTime!, labels)
    : idle.kind === "last"
      ? formatHours(idle.durationMs, labels)
      : formatHours(0, labels);
  const hoursColor = isFasting
    ? reached
      ? colors.success
      : colors.text
    : (`${colors.text}66` as HexColor);

  const footerLeft = isFasting
    ? formatWhen(state!.startTime!, labels)
    : idle.kind === "last"
      ? `${labels.lastFast} · ${formatWhen(idle.endTime, labels)}`
      : labels.tapToOpen;
  const footerRight = targetEnd ? formatWhen(targetEnd, labels) : "";

  const dimText = `${colors.text}AA` as HexColor;

  const button = isFasting ? (
    <PillButton
      label={`■ ${labels.end}`}
      color={`${colors.text}1A` as HexColor}
      textColor={colors.text}
      uri={FINISH_URI}
    />
  ) : (
    <PillButton
      label={`▶ ${labels.start}`}
      color={colors.primary}
      textColor="#FFFFFF"
      uri={START_URI}
    />
  );

  const target = targetHours ? (
    <TargetLabel
      name={state?.targetNames?.[String(targetHours)]}
      hours={targetHours}
      // Nhãn mục tiêu chiếm tối đa nửa phải của widget
      width={Math.max(60, Math.floor((width || 300) / 2) - PADDING)}
      color={isFasting ? accent : dimText}
    />
  ) : null;

  const bar =
    isFasting && targetEnd ? (
      <FlexWidget
        style={{
          width: "match_parent",
          height: 6,
          borderRadius: 3,
          backgroundColor: `${colors.text}22` as HexColor,
          flexDirection: "row",
        }}
      >
        <FlexWidget
          style={{
            height: 6,
            borderRadius: 3,
            flex: Math.max(progress, 0.02),
            backgroundColor: accent,
          }}
        />
        <FlexWidget style={{ height: 6, flex: Math.max(1 - progress, 0) }} />
      </FlexWidget>
    ) : null;

  const container = {
    height: "match_parent" as const,
    width: "match_parent" as const,
    backgroundColor: colors.background,
    borderRadius: 24,
    padding: PADDING,
    justifyContent: "space-between" as const,
  };

  // 4×1: [14 giờ   Chiến binh · 20h] [nút], thanh tiến độ bên dưới
  if (isShort) {
    return (
      <FlexWidget clickAction="OPEN_APP" style={{ ...container, padding: 10 }}>
        <FlexWidget
          style={{
            width: "match_parent",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <FlexWidget style={{ flexDirection: "row", alignItems: "flex-end" }}>
            <TextWidget
              text={hoursText}
              style={{ fontSize: 20, fontWeight: "bold", color: hoursColor }}
            />
            {targetHours ? (
              <TextWidget
                text={` · ${targetHours}h`}
                style={{ fontSize: 12, fontWeight: "bold", color: dimText }}
              />
            ) : null}
          </FlexWidget>
          {button}
        </FlexWidget>
        {bar}
      </FlexWidget>
    );
  }

  return (
    <FlexWidget clickAction="OPEN_APP" style={container}>
      {/* Trạng thái + streak, nút ở góc phải trên */}
      <FlexWidget
        style={{
          width: "match_parent",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <FlexWidget style={{ flexDirection: "row", alignItems: "center" }}>
          <TextWidget
            text={isFasting ? labels.fasting : labels.ready}
            style={{
              fontSize: 12,
              fontWeight: "bold",
              letterSpacing: 0.1,
              color: isFasting ? colors.primary : colors.text,
            }}
          />
          {state?.streak ? (
            <TextWidget
              text={`  ·  🔥 ${state.streak}`}
              style={{ fontSize: 12, fontWeight: "bold", color: dimText }}
            />
          ) : null}
        </FlexWidget>
        {button}
      </FlexWidget>

      {/* Số giờ (trái) + mục tiêu (phải), ngay trên thanh tiến độ */}
      <FlexWidget style={{ width: "match_parent" }}>
        <FlexWidget
          style={{
            width: "match_parent",
            flexDirection: "row",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: 6,
          }}
        >
          <TextWidget
            text={hoursText}
            style={{ fontSize: 28, fontWeight: "bold", color: hoursColor }}
          />
          {target}
        </FlexWidget>

        {bar}

        {/* Hai mốc giờ dưới hai đầu thanh: bắt đầu — đạt mục tiêu */}
        <FlexWidget
          style={{
            width: "match_parent",
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 6,
          }}
        >
          <TextWidget
            text={footerLeft}
            maxLines={1}
            truncate="END"
            style={{ fontSize: 12, color: dimText }}
          />
          {footerRight ? (
            <TextWidget
              text={footerRight}
              style={{ fontSize: 12, color: dimText }}
            />
          ) : null}
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}
