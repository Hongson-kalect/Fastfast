import { useColorScheme } from "react-native";

import { Stack } from "expo-router";
import "../global.css";
import { useAppSettingsStore } from "@/store/useAppSettingStore";
import { useEffect } from "react";
import { ThemeProvider } from "@/provider/theme-provider";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  const { initSettings, isHydrated, theme } = useAppSettingsStore();

  useEffect(() => {
    // Bật app lên là quét SecureStore nạp vào Zustand ngay
    initSettings();
  }, []);

  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ title: "Home" }} />
        {/* <Stack.Screen name="_notFound" options={{ title: 'Dashboard' }} /> */}
      </Stack>
    </ThemeProvider>
  );
}
