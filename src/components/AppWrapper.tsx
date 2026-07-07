import { useAppStore } from "@/stores/appStore";
import { isColorDark } from "@/util/color";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useMemo } from "react";
import { StatusBar, View } from "react-native";

export const AppWrapper = ({ children }: { children: React.ReactNode }) => {
  const { theme, settings, dbService, isDarkMode } = useAppStore();

  const barStyle = useMemo(() => {
    if (isColorDark(theme.background)) return "light-content";
    return "dark-content";
  }, [theme]);

  const db = useSQLiteContext();
  const { bootstrapAppData, isLoadingData, userProfile } = useAppStore();

  useEffect(() => {
    if (db) {
      const success = bootstrapAppData(db);
      // if (!success) {
      //   router.replace("/screens/Start/screen");
      // }
    }
  }, [db]);

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
