import { fonts } from "@/configs/fonts";
import { CHART_RANGES } from "@/constants/data";
import { useDBService } from "@/hooks/useDBService";
import { initializeAppState } from "@/stores/appAction";
import { useAppStore } from "@/stores/appStore";
import { initializeDashboard } from "@/stores/dashboardAction";
import useModalStore from "@/stores/modalStore";
import { runDbTask } from "@/utils/dbError";
import { feedback } from "@/utils/feedback";
import { initializePixel } from "@/stores/pixelAction";
import * as Font from "expo-font";
import { SplashScreen } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { AppState, StatusBar, View } from "react-native";
import FastEndTimeModal from "./home/FastEndTimeModal";
import { StreakCheckModal } from "./home/StreakModal";
import { startWidgetSync } from "@/widgets/widgetState";
import { enforceThemeAccess } from "@/utils/themeAccess";
import { capitalize } from "@/utils/text";
import i18n from "i18next";
SplashScreen.preventAutoHideAsync();

export const AppWrapper = ({ children }: { children: React.ReactNode }) => {
  const addModal = useModalStore((state) => state.addModal);

  const [isDBReady, setDBReady] = useState(false);
  const [isFontReady, setFontReady] = useState(false);

  const isDarkMode = useAppStore(
    (state) => state.settings?.is_dark_mode ?? true,
  );

  const db = useSQLiteContext();
  const dbService = useDBService();

  // Đồng bộ phiên nhịn sang widget màn hình chính (Android)
  useEffect(() => startWidgetSync(), []);

  // Theme limited hết dịp sự kiện: đổi về theme trước / mặc định và báo người dùng.
  // Kiểm tra lúc mở app và mỗi lần app quay lại foreground (dịp có thể hết khi app đang mở)
  useEffect(() => {
    if (!db || !isDBReady) return;

    const check = () =>
      runDbTask("theme access", async () => {
        const changed = await enforceThemeAccess(db);
        if (!changed) return;
        addModal({
          type: "alert",
          title: i18n.t("theme.eventEndedTitle"),
          message: i18n.t("theme.eventEndedBody", {
            theme: capitalize(changed.from),
            fallback: capitalize(changed.to),
          }),
        });
      });

    check();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") check();
    });
    return () => subscription.remove();
  }, [db, isDBReady, addModal]);

  useEffect(() => {
    if (!db) return;

    const load = async () => {
      const result = await initializeAppState(db);
      setDBReady(true);

      const { streak: streakObj, modal, lastFast } = result;

      if (modal?.type === "finishFast" && lastFast) {
        const targetFinishTime = lastFast.target_duration
          ? lastFast.start_time + lastFast.target_duration * 3600 * 1000
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
        feedback(lostStreak ? "streakLost" : "fastFailed");
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

    runDbTask("app startup", load);
  }, [db, addModal]);

  useEffect(() => {
    if (!db || !isDBReady) return;
    // load app xong thì mới load mấy thằng này

    const load = async () => {
      await initializeDashboard(dbService, CHART_RANGES[0]);
      await initializePixel(dbService, new Date().getFullYear());

      // Không block app startup
    };

    runDbTask("dashboard/pixel startup", load);
  }, [db, isDBReady]);

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
