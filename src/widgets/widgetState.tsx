import { useAppStore } from "@/stores/appStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "i18next";
import { Platform } from "react-native";

/**
 * Ảnh chụp trạng thái phiên nhịn cho widget. Widget chạy trong headless JS
 * nên không đọc store của app; app ghi ảnh chụp này mỗi khi phiên hoặc theme đổi.
 */
export type FastWidgetState = {
  startTime: number | null;
  endTime: number | null;
  targetHours: number | null;
  colors: { card: string; text: string; primary: string };
  /** Nhãn đã dịch sẵn theo ngôn ngữ app, vì headless JS không có i18n của app */
  labels?: WidgetLabels;
};

export type WidgetLabels = {
  fasting: string;
  ready: string;
  notFasting: string;
  tapToOpen: string;
  started: string;
  done: string;
};

const STORAGE_KEY = "fastfast.widget.state";
export const FAST_WIDGET_NAME = "FastTimer";

export const loadWidgetState = async (): Promise<FastWidgetState | null> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FastWidgetState) : null;
  } catch {
    return null;
  }
};

const snapshot = (): FastWidgetState => {
  const { currentFastSession, theme } = useAppStore.getState();
  return {
    startTime: currentFastSession?.start_time ?? null,
    endTime: currentFastSession?.end_time ?? null,
    targetHours: currentFastSession?.target_duration ?? null,
    colors: { card: theme.card, text: theme.text, primary: theme.primary },
    labels: {
      fasting: i18n.t("widget.fasting"),
      ready: i18n.t("widget.ready"),
      notFasting: i18n.t("widget.notFasting"),
      tapToOpen: i18n.t("widget.tapToOpen"),
      started: i18n.t("widget.started"),
      done: i18n.t("widget.done"),
    },
  };
};

const pushToWidget = async () => {
  const state = snapshot();
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));

  // Import động: thư viện chỉ có native trên Android
  const { requestWidgetUpdate } = await import("react-native-android-widget");
  const { FastTimerWidget } = await import("./FastTimerWidget");
  await requestWidgetUpdate({
    widgetName: FAST_WIDGET_NAME,
    renderWidget: () => <FastTimerWidget state={state} />,
  });
};

/** Theo dõi phiên nhịn, theme và ngôn ngữ, đẩy sang widget khi đổi. Trả về hàm huỷ. */
export const startWidgetSync = () => {
  if (Platform.OS !== "android") return () => {};

  pushToWidget().catch(() => {});

  const onLanguageChanged = () => {
    pushToWidget().catch(() => {});
  };
  i18n.on("languageChanged", onLanguageChanged);

  const unsubscribe = useAppStore.subscribe((state, prev) => {
    const session = state.currentFastSession;
    const prevSession = prev.currentFastSession;
    if (
      session?.start_time !== prevSession?.start_time ||
      session?.end_time !== prevSession?.end_time ||
      session?.target_duration !== prevSession?.target_duration ||
      state.theme !== prev.theme
    ) {
      pushToWidget().catch(() => {});
    }
  });

  return () => {
    unsubscribe();
    i18n.off("languageChanged", onLanguageChanged);
  };
};
