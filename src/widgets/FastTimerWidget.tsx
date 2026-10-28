// Thư viện widget cần hàm render thuần; tắt React Compiler cho file này
"use no memo";

import { FlexWidget, TextWidget } from "react-native-android-widget";
import { getLocalTodayStr } from "@/utils/timer";
import {
  DEFAULT_LABELS,
  FINISH_URI,
  formatClock,
  formatDuration,
  formatElapsedShort,
  getIdleDisplay,
  getWidgetColors,
  HexColor,
  isFastingState,
  WIDGET_ACTIONS,
} from "./widgetDisplay";
import type { FastWidgetState } from "./widgetState";

const DEFAULT_MOODS = ["😫", "😮‍💨", "🙂", "😃", "🥰"].map((emoji) => ({
  emoji,
  color: "#88888833",
}));

// Đủ cao mới hiện hàng chọn mood, widget thấp chỉ còn phần thời gian
const MOOD_ROW_MIN_HEIGHT = 150;

const PillButton = ({
  label,
  color,
  textColor,
  clickAction,
  clickActionData,
}: {
  label: string;
  color: HexColor;
  textColor: HexColor;
  clickAction: string;
  clickActionData?: Record<string, unknown>;
}) => (
  <FlexWidget
    clickAction={clickAction}
    clickActionData={clickActionData}
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

/** Widget màn hình chính: trạng thái phiên nhịn, nút bắt đầu/kết thúc, chọn mood hôm nay. */
export function FastTimerWidget({
  state,
  height = 0,
}: {
  state: FastWidgetState | null;
  width?: number;
  height?: number;
}) {
  const colors = getWidgetColors(state);
  const labels = { ...DEFAULT_LABELS, ...state?.labels };
  const moods = state?.moods ?? DEFAULT_MOODS;
  const todayMood =
    state?.mood && state.mood.date === getLocalTodayStr() ? state.mood.level : null;

  const isFasting = isFastingState(state);
  const idle = getIdleDisplay(state);
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

  // Không nhịn: hiện thời lượng phiên trước (làm mờ, như bị đóng băng) > mục tiêu > 0
  const mainText = isFasting
    ? formatDuration(now - state!.startTime!)
    : idle.kind === "last"
      ? formatDuration(idle.durationMs)
      : idle.kind === "target"
        ? `${idle.hours}h`
        : formatDuration(0);

  const subText = isFasting
    ? `${labels.started} ${formatClock(state!.startTime!)}${
        targetEnd ? ` · ${labels.done} ${formatClock(targetEnd)}` : ""
      }`
    : idle.kind === "last"
      ? `${labels.lastFast} · ${labels.endedAgo.replace(
          "{time}",
          formatElapsedShort(now - idle.endTime),
        )}`
      : idle.kind === "target"
        ? labels.target
        : labels.tapToOpen;

  const showMoods = height >= MOOD_ROW_MIN_HEIGHT;

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: "match_parent",
        width: "match_parent",
        backgroundColor: colors.background,
        borderRadius: 24,
        padding: 14,
        justifyContent: "space-between",
      }}
    >
      {/* Nhãn trạng thái + streak, nút thao tác bên phải */}
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
              text={`  🔥 ${state.streak}`}
              style={{ fontSize: 12, fontWeight: "bold", color: colors.text }}
            />
          ) : null}
        </FlexWidget>

        {isFasting ? (
          <PillButton
            label={`■ ${labels.end}`}
            color={`${colors.text}1A` as HexColor}
            textColor={colors.text}
            clickAction="OPEN_URI"
            clickActionData={{ uri: FINISH_URI }}
          />
        ) : (
          <PillButton
            label={`▶ ${labels.start}`}
            color={colors.primary}
            textColor="#FFFFFF"
            clickAction={WIDGET_ACTIONS.startFast}
          />
        )}
      </FlexWidget>

      <FlexWidget style={{ width: "match_parent" }}>
        <FlexWidget
          style={{
            width: "match_parent",
            flexDirection: "row",
            alignItems: "flex-end",
            justifyContent: "space-between",
          }}
        >
          <TextWidget
            text={mainText}
            style={{
              fontSize: 28,
              fontWeight: "bold",
              color: isFasting ? colors.text : (`${colors.text}66` as HexColor),
            }}
          />
          {isFasting && targetEnd ? (
            <TextWidget
              text={`${Math.floor(progress * 100)}%`}
              style={{ fontSize: 13, fontWeight: "bold", color: colors.primary }}
            />
          ) : null}
        </FlexWidget>

        {/* Thanh tiến độ, luôn hiện để bố cục widget không bị trống */}
        <FlexWidget
          style={{
            width: "match_parent",
            height: 6,
            borderRadius: 3,
            marginTop: 6,
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
          text={subText}
          style={{
            fontSize: 12,
            marginTop: 6,
            color: `${colors.text}AA` as HexColor,
          }}
        />
      </FlexWidget>

      {/* Chạm để lưu mood hôm nay, mood đang chọn được tô màu */}
      {showMoods ? (
        <FlexWidget
          style={{
            width: "match_parent",
            flexDirection: "row",
            flexGap: 6,
          }}
        >
          {moods.map((mood, level) => (
            <FlexWidget
              key={level}
              clickAction={WIDGET_ACTIONS.setMood}
              clickActionData={{ level }}
              style={{
                flex: 1,
                height: 34,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: (level === todayMood
                  ? mood.color
                  : `${colors.text}0D`) as HexColor,
                borderWidth: level === todayMood ? 2 : 0,
                borderColor: colors.primary,
              }}
            >
              <TextWidget text={mood.emoji} style={{ fontSize: 17 }} />
            </FlexWidget>
          ))}
        </FlexWidget>
      ) : null}
    </FlexWidget>
  );
}
