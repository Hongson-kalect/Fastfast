// src/store/useAppSettingsStore.ts

import * as Localization from "expo-localization";
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

const SECURE_STORAGE_KEY = "fastfast_app_settings";

// 1. Định nghĩa cấu trúc Bảng màu động chi tiết theo yêu cầu của bạn
export interface ThemeColors {
  primary: string;
  secondary: string;
  title: string;
  text: string;
  textSecondary: string; // Nền chính (VD: #0B1528)
  background: string; // Nền thẻ card/surface (VD: #16223F)
  backgroundSecondary: string;
  backgroundElement: string;
  backgroundSelected: string;
  error: string;
  success: string;
  white: string;
  black: string;
}

export interface ThemeStructure {
  id: string;
  name: string;
  mode: "light" | "dark";
  colors: ThemeColors;
}

export interface StyleStructure {
  light: ThemeStructure;
  dark: ThemeStructure;
}

const defaultDarkMode = true;

// 2. Bộ màu mặc định cứng (Fallback khi SecureStore trống)
export const defaultStyle: StyleStructure = {
  dark: {
    id: "deep-blue",
    name: "Xanh Đậm Công Nghệ",
    mode: "dark",
    colors: {
      primary: "#3B82F6", // Xanh chủ đạo (Nút bấm chính)
      secondary: "#10B981", // Xanh phụ
      title: "#F8FAFC", // Chữ tiêu đề lớn
      text: "#94A3B8", // Chữ nội dung
      textSecondary: "#B0B4BA",
      background: "#0B1528", // Nền sâu nhất
      backgroundSecondary: "#16223F", // Nền thẻ card
      backgroundElement: "#212225",
      backgroundSelected: "#2E3135",
      error: "#EF4444",
      success: "#22C55E",
      white: "#ffffff",
      black: "#000000",
    },
  },

  light: {
    id: "deep-blue",
    name: "Xanh Đām Công Nghệ",
    mode: "dark",
    colors: {
      primary: "#3B82F6", // Xanh chủ đạo (Nút bấm chính)
      secondary: "#10B981", // Xanh phụ
      title: "#F8FAFC", // Chữ tiêu đề lớn
      text: "#000000",
      textSecondary: "#60646C",
      background: "#ffffff",
      backgroundSecondary: "#f5f5f5",
      backgroundElement: "#F0F0F3",
      backgroundSelected: "#E0E1E6",
      error: "#EF4444",
      success: "#22C55E",
      white: "#ffffff",
      black: "#000000",
    },
  },
};
// 3. Cấu trúc toàn bộ cấu hình hệ thống (Có thể mở rộng sau này)
interface AppSettingsState {
  // Trạng thái (RAM)
  theme: ThemeStructure;
  language: string;
  isHydrated: boolean; // Kiểm tra đã nạp xong data từ SecureStore chưa

  // Hành động (Actions)
  initSettings: () => Promise<void>; // Hàm nạp data khi vào app (getTheme / getSettings)
  updateTheme: (newTheme: ThemeStructure) => Promise<void>;
  updateMode: (
    mode: "light" | "dark",
    updatedColors: ThemeColors,
  ) => Promise<void>;
  updateLanguage: (lang: string) => Promise<void>;
}

const supported_languages = ["vi", "en"];
type Lang = keyof typeof supported_languages;

export const useAppSettingsStore = create<AppSettingsState>((set, get) => ({
  theme: defaultStyle[defaultDarkMode ? "dark" : "light"],
  isDarkMode: defaultDarkMode,
  language: "vi",
  isHydrated: false,

  // 🌟 HÀM KHỞI ĐỘNG (Bản nâng cấp của getTheme): Gọi ở file Root Layout khi bật app
  initSettings: async () => {
    try {
      const savedSettings = await SecureStore.getItemAsync(SECURE_STORAGE_KEY);
      const locale = Localization.getLocales()[0];

      let style = defaultStyle;
      let isDarkMode = defaultDarkMode;
      let lang_code = locale.languageCode;

      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        style = parsed.style;
        isDarkMode = parsed.isDarkMode;
        lang_code = parsed.language;
        if (!lang_code || !supported_languages.includes(lang_code)) {
          lang_code = "en";
        }
      } else {
        // Lần đầu mở app chưa có cấu hình
      }
      let langcode = "vi";
      if (!lang_code || !supported_languages.includes(lang_code)) {
        langcode = "en";
      } else {
        langcode = lang_code;
      }

      set({
        theme: style[isDarkMode ? "dark" : "light"],
        language: langcode,
        isHydrated: true,
      });
    } catch (error) {
      console.error("Lỗi khi load cấu hình từ SecureStore:", error);
      set({
        theme: defaultStyle[defaultDarkMode ? "dark" : "light"],
        language: "en",
        isHydrated: true,
      }); // Fallback an toàn
    }
  },

  // 🌟 HÀM THAY ĐỔI THEME (Gọi khi cài lại theme mới từ DB)
  updateTheme: async (newTheme) => {
    try {
      const currentLanguage = get().language;
      const updatedData = { theme: newTheme, language: currentLanguage };

      // Đồng bộ vào ổ cứng bảo mật
      await SecureStore.setItemAsync(
        SECURE_STORAGE_KEY,
        JSON.stringify(updatedData),
      );

      // Cập nhật RAM để UI nhảy màu ngay lập tức
      set({ theme: newTheme });
    } catch (error) {
      console.error("Lỗi khi lưu theme mới:", error);
    }
  },

  // Thay đổi nhanh chế độ sáng tối
  updateMode: async (mode, updatedColors) => {
    try {
      const currentTheme = get().theme;
      const currentLanguage = get().language;

      const newTheme: ThemeStructure = {
        ...currentTheme,
        mode: mode,
        colors: updatedColors,
      };

      await SecureStore.setItemAsync(
        SECURE_STORAGE_KEY,
        JSON.stringify({ theme: newTheme, language: currentLanguage }),
      );
      set({ theme: newTheme });
    } catch (error) {
      console.error("Lỗi khi cập nhật mode sáng tối:", error);
    }
  },

  // Cấu hình mở rộng ví dụ: Thay đổi ngôn ngữ
  updateLanguage: async (lang) => {
    try {
      const currentTheme = get().theme;
      await SecureStore.setItemAsync(
        SECURE_STORAGE_KEY,
        JSON.stringify({ theme: currentTheme, language: lang }),
      );
      set({ language: lang });
    } catch (error) {
      console.error("Lỗi khi lưu ngôn ngữ:", error);
    }
  },
}));
