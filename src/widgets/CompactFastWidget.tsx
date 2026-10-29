// Thư viện widget cần hàm render thuần; tắt React Compiler cho file này
"use no memo";

import { FlexWidget, TextWidget } from "react-native-android-widget";
import {
  FINISH_URI,
  formatShortHours,
  getIdleDisplay,
  getWidgetColors,
  HexColor,
  isFastingState,
  START_URI,
} from "./widgetDisplay";
import type { FastWidgetState } from "./widgetState";

// Rộng từ 2 ô trở lên thì xếp nút và đồng hồ theo hàng ngang
const ROW_MIN_WIDTH = 110;

/** Widget 1 ô: đồng hồ + nút bắt đầu/kết thúc. */
export function CompactFastWidget({
  state,
  width = 0,
}: {
  state: FastWidgetState | null;
  width?: number;
  height?: number;
}) {
  const colors = getWidgetColors(state);
  const isFasting = isFastingState(state);
  const idle = getIdleDisplay(state);
  const now = Date.now();

  // Chỉ giờ tròn: widget không được vẽ lại liên tục nên số phút sẽ sai.
  // Không nhịn: phiên trước (làm mờ) > mục tiêu > 0
  const timeText = isFasting
    ? formatShortHours(now - state!.startTime!)
    : idle.kind === "last"
      ? formatShortHours(idle.durationMs)
      : idle.kind === "target"
        ? `${idle.hours}h`
        : "0h";

  const isRow = width >= ROW_MIN_WIDTH;
  const buttonSize = isRow ? 34 : 26;

  const button = (
    <FlexWidget
      // Mở app để app bắt đầu/kết thúc phiên
      clickAction="OPEN_URI"
      clickActionData={{ uri: isFasting ? FINISH_URI : START_URI }}
      style={{
        width: buttonSize,
        height: buttonSize,
        borderRadius: buttonSize / 2,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: isFasting
          ? (`${colors.text}1A` as HexColor)
          : colors.primary,
      }}
    >
      <TextWidget
        text={isFasting ? "■" : "▶"}
        style={{
          fontSize: isRow ? 14 : 11,
          color: isFasting ? colors.text : "#FFFFFF",
        }}
      />
    </FlexWidget>
  );

  const time = (
    <TextWidget
      text={timeText}
      maxLines={1}
      style={{
        fontSize: isRow ? 22 : 16,
        fontWeight: "bold",
        // Đang nhịn: màu chính; đứng yên: chữ mờ như bị đóng băng
        color: isFasting ? colors.primary : (`${colors.text}66` as HexColor),
      }}
    />
  );

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: "match_parent",
        width: "match_parent",
        backgroundColor: colors.background,
        borderRadius: 20,
      }}
    >
      {/* Lớp phủ: đang nhịn ánh màu chính, đứng yên ánh xám */}
      <FlexWidget
        style={{
          height: "match_parent",
          width: "match_parent",
          borderRadius: 20,
          padding: 6,
          backgroundColor: (isFasting
            ? `${colors.primary}1F`
            : `${colors.text}0A`) as HexColor,
          flexDirection: isRow ? "row" : "column",
          alignItems: "center",
          justifyContent: isRow ? "space-evenly" : "center",
          flexGap: isRow ? 0 : 4,
        }}
      >
        {isRow ? button : time}
        {isRow ? time : button}
      </FlexWidget>
    </FlexWidget>
  );
}
