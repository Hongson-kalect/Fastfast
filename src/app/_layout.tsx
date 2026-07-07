import { useColorScheme } from "react-native";

import { Stack } from "expo-router";
import "react-native-reanimated";
import "../global.css";

import { ListModal } from "@/components/modals/OptionModal";
import { Portal, Provider } from "react-native-paper";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AppWrapper } from "@/components/AppWrapper";
import { DATABASE_NAME, initDatabase } from "@/database";
import { BottomSheetProvider } from "@/provider/BottomSheet";
import { LanguageProvider } from "@/provider/Language";
import { GlobalModal } from "@/provider/Modal";
import { ThemeProvider } from "@/provider/theme-provider";
import { useAppStore } from "@/stores/appStore";
import { SQLiteProvider, useSQLiteContext } from "expo-sqlite";
import { Suspense, useEffect } from "react";
import { MenuProvider } from "react-native-popup-menu";

const queryClient = new QueryClient();

export default function TabLayout() {
  const colorScheme = useColorScheme();

  const { init, isHydrated, theme } = useAppStore();

  useEffect(() => {
    // Bật app lên là quét SecureStore nạp vào Zustand ngay
    const db = useSQLiteContext();
    init(db);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <MenuProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <Provider>
              <LanguageProvider>
                <BottomSheetProvider>
                  <Suspense>
                    <SQLiteProvider
                      databaseName={DATABASE_NAME}
                      onInit={initDatabase}
                    >
                      <AppWrapper>
                        <Stack screenOptions={{ headerShown: false }}>
                          <Stack.Screen
                            name="(tabs)"
                            options={{ title: "Home" }}
                          />
                          {/* <Stack.Screen name="_notFound" options={{ title: 'Dashboard' }} /> */}
                        </Stack>
                      </AppWrapper>
                    </SQLiteProvider>
                  </Suspense>
                </BottomSheetProvider>
                <Portal>
                  <ListModal />
                  <GlobalModal />
                </Portal>
                {/* <StatusBar style="auto" /> */}
              </LanguageProvider>
            </Provider>
          </GestureHandlerRootView>
        </MenuProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
