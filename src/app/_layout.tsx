import { Stack } from "expo-router";
import "react-native-reanimated";
import "../global.css";

import { ListModal } from "@/components/modals/OptionModal";
import { Portal, Provider } from "react-native-paper";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AppWrapper } from "@/components/AppWrapper";
import { DATABASE_NAME, initDatabase } from "@/database";
import { BottomSheetProvider } from "@/providers/BottomSheet";
import { LanguageProvider } from "@/providers/Language";
import { GlobalModal } from "@/providers/Modal";
import { ThemeProvider } from "@/providers/theme-provider";
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

export default function TabLayout() {
  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={initDatabase}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <MenuProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <Provider>
                <LanguageProvider>
                  <BottomSheetProvider>
                    <BottomSheetModalProvider>
                      <Suspense>
                        <SafeAreaProvider initialMetrics={initialWindowMetrics}>
                          <AppWrapper>
                            <Stack screenOptions={{ headerShown: false }}>
                              <Stack.Screen
                                name="(tabs)"
                                options={{ title: "Home" }}
                              />
                            </Stack>
                          </AppWrapper>
                          <ToastManager useModal={false} />
                        </SafeAreaProvider>
                      </Suspense>
                    </BottomSheetModalProvider>
                  </BottomSheetProvider>
                  <Portal>
                    <ListModal />
                    <GlobalModal />
                  </Portal>
                </LanguageProvider>
              </Provider>
            </GestureHandlerRootView>
          </MenuProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SQLiteProvider>
  );
}
