import { createDBService, DATABASE_NAME } from "@/database";
import { setDailyNote } from "@/database/schema/daily_note";
import {
  getLastFastSession,
  startNewSession,
} from "@/database/schema/fast_sessions";
import { getUserSettings } from "@/database/schema/setting";
import { MoodLevel } from "@/interfaces/db.type";
import "@/providers/Language";
import { resolveLanguage } from "@/stores/appAction";
import { useAppStore } from "@/stores/appStore";
import { scheduleTargetReached } from "@/utils/notifications";
import { getLocalTodayStr } from "@/utils/timer";
import { openDatabaseAsync, SQLiteDatabase } from "expo-sqlite";
import i18n from "i18next";
import {
  emitWidgetDataChange,
  FastWidgetState,
  loadWidgetState,
} from "./widgetState";

/**
 * Thao tác bấm trực tiếp trên widget. Chạy trong headless JS: app có thể đang
 * tắt (store rỗng) hoặc đang chạy nền (store có dữ liệu, cần cập nhật theo).
 */

// Kết nối riêng: đóng xong không ảnh hưởng kết nối của SQLiteProvider trong app
const withDatabase = async <T>(run: (db: SQLiteDatabase) => Promise<T>) => {
  const db = await openDatabaseAsync(DATABASE_NAME, { useNewConnection: true });
  try {
    return await run(db);
  } finally {
    await db.closeAsync();
  }
};

/** Store đã được app nạp dữ liệu, tức app đang chạy (kể cả chạy nền). */
const isAppLoaded = () => useAppStore.getState().userProfile != null;

/** Bắt đầu phiên nhịn mới; bỏ qua nếu đang nhịn. Trả về trạng thái widget mới. */
export const startFastFromWidget = async (): Promise<FastWidgetState | null> => {
  const appLoaded = isAppLoaded();

  const session = await withDatabase(async (db) => {
    const last = await getLastFastSession(db);
    if (last && !last.end_time) return last;

    const settings = await getUserSettings(db);
    const started = await startNewSession(db, Date.now(), settings?.target);
    if (!started) return last;

    // App tắt thì i18n chưa đặt ngôn ngữ: chữ thông báo cần đúng ngôn ngữ người dùng
    if (!appLoaded) await i18n.changeLanguage(resolveLanguage(settings));
    if (settings?.notify_target_reached !== false) {
      // Không xin quyền từ widget: hộp xin quyền sẽ kéo app lên màn hình
      await scheduleTargetReached(createDBService(db), started, {
        requestPermission: false,
      });
    }
    return started;
  });

  // App đang chạy: cập nhật store để màn Home đổi ngay; store tự đẩy lại widget
  if (appLoaded && session) {
    useAppStore.getState().setCurrentFastSession(session);
  }

  const previous = await loadWidgetState();
  if (!previous || !session) return previous;
  return {
    ...previous,
    startTime: session.start_time,
    endTime: session.end_time ?? null,
    targetHours: session.target_duration ?? null,
  };
};

/** Lưu mood hôm nay. Trả về trạng thái widget mới. */
export const setMoodFromWidget = async (
  level: MoodLevel,
): Promise<FastWidgetState | null> => {
  await withDatabase((db) => setDailyNote(db, level));
  emitWidgetDataChange();

  const previous = await loadWidgetState();
  if (!previous) return previous;
  return { ...previous, mood: { date: getLocalTodayStr(), level } };
};
