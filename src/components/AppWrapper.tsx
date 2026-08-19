import { fonts } from "@/configs/fonts";
import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import { isColorDark } from "@/util/color";
import * as Font from "expo-font";
import { SplashScreen } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useMemo, useState } from "react";
import { StatusBar, View } from "react-native";
import { Toast } from "toastify-react-native";
import { MILESTONES, StreakCheckModal } from "./home/StreakModal";

export const AppWrapper = ({ children }: { children: React.ReactNode }) => {
  const { theme, settings, isDarkMode } = useAppStore();
  const { setGlobalModal } = useModalStore();
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
      const streakObj = await init(db);
      const testData = {
        streak: {
          previous: 57,
          max: 60,
          current: 61,
        },
        habit: {
          previousPercent: 90,
          currentPercent: 90,
        },
        retain: {
          previous: 0,
          current: 0,
        },
        shield: {
          previous: 3,
          current: 3,
        },
      };
      setDBReady(true);

      console.log("streak", streakObj);
      if (!streakObj) return;

      const { streak, habit, retain, shield } = streakObj;

      // Danh sách các cột mốc quan trọng
      // 1. Check xem lần cập nhật này có vượt qua cột mốc nào trong MILESTONES hay không
      const hitMilestone = MILESTONES.some(
        (m) => streak.previous < m && streak.current >= m,
      );

      // 2. Check có dùng Shield hay không (Shield giảm)
      const usedShield = shield.previous > shield.current;

      // 3. Check có bị gãy Streak hay không (Streak giảm)
      const lostStreak = streak.previous > streak.current;

      // --- ĐIỀU KIỆN MỞ MODAL EVENT-DRIVEN ---
      if (hitMilestone || usedShield || lostStreak) {
        setTimeout(
          () =>
            setGlobalModal({
              type: "custom",
              render: (
                <StreakCheckModal
                  data={{
                    streak: {
                      current: streak.current,
                      max: streak.max,
                      previous: streak.previous,
                    },
                    habit: {
                      currentPercent: habit.currentPercent,
                      previousPercent: habit.previousPercent,
                    },
                    retain: {
                      current: retain.current,
                      previous: retain.previous,
                    },
                    shield: {
                      current: shield.current,
                      previous: shield.previous,
                    },
                  }}
                />
              ),
            }),
          1000,
        );
      } else if (streak.current < 1 && streak.current > streak.previous) {
        Toast.show({
          type: "success",
          text2: "Sreak increased!",
          text1:
            "+" +
            (streak.current - streak.previous) +
            ", Current Streak: " +
            streak.current +
            " 🔥",
          position: "top",
          visibilityTime: 5000,
          autoHide: true,
          onPress: () => console.log("Toast pressed"),
          onShow: () => console.log("Toast shown"),
          onHide: () => console.log("Toast hidden"),
        });
      }

      // Toast.show({
      //   type: "success",
      //   text1: "Main message",
      //   text2: "Secondary message",
      //   position: "bottom",
      //   visibilityTime: 4000,
      //   autoHide: true,
      //   onPress: () => console.log("Toast pressed"),
      //   onShow: () => console.log("Toast shown"),
      //   onHide: () => console.log("Toast hidden"),
      // });
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
    console.log(isDBReady, isFontReady);
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
