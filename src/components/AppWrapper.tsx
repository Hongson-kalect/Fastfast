import { fonts } from "@/configs/fonts";
import { useAppStore } from "@/stores/appStore";
import { isColorDark } from "@/util/color";
import * as Font from "expo-font";
import { SplashScreen } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useMemo, useState } from "react";
import { StatusBar, View } from "react-native";

export const AppWrapper = ({ children }: { children: React.ReactNode }) => {
  const { theme, settings, dbService, isDarkMode } = useAppStore();

  const barStyle = useMemo(() => {
    if (isColorDark(theme.background)) return "light-content";
    return "dark-content";
  }, [theme]);

  const db = useSQLiteContext();
  const { init, isLoadingData, userProfile } = useAppStore();

  useEffect(() => {
    if (db) {
      const success = init(db);
      // if (!success) {
      //   router.replace("/screens/Start/screen");
      // }
    }
  }, [db]);

  const [isReady, setIsReady] = useState(false);

  SplashScreen.preventAutoHideAsync();

  useEffect(() => {
    // wordSocket.connect();
    async function loadFonts() {
      try {
        console.log("loading font...");
        await Font.loadAsync(fonts);
        // setFontsLoaded(true);
        // const hasStarted = await AsyncStorage.getItem("hasSeenStartPage");
        // setHasSeenStart(hasStarted === "true");
        // console.log(hasStarted);
        // if (hasStarted === "true") router.replace("/screens/Start/screen");
      } catch (err) {
        console.log(err);
      } finally {
        setIsReady(true);
      }
    }

    loadFonts();
  }, []);

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync();
    }
  }, [isReady]);

  if (!isReady) {
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
