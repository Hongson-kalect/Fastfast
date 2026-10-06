import { fonts } from "@/configs/fonts";
import { CHART_RANGES } from "@/constants/data";
import { initializeAppState } from "@/stores/appAction";
import { useAppStore } from "@/stores/appStore";
import { initializeDashboard } from "@/stores/dashboardAction";
import useModalStore from "@/stores/modalStore";
import * as Font from "expo-font";
import { SplashScreen } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { StatusBar, View } from "react-native";
import FastEndTimeModal from "./home/FastEndTimeModal";
import { StreakCheckModal } from "./home/StreakModal";
SplashScreen.preventAutoHideAsync();

export const AppWrapper = ({ children }: { children: React.ReactNode }) => {
  const { addModal } = useModalStore();

  const [isDBReady, setDBReady] = useState(false);
  const [isFontReady, setFontReady] = useState(false);

  const isDarkMode = useAppStore(
    (state) => state.settings?.is_dark_mode ?? true,
  );

  const db = useSQLiteContext();

  useEffect(() => {
    if (!db) return;

    const load = async () => {
      const result = await initializeAppState(db);
      setDBReady(true);

      const { streak: streakObj, modal, lastFast } = result;

      if (modal?.type === "finishFast" && lastFast) {
        const targetFinishTime = lastFast.target_duration
          ? lastFast.start_time + lastFast.target_duration * 60 * 1000
          : null;

        addModal({
          closable: modal.closable,
          type: "custom",
          render: (
            <FastEndTimeModal
              startTime={lastFast.start_time}
              targetFinishTime={targetFinishTime}
              currentFast={lastFast}
            />
          ),
        });
      }

      if (!streakObj) return;

      const { streak, habit, retain, shield } = streakObj;

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
  }, [db, addModal]);

  useEffect(() => {
    if (!db) return;

    const load = async () => {
      await initializeDashboard(db, CHART_RANGES[0]);

      // setDBReady(true);
      // Không block app startup
      // initializeDashboard(db, CHART_RANGES[0]);
    };

    load();
  }, [db, addModal]);

  useEffect(() => {
    const loadFonts = async () => {
      try {
        await Font.loadAsync(fonts);
      } catch (err) {
        console.error("Failed to load fonts:", err);
      } finally {
        setFontReady(true);
      }
    };

    loadFonts();
  }, []);

  useEffect(() => {
    if (isDBReady && isFontReady) {
      SplashScreen.hideAsync();
    }
  }, [isDBReady, isFontReady]);

  if (!isDBReady || !isFontReady) {
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor: "transparent" }}>
      <View
        style={{
          height: 0,
          backgroundColor: "transparent",
        }}
      />

      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDarkMode ? "light-content" : "dark-content"}
      />

      {children}
    </View>
  );
};
