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
import { SQLiteProvider } from "expo-sqlite";
import { Suspense } from "react";
import { MenuProvider } from "react-native-popup-menu";
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from "react-native-safe-area-context";

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
                    <Suspense>
                      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
                        <AppWrapper>
                          <Stack screenOptions={{ headerShown: false }}>
                            <Stack.Screen
                              name="(tabs)"
                              options={{ title: "Home" }}
                            />
                            {/* <Stack.Screen name="_notFound" options={{ title: 'Dashboard' }} /> */}
                          </Stack>
                        </AppWrapper>
                      </SafeAreaProvider>
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
    </SQLiteProvider>
  );
}
