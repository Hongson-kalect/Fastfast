import { FASTING_TARGETS } from "@/constants/data";
import { EMOTION_PACKS, getEmotionPack } from "@/constants/emotions";
import { useAppStore } from "@/stores/appStore";
import { onMoodChange } from "@/utils/moodEvents";
import { TargetFrame } from "@/utils/targetColor";
import { getLocalTodayStr } from "@/utils/timer";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "i18next";
import { Platform } from "react-native";

/**
 * Ảnh chụp trạng thái cho widget. Widget chạy trong headless JS nên không đọc
 * được store khi app đã tắt; app ghi ảnh chụp này mỗi khi phiên, theme hay mood đổi.
 */
export type FastWidgetState = {
  startTime: number | null;
  endTime: number | null;
  targetHours: number | null;
  /** Mục tiêu đang chọn, hiện khi chưa có phiên nào */
  defaultTarget?: number | null;
  streak?: number;
  /** Mood hôm nay; widget bỏ qua khi date không còn là hôm nay */
  mood?: { date: string; level: number } | null;
  /** 5 mức mood (0–4) theo bộ cảm xúc đang dùng */
  moods?: { emoji: string; color: string }[];
  colors: { card: string; text: string; primary: string };
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

const snapshot = (): Omit<FastWidgetState, "mood"> => {
  const { currentFastSession, theme, settings, userProfile } =
    useAppStore.getState();
  const isDark = settings?.is_dark_mode ?? true;

  // Widget chỉ vẽ được chữ: bộ cảm xúc dùng icon dạng component thì lấy emoji mặc định
  const pack = getEmotionPack(settings?.emotion_pack);
  const emotions = pack.emotions.every((item) => typeof item.icon.light === "string")
    ? pack.emotions
    : EMOTION_PACKS.default.emotions;

  return {
    startTime: currentFastSession?.start_time ?? null,
    endTime: currentFastSession?.end_time ?? null,
    targetHours: currentFastSession?.target_duration ?? null,
    defaultTarget: settings?.target ?? null,
    streak: userProfile?.current_streak ?? 0,
    moods: emotions.map((item) => ({
      emoji: String(item.icon[isDark ? "dark" : "light"]),
      color: item.color[isDark ? "dark" : "light"],
    })),
    colors: { card: theme.card, text: theme.text, primary: theme.primary },
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

const pushToWidget = async () => {
  // Mood không có trong store của app nên giữ từ lần ghi trước
  const previous = await loadWidgetState();
  await renderWidgets({ ...snapshot(), mood: previous?.mood ?? null });
};

// Màn hình trong app đăng ký để nạp lại khi widget ghi dữ liệu (app đang chạy nền)
const changeListeners = new Set<() => void>();

export const onWidgetDataChange = (listener: () => void) => {
  changeListeners.add(listener);
  return () => {
    changeListeners.delete(listener);
  };
};

export const emitWidgetDataChange = () => {
  changeListeners.forEach((listener) => listener());
};

/** Gọi khi mood của một ngày đổi; widget chỉ quan tâm mood hôm nay. */
export const syncWidgetMood = async (date: string, level: number | null) => {
  if (Platform.OS !== "android" || date !== getLocalTodayStr()) return;
  const previous = await loadWidgetState();
  if (!previous) return;
  await renderWidgets({
    ...previous,
    mood: level == null ? null : { date, level },
  });
};

/** Theo dõi phiên nhịn, streak, theme và ngôn ngữ, đẩy sang widget khi đổi. Trả về hàm huỷ. */
export const startWidgetSync = () => {
  if (Platform.OS !== "android") return () => {};

  pushToWidget().catch((e) => console.warn("widget sync error", e));

  const onLanguageChanged = () => {
    pushToWidget().catch((e) => console.warn("widget sync error", e));
  };
  i18n.on("languageChanged", onLanguageChanged);

  // App tự đổi mood (Home, Journey) → cập nhật mood trên widget
  const offMoodChange = onMoodChange((date, level) => {
    syncWidgetMood(date, level).catch((e) => console.warn("widget sync error", e));
  });

  const unsubscribe = useAppStore.subscribe((state, prev) => {
    const session = state.currentFastSession;
    const prevSession = prev.currentFastSession;
    if (
      session?.start_time !== prevSession?.start_time ||
      session?.end_time !== prevSession?.end_time ||
      session?.target_duration !== prevSession?.target_duration ||
      state.userProfile?.current_streak !== prev.userProfile?.current_streak ||
      state.settings?.target !== prev.settings?.target ||
      state.settings?.emotion_pack !== prev.settings?.emotion_pack ||
      state.theme !== prev.theme
    ) {
      pushToWidget().catch((e) => console.warn("widget sync error", e));
    }
  });

  return () => {
    unsubscribe();
    offMoodChange();
    i18n.off("languageChanged", onLanguageChanged);
  };
};
