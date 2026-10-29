import { FASTING_TARGETS } from "@/constants/data";
import { useAppStore } from "@/stores/appStore";
import { TargetFrame } from "@/utils/targetColor";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "i18next";
import { Platform } from "react-native";

/**
 * Ảnh chụp trạng thái cho widget. Widget chạy trong headless JS nên không đọc
 * được store khi app đã tắt; app ghi ảnh chụp này mỗi khi phiên, streak, theme hay ngôn ngữ đổi.
 */
export type FastWidgetState = {
  startTime: number | null;
  endTime: number | null;
  targetHours: number | null;
  /** Mục tiêu đang chọn, hiện khi chưa có phiên nào */
  defaultTarget?: number | null;
  streak?: number;
  /** Tên mục tiêu đã dịch theo số giờ, VD { "20": "Chiến binh" } */
  targetNames?: Record<string, string>;
  colors: { card: string; text: string; primary: string; success?: string };
  /** Khung giờ + màu các mục tiêu, để widget tô màu như vòng tròn ở Home */
  targetFrames?: TargetFrame[];
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
  start: string;
  end: string;
  lastFast: string;
  /** Có chỗ trống {time}, widget tự điền thời gian */
  endedAgo: string;
  target: string;
  /** Có chỗ trống {n}, VD "14 giờ" */
  hours?: string;
  lessThanHour?: string;
  /** Thứ viết tắt, CN → T7 (index theo Date.getDay()) */
  weekdays?: string[];
};

const STORAGE_KEY = "fastfast.widget.state";
export const FAST_WIDGET_NAME = "FastTimer";
export const COMPACT_WIDGET_NAME = "FastCompact";

export const loadWidgetState = async (): Promise<FastWidgetState | null> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FastWidgetState) : null;
  } catch {
    return null;
  }
};

export const saveWidgetState = (state: FastWidgetState) =>
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));

const snapshot = (): FastWidgetState => {
  const { currentFastSession, theme, settings, userProfile } =
    useAppStore.getState();

  return {
    startTime: currentFastSession?.start_time ?? null,
    endTime: currentFastSession?.end_time ?? null,
    targetHours: currentFastSession?.target_duration ?? null,
    defaultTarget: settings?.target ?? null,
    streak: userProfile?.current_streak ?? 0,
    targetNames: Object.fromEntries(
      FASTING_TARGETS.map((item) => [
        String(item.hours),
        i18n.t(`targets.${item.id}.label`),
      ]),
    ),
    colors: {
      card: theme.card,
      text: theme.text,
      primary: theme.primary,
      success: theme.success,
    },
    targetFrames: FASTING_TARGETS.map((item) => ({
      hours: item.hours,
      toHours: item.toHours,
      color: item.colors.accent,
    })),
    labels: {
      fasting: i18n.t("widget.fasting"),
      ready: i18n.t("widget.ready"),
      notFasting: i18n.t("widget.notFasting"),
      tapToOpen: i18n.t("widget.tapToOpen"),
      started: i18n.t("widget.started"),
      done: i18n.t("widget.done"),
      start: i18n.t("widget.start"),
      end: i18n.t("widget.end"),
      lastFast: i18n.t("widget.lastFast"),
      endedAgo: i18n.t("widget.endedAgo", { time: "{time}" }),
      target: i18n.t("widget.target"),
      hours: i18n.t("widget.hours", { n: "{n}" }),
      lessThanHour: i18n.t("widget.lessThanHour"),
      weekdays: Array.from({ length: 7 }, (_, day) => i18n.t(`date.weekday.${day}`)),
    },
  };
};

/** Vẽ lại mọi widget đang đặt trên màn hình chính với trạng thái cho trước. */
export const renderWidgets = async (state: FastWidgetState) => {
  await saveWidgetState(state);

  // Import động: thư viện chỉ có native trên Android
  const { requestWidgetUpdate } = await import("react-native-android-widget");
  const { FastTimerWidget } = await import("./FastTimerWidget");
  const { CompactFastWidget } = await import("./CompactFastWidget");
  await requestWidgetUpdate({
    widgetName: FAST_WIDGET_NAME,
    renderWidget: (info) => (
      <FastTimerWidget state={state} width={info.width} height={info.height} />
    ),
  });
  await requestWidgetUpdate({
    widgetName: COMPACT_WIDGET_NAME,
    renderWidget: (info) => (
      <CompactFastWidget state={state} width={info.width} height={info.height} />
    ),
  });
};

const pushToWidget = () => renderWidgets(snapshot());

/** Theo dõi phiên nhịn, streak, theme và ngôn ngữ, đẩy sang widget khi đổi. Trả về hàm huỷ. */
export const startWidgetSync = () => {
  if (Platform.OS !== "android") return () => {};

  pushToWidget().catch((e) => console.warn("widget sync error", e));

  const onLanguageChanged = () => {
    pushToWidget().catch((e) => console.warn("widget sync error", e));
  };
  i18n.on("languageChanged", onLanguageChanged);

  const unsubscribe = useAppStore.subscribe((state, prev) => {
    const session = state.currentFastSession;
    const prevSession = prev.currentFastSession;
    if (
      session?.start_time !== prevSession?.start_time ||
      session?.end_time !== prevSession?.end_time ||
      session?.target_duration !== prevSession?.target_duration ||
      state.userProfile?.current_streak !== prev.userProfile?.current_streak ||
      state.settings?.target !== prev.settings?.target ||
      state.theme !== prev.theme
    ) {
      pushToWidget().catch((e) => console.warn("widget sync error", e));
    }
  });

  return () => {
    unsubscribe();
    i18n.off("languageChanged", onLanguageChanged);
  };
};
