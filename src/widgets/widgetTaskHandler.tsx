import type { WidgetTaskHandlerProps } from "react-native-android-widget";
import { FastTimerWidget } from "./FastTimerWidget";
import { FAST_WIDGET_NAME, loadWidgetState } from "./widgetState";

/** Hệ thống gọi khi widget được thêm, đổi cỡ hoặc tới chu kỳ cập nhật 30 phút. */
export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  if (props.widgetInfo.widgetName !== FAST_WIDGET_NAME) return;

  switch (props.widgetAction) {
    case "WIDGET_ADDED":
    case "WIDGET_UPDATE":
    case "WIDGET_RESIZED":
      props.renderWidget(<FastTimerWidget state={await loadWidgetState()} />);
      break;
    default:
      break;
  }
}
