// src/store/authStore.ts
import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

interface AuthState {
  accessToken: string | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  initAuth: () => void;
  login: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  isAuthenticated: false,
  isGuest: false,

  // Kiểm tra trạng thái đăng nhập khi vừa mở App (Dùng hàm đồng bộ của Expo 53)
  initAuth: () => {
    const token = SecureStore.getItem("accessToken");
    if (token) {
      set({ accessToken: token, isAuthenticated: true });
    }
  },

  setGuestMode: () => {
    set({ accessToken: null, isAuthenticated: false, isGuest: true });
  },

  // Hàm xử lý khi đăng nhập thành công
  login: async (accessToken, refreshToken) => {
    await SecureStore.setItemAsync("accessToken", accessToken);
    await SecureStore.setItemAsync("refreshToken", refreshToken);
    set({ accessToken, isAuthenticated: true });
  },

  // Hàm logout (Sẽ gọi từ Axios khi token chết hẳn)
  logout: async () => {
    await SecureStore.deleteItemAsync("accessToken");
    await SecureStore.deleteItemAsync("refreshToken");
    set({ accessToken: null, isAuthenticated: false });
  },
}));