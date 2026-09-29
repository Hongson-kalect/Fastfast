// src/store/appStore.ts

import { defaultDark, ThemeType } from "@/constants/themes";
import {
  AppSettings,
  FastSession,
  HabitLog,
  UserProfile,
} from "@/interfaces/db.type";
import { create } from "zustand";

interface AppState {
  // User
  userProfile: UserProfile | null;
  habit: HabitLog | null;
  weight: number | null;

  // Fast
  currentFastSession: FastSession | null;

  // Settings
  settings: AppSettings | null;

  // Appearance / Locale
  theme: ThemeType;
  language: string;

  // App lifecycle
  isLoadingData: boolean;
  isHydrated: boolean;

  // Hydration
  hydrate: (data: {
    userProfile: UserProfile | null;
    habit: HabitLog | null;
    settings: AppSettings | null;
    weight: number | null;
    currentFastSession: FastSession | null;
    theme: ThemeType;
    language: string;
  }) => void;

  // Simple state setters
  updateProfile: (patch: Partial<UserProfile>) => void;
  updateHabit: (patch: Partial<HabitLog>) => void;
  updateSetting: (patch: Partial<AppSettings>) => void;
  updateWeight: (weight: number | null) => void;
  setCurrentFastSession: (fastSession: FastSession | null) => void;
  setTheme: (theme: ThemeType) => void;
  setLanguage: (language: string) => void;

  // App lifecycle
  setLoading: (isLoading: boolean) => void;
  setHydrated: (isHydrated: boolean) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  userProfile: null,
  habit: null,
  weight: null,
  currentFastSession: null,
  settings: null,

  theme: defaultDark,
  language: "en",

  isLoadingData: true,
  isHydrated: false,
};

export const useAppStore = create<AppState>((set) => ({
  ...initialState,

  /**
   * Load toàn bộ dữ liệu app vào Zustand.
   *
   * DB/business logic nằm ở appActions.ts.
   * Store chỉ nhận kết quả và lưu vào RAM.
   */
  hydrate: (data) => {
    set({
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
  },

  /**
   * Update một phần UserProfile trong RAM.
   *
   * Không ghi DB ở đây.
   * Nếu cần ghi DB, dùng action tương ứng trong appActions.ts.
   */
  updateProfile: (patch) => {
    set((state) => {
      if (!state.userProfile) {
        return state;
      }

      return {
        userProfile: {
          ...state.userProfile,
          ...patch,
        },
      };
    });
  },

  /**
   * Update một phần HabitLog trong RAM.
   */
  updateHabit: (patch) => {
    set((state) => {
      if (!state.habit) {
        return state;
      }

      return {
        habit: {
          ...state.habit,
          ...patch,
        },
      };
    });
  },

  /**
   * Update một phần AppSettings trong RAM.
   */
  updateSetting: (patch) => {
    set((state) => {
      if (!state.settings) {
        return state;
      }

      return {
        settings: {
          ...state.settings,
          ...patch,
        },
      };
    });
  },

  /**
   * Update cân nặng trong RAM.
   */
  updateWeight: (weight) => {
    set({
      weight,
    });
  },

  /**
   * Update fast session hiện tại trong RAM.
   */
  setCurrentFastSession: (fastSession) => {
    set({
      currentFastSession: fastSession,
    });
  },

  /**
   * Update theme trong RAM.
   */
  setTheme: (theme) => {
    set({
      theme,
    });
  },

  /**
   * Update language trong RAM.
   */
  setLanguage: (language) => {
    set({
      language,
    });
  },

  /**
   * Bật/tắt loading state.
   */
  setLoading: (isLoading) => {
    set({
      isLoadingData: isLoading,
    });
  },

  /**
   * Đánh dấu app đã hydrate.
   */
  setHydrated: (isHydrated) => {
    set({
      isHydrated,
    });
  },

  /**
   * Reset toàn bộ app state về trạng thái ban đầu.
   *
   * Hữu ích cho logout / clear local data.
   */
  reset: () => {
    set({
      ...initialState,
    });
  },
}));
