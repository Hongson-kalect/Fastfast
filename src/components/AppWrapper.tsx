import { fonts } from "@/configs/fonts";
import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import { isColorDark } from "@/util/color";
import * as Font from "expo-font";
import { SplashScreen } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useMemo, useState } from "react";
import { StatusBar, View } from "react-native";
import FastEndTimeModal from "./home/FastEndTimeModal";
import { StreakCheckModal } from "./home/StreakModal";

export const AppWrapper = ({ children }: { children: React.ReactNode }) => {
  const { theme, settings, isDarkMode } = useAppStore();
  const { addModal } = useModalStore();
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
      const result = await init(db);
      setDBReady(true);

      const { streak: streakObj, modal, lastFast } = result;

      if (modal) {
        if (modal.type === "finishFast" && lastFast) {
          const targetFinishTime = lastFast?.target_duration
            ? lastFast.start_time + lastFast.target_duration * 60 * 1000
            : null;
          addModal({
            closable: modal.closable,
            type: "custom",
            render: (
              <FastEndTimeModal
                startTime={lastFast?.start_time}
                targetFinishTime={targetFinishTime}
                currentFast={lastFast}
              />
            ),
          });
        }
      }
      if (!streakObj) return;

      const { streak, habit, retain, shield } = streakObj;

      // Login chỉ reconcile trạng thái streak.
      // Không tăng streak ở đây nữa.

      const usedShield = shield.previous > shield.current;
      const lostStreak = streak.previous > streak.current;

      if (!usedShield && !lostStreak) return;

      setTimeout(() => {
        addModal({
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
        });
      }, 1000);
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
