
// src/store/appActions.ts

import * as Localization from "expo-localization";
import { SQLiteDatabase } from "expo-sqlite";

import { createDBService } from "@/database";
import {
  AppSettings,
  FastSession,
  HabitLog,
  UserProfile,
} from "@/interfaces/db.type";
import { StreakCheckResult } from "@/interfaces/home.type";
import { handleLogin } from "@/util/login";
import { defaultDark, extractTheme, ThemeKey, ThemeType } from "@/constants/themes";
import { useAppStore } from "./appStore";

const SUPPORTED_LANGUAGES = ["vi", "en", "ja", "zh"];

/**
 * Dữ liệu được load một lần từ SQLite khi app khởi động.
 *
 * Đây là dữ liệu mà Zustand giữ trong RAM để các screen/tab
 * có thể truy cập mà không cần fetch lại từ DB.
 */
export interface AppHydrationData {
  userProfile: UserProfile | null;
  habit: HabitLog | null;
  settings: AppSettings | null;
  weight: number | null;
  currentFastSession: FastSession | null;

  theme: ThemeType;
  language: string;
}

/**
 * Kết quả trả về khi khởi tạo app.
 *
 * Ngoài dữ liệu chính để hydrate Zustand, initializeApp()
 * còn trả về kết quả từ handleLogin để App có thể xử lý
 * streak/modal/lastFast nếu cần.
 */
export interface AppInitResult {
  data: AppHydrationData;

  streak: StreakCheckResult | null;
  modal?: {
    type: string;
    closable: boolean;
  };
  lastFast?: FastSession | null;
}

/**
 * Lấy language từ AppSettings hoặc system locale.
 */
function resolveLanguage(settings: AppSettings | null): string {
  let locale =
    settings?.language ||
    Localization.getLocales()[0]?.languageCode ||
    "vi";

  if (!SUPPORTED_LANGUAGES.includes(locale.toString())) {
    locale = "en";
  }

  return locale.toString();
}

/**
 * Tạo ThemeType từ settings trong DB.
 */
function resolveTheme(settings: AppSettings | null): ThemeType {
  return extractTheme({
    theme: settings?.theme,
    isDarkMode: settings?.is_dark_mode ?? true,
  });
}

/**
 * Load toàn bộ dữ liệu cần thiết cho app từ SQLite.
 *
 * Flow:
 *
 * SQLite
 *   ↓
 * DB Service
 *   ↓
 * handleLogin()
 *   ↓
 * normalize theme/language
 *   ↓
 * AppInitResult
 *
 * Hàm này KHÔNG trực tiếp set Zustand.
 *
 * Việc set Zustand được tách riêng thành hydrateApp().
 */
export async function initializeApp(
  db: SQLiteDatabase,
): Promise<AppInitResult> {
  const start = Date.now();

  const dbService = createDBService(db);

  const [
    currentFast,
    weightObj,
    currentProfile,
    dbSettings,
    currentHabitLog,
  ] = await Promise.all([
    dbService.getLastFastSession(),
    dbService.getCurrentWeight(),
    dbService.getUserProfile(),
    dbService.getUserSettings(),
    dbService.getLastHabitLog(),
  ]);

  const {
    lastFast,
    profile,
    habitLog,
    streak,
    modal,
  } = await handleLogin({
    db,
    lastFast: currentFast,
    profile: currentProfile,
    habitLog: currentHabitLog,
  });

  const theme = resolveTheme(dbSettings);
  const language = resolveLanguage(dbSettings);

  const data: AppHydrationData = {
    userProfile: profile,
    habit: habitLog,
    settings: dbSettings,
    weight: weightObj?.weight ?? null,
    currentFastSession: lastFast ?? null,
    theme,
    language,
  };

  console.log(
    "=> [App] Khởi tạo dữ liệu Local DB thành công!",
    Date.now() - start,
    "ms",
  );

  return {
    data,
    streak,
    modal,
    lastFast,
  };
}

/**
 * Đẩy dữ liệu đã load từ DB vào Zustand.
 *
 * initializeApp() chỉ đọc dữ liệu.
 * hydrateApp() mới cập nhật RAM state.
 */
export function hydrateApp(data: AppHydrationData): void {
  useAppStore.setState({
    userProfile: data.userProfile,
    habit: data.habit,
    settings: data.settings,
    weight: data.weight,
    currentFastSession: data.currentFastSession,

    theme: data.theme,
    language: data.language,

    isLoadingData: false,
    isHydrated: true,
  });
}

/**
 * Khởi tạo toàn bộ app.
 *
 * Đây là wrapper tiện dụng nếu App chỉ cần:
 *
 * const result = await initializeAppState(db);
 */
export async function initializeAppState(
  db: SQLiteDatabase,
): Promise<AppInitResult> {
  useAppStore.setState({
    isLoadingData: true,
  });

  try {
    const result = await initializeApp(db);

    hydrateApp(result.data);

    return result;
  } catch (error) {
    console.error(
      "=> [App] Khởi tạo dữ liệu thất bại:",
      error,
    );

    useAppStore.setState({
      isLoadingData: false,
      isHydrated: false,
    });

    return {
      data: {
        userProfile: null,
        habit: null,
        settings: null,
        weight: null,
        currentFastSession: null,
        theme: defaultDark,
        language: "en",
      },
      streak: null,
    };
  }
}

/**
 * Đổi theme.
 *
 * DB được update trước.
 * Sau khi DB thành công mới update Zustand.
 */
export async function updateTheme(
  db: SQLiteDatabase,
  themeId: ThemeKey,
): Promise<void> {
  const dbService = createDBService(db);

  const { settings } = useAppStore.getState();

  const isDarkMode = settings?.is_dark_mode ?? true;

  await dbService.changeTheme(themeId);

  const theme = extractTheme({
    theme: themeId,
    isDarkMode,
  });

  useAppStore.setState({
    settings: {
      ...(settings ?? {}),
      theme: themeId.toString(),
    },
    theme,
  });
}

/**
 * Toggle Dark / Light mode.
 *
 * DB được update trước.
 * Sau khi DB thành công mới update Zustand.
 */
export async function toggleDarkMode(
  db: SQLiteDatabase,
): Promise<void> {
  const dbService = createDBService(db);

  const { settings } = useAppStore.getState();

  const currentMode = settings?.is_dark_mode ?? true;
  const newMode = !currentMode;

  await dbService.toggleTheme(newMode);

  const theme = extractTheme({
    theme: settings?.theme,
    isDarkMode: newMode,
  });

  useAppStore.setState({
    settings: {
      ...(settings ?? {}),
      is_dark_mode: newMode,
    },
    theme,
  });
}
