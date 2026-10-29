import type { WidgetTaskHandlerProps } from "react-native-android-widget";
import { CompactFastWidget } from "./CompactFastWidget";
import { FastTimerWidget } from "./FastTimerWidget";
import {
  COMPACT_WIDGET_NAME,
  FAST_WIDGET_NAME,
  FastWidgetState,
  loadWidgetState,
} from "./widgetState";

const WIDGETS = {
  [FAST_WIDGET_NAME]: FastTimerWidget,
  [COMPACT_WIDGET_NAME]: CompactFastWidget,
};

/**
 * Hệ thống gọi khi widget được thêm, đổi cỡ hoặc tới chu kỳ cập nhật 30 phút.
 * Nút trên widget không chạy ở đây mà mở app qua deep link: chạy nền bằng
 * headless JS bị hệ điều hành (vivo, Xiaomi...) chặn khi app đã bị vuốt bỏ.
 */
export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const Widget = WIDGETS[props.widgetInfo.widgetName as keyof typeof WIDGETS];
  if (!Widget) return;

  const render = (state: FastWidgetState | null) =>
    props.renderWidget(
      <Widget
        state={state}
        width={props.widgetInfo.width}
        height={props.widgetInfo.height}
      />,
    );

  switch (props.widgetAction) {
    case "WIDGET_ADDED":
    case "WIDGET_UPDATE":
    case "WIDGET_RESIZED":
      render(await loadWidgetState());
      break;
    default:
      break;
  }
}
