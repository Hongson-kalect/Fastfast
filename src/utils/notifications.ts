import { DBService } from "@/hooks/useDBService";
import { FastSession } from "@/interfaces/db.type";
import { useAppStore } from "@/stores/appStore";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Thông báo cục bộ (không cần server). Chạy được cả trong Expo Go.
const CHANNEL_ID = "fasting";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let channelReady = false;

/** Tạo channel Android (bắt buộc trước khi xin quyền trên Android 13+) rồi xin quyền. */
export const ensureNotificationPermission = async (): Promise<boolean> => {
  try {
    if (Platform.OS === "android" && !channelReady) {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: "Fasting",
        importance: Notifications.AndroidImportance.HIGH,
      });
      channelReady = true;
    }

    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;

    const { granted } = await Notifications.requestPermissionsAsync();
    return granted;
  } catch (e) {
    console.warn("notification permission error", e);
    return false;
  }
};

const saveSetting = async (
  dbService: DBService,
  key: "target_notification_id" | "daily_reminder_id" | "daily_reminder",
  value: unknown,
) => {
  await dbService.setting(key, value);
  useAppStore.getState().updateSetting({ [key]: value });
};

const cancel = async (id?: string | null) => {
  if (!id) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch (e) {
    console.warn("cancel notification error", e);
  }
};

// ─────────────────────────────
// Đạt mục tiêu nhịn
// ─────────────────────────────

export const cancelTargetReached = async (dbService: DBService) => {
  const id = useAppStore.getState().settings?.target_notification_id;
  if (!id) return;
  await cancel(id);
  await saveSetting(dbService, "target_notification_id", null);
};

/** Lên lịch báo khi phiên đạt target_duration (giờ). Gọi lại khi đổi target. */
export const scheduleTargetReached = async (
  dbService: DBService,
  session: FastSession,
) => {
  await cancelTargetReached(dbService);

  const settings = useAppStore.getState().settings;
  if (settings?.notify_target_reached === false) return;
  if (!session.target_duration || session.end_time) return;

  const fireAt = session.start_time + session.target_duration * 3600 * 1000;
  if (fireAt <= Date.now()) return;

  if (!(await ensureNotificationPermission())) return;

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "🎉 Đã đạt mục tiêu!",
        body: `Bạn đã nhịn đủ ${session.target_duration} giờ. Kết thúc phiên để ghi nhận nhé.`,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(fireAt),
        channelId: CHANNEL_ID,
      },
    });
    await saveSetting(dbService, "target_notification_id", id);
  } catch (e) {
    console.warn("schedule target notification error", e);
  }
};

// ─────────────────────────────
// Nhắc nhở hằng ngày
// ─────────────────────────────

/** Bật (time) hoặc tắt (null) nhắc nhở mỗi ngày. Trả về false nếu không có quyền. */
export const setDailyReminder = async (
  dbService: DBService,
  time: { hour: number; minute: number } | null,
): Promise<boolean> => {
  await cancel(useAppStore.getState().settings?.daily_reminder_id);
  await saveSetting(dbService, "daily_reminder_id", null);

  if (!time) {
    await saveSetting(dbService, "daily_reminder", null);
    return true;
  }

  if (!(await ensureNotificationPermission())) return false;

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Đến giờ nhịn rồi ⏱️",
        body: "Bắt đầu phiên hôm nay để giữ streak và độ bền thói quen.",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: time.hour,
        minute: time.minute,
        channelId: CHANNEL_ID,
      },
    });
    await saveSetting(dbService, "daily_reminder_id", id);
    await saveSetting(dbService, "daily_reminder", time);
    return true;
  } catch (e) {
    console.warn("schedule daily reminder error", e);
    return false;
  }
};

export const formatReminderTime = (time?: { hour: number; minute: number } | null) =>
  time
    ? `${String(time.hour).padStart(2, "0")}:${String(time.minute).padStart(2, "0")}`
    : "Off";
