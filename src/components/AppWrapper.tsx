import { fonts } from "@/configs/fonts";
import { useAppStore } from "@/stores/appStore";
import { isColorDark } from "@/util/color";
import * as Font from "expo-font";
import { SplashScreen } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useMemo, useState } from "react";
import { StatusBar, View } from "react-native";

export const AppWrapper = ({ children }: { children: React.ReactNode }) => {
  const { theme, settings, isDarkMode } = useAppStore();
  const [isDBReady, setDBReady] = useState(false);
  const [isFontReady, setFontReady] = useState(false);
  SplashScreen.preventAutoHideAsync();

  const barStyle = useMemo(() => {
    if (isColorDark(theme.background)) return "light-content";
    return "dark-content";
  }, [theme]);

  const db = useSQLiteContext();
  const { init, isLoadingData, userProfile } = useAppStore();

  useEffect(() => {
    if (!db) return;

    const load = async () => {
      await init(db);
      setDBReady(true);
    };

    load();
  }, [db]);

  useEffect(() => {
    // wordSocket.connect();
    async function loadFonts() {
      try {
        console.log("loading font...");
        await Font.loadAsync(fonts);
      } catch (err) {
        console.log(err);
      } finally {
        setFontReady(true);
      }
    }

    loadFonts();
  }, []);

  useEffect(() => {
    if (isDBReady && isFontReady) {
      SplashScreen.hideAsync();
    }
  }, [isDBReady, isFontReady]);

  if (!isDBReady || !isFontReady) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor: "transparent" }}>
      {/* View giả lập vùng status bar */}
      <View
        style={{
          // height: Platform.OS === "android" ? StatusBar.currentHeight : 40,
          height: 0,
          backgroundColor: "transparent",
        }}
      />
      <StatusBar
        translucent
        backgroundColor={"transparent"}
        barStyle={isDarkMode ? "light-content" : "dark-content"}
      />
      {children}
    </View>
  );
};
