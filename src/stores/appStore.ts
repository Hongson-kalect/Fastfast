// src/store/appStore.ts
import {
  defaultDark,
  extractTheme,
  ThemeType
} from "@/constants/themes";
import { createDBService } from "@/database";
import {
  AppSettings,
  FastSession,
  HabitLog,
  UserProfile,
} from "@/interfaces/db.type";
import { StreakCheckResult } from "@/interfaces/home.type";
import { handleLogin } from "@/util/login";
import * as Localization from "expo-localization";
import { SQLiteDatabase } from "expo-sqlite";
import { create } from "zustand";

interface AppState {
  userProfile: UserProfile | null;
  habit: HabitLog | null;

  settings: AppSettings | null;
  weight: number | null;
  currentFastSession: FastSession | null;
  // configs: SystemConfigObj | null;
  theme: ThemeType;
  isLoadingData: boolean;
  language: string;
  isHydrated: boolean;

  // Hàm cốt lõi để nạp dữ liệu từ local DB lên RAM Zustand
  init: (db: SQLiteDatabase) => Promise<{
    streak: StreakCheckResult | null;
    modal?: { type: string; closable: boolean };
    lastFast?: FastSession | null;
  }>;
  updateProfile: (val: { [K in keyof UserProfile]: any }) => void;
  updateHabit: (val: { [K in keyof HabitLog]: any }) => void;
  updateSetting: (val: { [K in keyof AppSettings]: any }) => void;
  updateWeight: (weight: number) => void;
  setCurrentFastSession: (fastSession: FastSession | null) => void;
  updateTheme: (db: ReturnType<typeof createDBService>, theme: string) => void;
  toggleDarkMode: (db: ReturnType<typeof createDBService>) => void;
}

const SUPPORTED_LANGUAGES = ["vi", "en", "ja", "zh"];

export const useAppStore = create<AppState>((set, get) => {
  return {
    userProfile: null,
    habit: null,
    settings: {},
    currentFastSession: null,
    weight: null,
    setCurrentFastSession: (fastSession) =>
      set({ currentFastSession: fastSession }),
    theme: defaultDark,
    isLoadingData: true, // Mặc định là true để giữ màn hình Loading/Splash
    language: "en",
    isHydrated: false, // Kiểm tra đã nạp xong data từ SecureStore chưa
    init: async (db: SQLiteDatabase) => {
      const start = Date.now();
      set({ isLoadingData: true });
      try {
        const dbService = createDBService(db);
        // next_expected_streak_date < now => streak = 0
        // streak cal: Nếu ngày lấy streak < now => streak + = 1 max_streak = Math.max(streak, max_streak)
        // next_expected_streak_date < tomorow => next_expected_streak_date = tomorrow,

        const currentFast = await dbService.getLastFastSession();
        const weightObj = await dbService.getCurrentWeight();
        const currentProfile = await dbService.getUserProfile();
        const dbSettings = await dbService.getUserSettings();
        const currentHabitLog = await dbService.getLastHabitLog();
        const { lastFast, profile, habitLog, streak, modal } =
          await handleLogin({
            db,
            lastFast: currentFast,
            profile: currentProfile,
            habitLog: currentHabitLog,
          });

        const theme = extractTheme({
          theme: dbSettings?.theme,
          isDarkMode: dbSettings?.is_dark_mode,
        });

        let locale =
          dbSettings?.language ||
          Localization.getLocales()[0]?.languageCode ||
          "vi";
        if (!SUPPORTED_LANGUAGES.includes(locale.toString())) {
          locale = "en";
        }

        // 2. Lấy trạng thái dark mode lưu trong settings (hoặc fallback mặc định)
        // Giả sử Sơn lưu flag dark mode ở bảng app_settings với key là 'is_dark_mode'

        // 3. Bốc palette màu tương ứng từ cái themeObj vừa băm từ AsyncStorage ra

        set({
          currentFastSession: lastFast || null,
          weight: weightObj?.weight,
          userProfile: profile,
          habit: habitLog,
          settings: dbSettings,
          theme: theme,
          isLoadingData: false,
          language: locale.toString(),
        });
        console.log(
          "=> [Zustand] Khởi tạo dữ liệu Local DB thành công!",
          Date.now() - start,
        );
        return {
          streak,
          modal,
          lastFast,
        };
      } catch (error) {
        console.error("=> [Zustand] Khởi tạo dữ liệu thất bại:", error);
        set({ isLoadingData: false });
        return {
          streak: null,
        };
      }
    },

    updateProfile: (val: { [K in keyof UserProfile]: any }) => {
      const profile = get().userProfile;
      if (profile) {
        set({ userProfile: { ...profile, ...val } });
      }
    },
    updateHabit: (val: { [K in keyof HabitLog]: any }) => {
      const habit = get().habit;
      if (habit) {
        set({ habit: { ...habit, ...val } });
      }
    },
    updateSetting: (obj: object) =>
      set((state) => ({
        settings: {
          ...state.settings,
          ...obj,
        },
      })),
    updateWeight: (weight: number) => set({ weight: weight }),
    updateTheme: async (
      dbService: ReturnType<typeof createDBService>,
      themeId: string,
    ) => {
      const { settings } = get();
      const currentMode = settings?.is_dark_mode ?? true;
      await dbService?.changeTheme(themeId);

      const theme = extractTheme({ theme: themeId, isDarkMode: currentMode });
      set((state) => ({
        theme: theme,
      }));
    },

    toggleDarkMode: async (dbService: ReturnType<typeof createDBService>) => {
      const { settings } = get();
      const currentMode = settings?.is_dark_mode ?? true;
      await dbService?.toggleTheme(!currentMode);
      const newTheme = extractTheme({
        theme: settings?.theme,
        isDarkMode: !currentMode,
      });

      set((state) => ({
        settings: {
          ...state.settings,
          is_dark_mode: !currentMode,
        },
        theme: newTheme,
      }));
    },
  };
});
