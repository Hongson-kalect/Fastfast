import {
  darkTheme,
  defaultTheme,
  extractTheme,
  ThemeType,
} from "@/database/shema/theme";
// src/store/appStore.ts
import { createDBService, handleLogin } from "@/database";
import { AppSettings, FastSession, UserProfile } from "@/interfaces/db.type";
import * as Localization from "expo-localization";
import { SQLiteDatabase } from "expo-sqlite";
import { create } from "zustand";

type ColorPalette = typeof darkTheme;

interface AppState {
  userProfile:
    | (UserProfile & {
        habit_percent: number;
        shield: number;
        habit_retain: number;
      })
    | null;
  settings: AppSettings | null;
  weight: number | null;
  currentFastSession: FastSession | null;
  // configs: SystemConfigObj | null;
  themeObj: ThemeType;
  theme: ColorPalette;
  isDarkMode: boolean;
  isLoadingData: boolean;
  language: string;
  isHydrated: boolean;

  // Hàm cốt lõi để nạp dữ liệu từ local DB lên RAM Zustand
  init: (db: SQLiteDatabase) => Promise<boolean>;
  updateProfile: (val: { [K in keyof UserProfile]: any }) => void;
  updateHabit: (val: { habit_percent: number; shield: number }) => void;
  updateSetting: (val: { [K in keyof AppSettings]: any }) => void;
  updateWeight: (weight: number) => void;
  setCurrentFastSession: (fastSession: FastSession | null) => void;
  updateTheme: (obj: ThemeType) => void;
  toggleDarkMode: (db: ReturnType<typeof createDBService>) => void;
}

const SUPPORTED_LANGUAGES = ["vi", "en", "ja", "zh"];

export const useAppStore = create<AppState>((set, get) => {
  return {
    userProfile: null,
    settings: {},
    currentFastSession: null,
    weight: null,
    setCurrentFastSession: (fastSession) =>
      set({ currentFastSession: fastSession }),
    themeObj: defaultTheme,
    theme: darkTheme,
    isDarkMode: true,
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

        // Chạy song song cả 3 truy vấn để tối ưu hóa tốc độ khởi động
        let [
          currentFast,
          weightObj,
          currentProfile,
          dbSettings,
          themes,
          currentHabitLog,
        ] = await Promise.all([
          dbService.getLastFastSession(),
          dbService.getCurrentWeight(),
          dbService.getUserProfile(),
          dbService.getUserSettings(),
          dbService.getThemes(),
          dbService.getLastHabitLog(),
        ]);

        const { lastFast, profile, habitLog } = await handleLogin({
          db,
          lastFast: currentFast,
          profile: currentProfile,
          habitLog: currentHabitLog,
        });

        const { themeObj, theme, is_dark_mode } = extractTheme(
          themes,
          dbSettings,
        );

        let locale =
          dbSettings?.language ||
          Localization.getLocales()[0]?.languageCode ||
          "vi";
        if (!SUPPORTED_LANGUAGES.includes(locale.toString())) {
          locale = "en";
        }

        // 2. Lấy trạng thái dark mode lưu trong settings (hoặc fallback mặc định)
        // Giả sử Sơn lưu flag dark mode ở bảng app_settings với key là 'is_dark_mode'
        const isDarkMode = dbSettings?.is_dark_mode === true || true;

        // 3. Bốc palette màu tương ứng từ cái themeObj vừa băm từ AsyncStorage ra

        set({
          currentFastSession: lastFast || null,
          weight: weightObj?.weight,
          userProfile: profile && {
            ...profile,
            habit_percent: habitLog?.habit_snap || 0,
            habit_retain: habitLog?.habit_retain || 0,
            shield: habitLog?.shield_snap || 0,
          },
          settings: dbSettings,
          theme: theme,
          themeObj: themeObj,
          isDarkMode: is_dark_mode,
          isLoadingData: false,
          language: locale.toString(),
        });

        console.log(
          "=> [Zustand] Khởi tạo dữ liệu Local DB thành công!",
          Date.now() - start,
        );
        return true;
      } catch (error) {
        console.error("=> [Zustand] Khởi tạo dữ liệu thất bại:", error);
        set({ isLoadingData: false });
        return false;
      }
    },

    updateProfile: (val: { [K in keyof UserProfile]: any }) => {
      const profile = get().userProfile;
      if (profile) {
        set({ userProfile: { ...profile, ...val } });
      }
    },

    updateHabit: (val: { habit_percent: number; shield: number }) => {
      const profile = get().userProfile;
      if (profile) {
        set({ userProfile: { ...profile, ...val } });
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
    updateTheme: async (obj: ThemeType) => {
      const { isDarkMode } = get();

      set((state) => ({
        themeObj: obj,
        theme: isDarkMode
          ? obj.color_palette["dark"] || defaultTheme.color_palette.dark
          : obj.color_palette["light"] || defaultTheme.color_palette.light,
      }));
    },

    toggleDarkMode: async (dbService: ReturnType<typeof createDBService>) => {
      const { isDarkMode, themeObj } = get();
      await dbService?.toggleTheme(!isDarkMode);

      set((state) => ({
        isDarkMode: !isDarkMode,
      }));
    },
  };
});
