import "@/utils/devPromiseTracking";
import { Stack } from "expo-router";
import "react-native-reanimated";
import "../global.css";

import { Portal, Provider } from "react-native-paper";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AppWrapper } from "@/components/AppWrapper";
import { TouchEffectRoot } from "@/components/effect/TouchEffectRoot";
import { DATABASE_NAME, initDatabase } from "@/database";
import { BottomSheetProvider } from "@/providers/BottomSheet";
import { LanguageProvider } from "@/providers/Language";
import { GlobalModal } from "@/providers/Modal";
import { ThemeProvider } from "@/providers/theme-provider";
import { useAppStore } from "@/stores/appStore";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { SQLiteProvider } from "expo-sqlite";
import { Suspense } from "react";
import { MenuProvider } from "react-native-popup-menu";
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from "react-native-safe-area-context";
import ToastManager from "toastify-react-native";

const queryClient = new QueryClient();

// AppWrapper chỉ render children sau khi store đã hydrate, nên settings đã có ở đây.
// User cũ (đã từng có phiên nhịn) không phải xem onboarding.
const RootStack = () => {
  const onboarded = useAppStore(
    (state) => !!state.settings?.onboarding_done || !!state.currentFastSession,
  );

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={onboarded}>
        <Stack.Screen name="(tabs)" options={{ title: "Home" }} />
      </Stack.Protected>

      <Stack.Protected guard={!onboarded}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
    </Stack>
  );
};

export default function TabLayout() {
  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={initDatabase}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <MenuProvider>
            {/* GestureHandlerRootView kèm lớp hiệu ứng chạm của theme */}
            <TouchEffectRoot>
              <Provider>
                <LanguageProvider>
                  <BottomSheetProvider>
                    <BottomSheetModalProvider>
                      <Suspense>
                        <SafeAreaProvider initialMetrics={initialWindowMetrics}>
                          <AppWrapper>
                            <RootStack />
                          </AppWrapper>
                          <ToastManager useModal={false} />
                        </SafeAreaProvider>
                      </Suspense>
                    </BottomSheetModalProvider>
                  </BottomSheetProvider>
                  <Portal>
                    <GlobalModal />
                  </Portal>
                </LanguageProvider>
              </Provider>
            </TouchEffectRoot>
          </MenuProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SQLiteProvider>
  );
}
