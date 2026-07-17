import { darkTheme, defaultTheme } from "@/database/shema/theme";
// src/store/appStore.ts
import { createDBService } from "@/database";
import { AppSettings, UserProfile } from "@/interfaces/db.type";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import { SQLiteDatabase } from "expo-sqlite";
import { create } from "zustand";

type ColorPalette = typeof darkTheme;
type ThemeType = {
  name?: string;
  id?: string;
  light: ColorPalette;
  dark: ColorPalette;
};
interface AppState {
  userProfile: UserProfile | null;
  settings: AppSettings | null;
  // configs: SystemConfigObj | null;
  themeObj: ThemeType;
  theme: ColorPalette;
  isDarkMode: boolean;
  isLoadingData: boolean;
  language: string;
  isHydrated: boolean;

  // Hàm cốt lõi để nạp dữ liệu từ local DB lên RAM Zustand
  init: (db: SQLiteDatabase) => Promise<boolean>;
  updateSetting: (obj: object) => void;
  updateTheme: (obj: ThemeType) => void;
  toggleDarkMode: (db: ReturnType<typeof createDBService>) => void;
}

const SUPPORTED_LANGUAGES = ["vi", "en", "ja", "zh"];

export const useAppStore = create<AppState>((set, get) => {
  return {
    userProfile: null,
    settings: {},
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

        // Chạy song song cả 3 truy vấn để tối ưu hóa tốc độ khởi động
        const [profile, dbSettings, themeObj] = await Promise.all([
          dbService.getUserProfile(),
          dbService.getUserSettings(),
          dbService.getLocalTheme(),
        ]);

        let locale =
          dbSettings?.display_language ||
          Localization.getLocales()[0]?.languageCode ||
          "vi";
        if (!SUPPORTED_LANGUAGES.includes(locale.toString())) {
          locale = "en";
        }

        // 2. Lấy trạng thái dark mode lưu trong settings (hoặc fallback mặc định)
        // Giả sử Sơn lưu flag dark mode ở bảng app_settings với key là 'is_dark_mode'
        const isDarkMode =
          dbSettings?.is_dark_mode === "true" ||
          dbSettings?.is_dark_mode === true ||
          true;

        // 3. Bốc palette màu tương ứng từ cái themeObj vừa băm từ AsyncStorage ra
        const activeThemeColors =
          themeObj[isDarkMode ? "dark" : "light"] ||
          defaultTheme[isDarkMode ? "dark" : "light"];

        set({
          userProfile: profile,
          settings: dbSettings,
          theme: isDarkMode
            ? themeObj["dark"] || defaultTheme.dark
            : themeObj["light"] || defaultTheme.light,
          isDarkMode: isDarkMode,
          isLoadingData: false,
          language: locale.toString(),
        });

        console.log(
          "=> [Zustand] Khởi tạo dữ liệu Local DB thành công!",
          Date.now() - start,
        );

        if (!dbSettings?.learning_language) {
          return false;
        }
        return true;
      } catch (error) {
        console.error("=> [Zustand] Khởi tạo dữ liệu thất bại:", error);
        set({ isLoadingData: false });
        return false;
      }
    },

    updateSetting: (obj: object) =>
      set((state) => ({
        settings: {
          ...state.settings,
          ...obj,
        },
      })),
    updateTheme: async (obj: ThemeType) => {
      const { isDarkMode } = get();
      await AsyncStorage.setItem("theme", JSON.stringify(obj));

      set((state) => ({
        themeObj: obj,
        theme: isDarkMode
          ? obj["dark"] || defaultTheme.dark
          : obj["light"] || defaultTheme.light,
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
