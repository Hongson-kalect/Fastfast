import { FASTING_TARGETS } from "@/constants/data";
import { useDBService } from "@/hooks/useDBService";
import { FastSession } from "@/interfaces/db.type";
import { useBottomSheet } from "@/providers/BottomSheet";
import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useWindowDimensions,
  View
} from "react-native";
import {
  cancelAnimation,
  Easing,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { RADIUS, heroGradient } from "@/constants/design";
import { getCurrentPhase } from "@/utils/home/phase";
import { getTargetFrameColor } from "@/utils/targetColor";
import { LinearGradient } from "expo-linear-gradient";
import { FastDetail } from "../FastDetail";
import { CircleCounterContent } from "./CircleCounterContent";
import { useFastCounter } from "@/hooks/useFastCounter";
import FastHistorySheet from "./FastHistorySheet";
import { FastingCircle } from "./FastingCircle";
import { CardEffect } from "../effect/slots";
import FastingSheet from "./FastingSheet";
import TargetSheet from "./TargetSheet";
import { useShallow } from "zustand/react/shallow";
import { useT } from "@/providers/Language";

type Props = {
  isCounting: boolean;
  currentFast: FastSession | null;
  finishFasting: () => void;
};

// Khoảng cách từ mép card hero tới vòng tròn
const padding = 36;
const MIN_ANGLE = 3;
const strokeWidth = 16;
// Card hero nằm trong lề màn hình 20 mỗi bên
const CARD_INSET = 40;

const TARGET_FRAMES = FASTING_TARGETS.map((item) => ({
  hours: item.hours,
  toHours: item.toHours,
  color: item.colors.accent,
}));

export const CircleCounter = ({
  isCounting,
  currentFast,
  finishFasting,
}: Props) => {
  const counter = useFastCounter();
  const t = useT();
  const { settings, theme } = useAppStore(
    useShallow((state) => ({ settings: state.settings, theme: state.theme })),
  );
  const dbService = useDBService();
  const { present, hide } = useBottomSheet();
  const addModal = useModalStore((state) => state.addModal);
  const [now, setNow] = useState(() => Date.now());
  useFocusEffect(
    useCallback(() => {
      setNow(Date.now());
    }, []),
  );

  const [selectedHistory] = useState<FastSession | null>(
    null,
  );
  const [, setFastHistory] = useState<FastSession[]>([]);

  const target = settings?.target ? Number(settings.target) * 3_600 : undefined;

  const progress = target ? Math.min(Math.max(counter / target, 0.05), 1) : 1;

  const { width: screenWidth } = useWindowDimensions();
  const width = screenWidth - CARD_INSET;

  const centerX = width / 2;
  const centerY = width / 2;
  const radius = centerX - padding;

  const currentTarget = settings?.target
    ? FASTING_TARGETS.find((item) => item.hours === settings.target) || null
    : null;

  const phase = isCounting ? getCurrentPhase(counter) : null;
  // Màu mục tiêu cho tới hết khung của nó, vượt thì theo khung mục tiêu hiện tại
  const color = getTargetFrameColor(
    isCounting ? counter / 3600 : 0,
    settings?.target,
    TARGET_FRAMES,
    theme.primary,
  );

  // 6. Logic Animation xoay với Reanimated
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (!isCounting) {
      cancelAnimation(rotation);
      rotation.value = 0;
      return;
    }

    const angle = Math.min(Math.max(2 * Math.PI, MIN_ANGLE), 2 * Math.PI);
    rotation.value = 0;

    rotation.value = withRepeat(
      withTiming(angle, {
        duration: 6000,
        easing: Easing.linear,
      }),
      -1,
      false,
    );

    return () => {
      cancelAnimation(rotation);
    };
  }, [isCounting]);

  // 7. Ma trận ma sát / xoay Skia (Tự động tracking)

  // 9. Handlers & Modals
  const openTargetSheet = () => {
    present(<TargetSheet currentFast={currentFast} />, {
      isRaw: true,
      snapPoints: ["100%"],
      enableContentPanningGesture: false,
    });
  };

  const changeTarget = () => {
    hide();
    setTimeout(() => {
      openTargetSheet();
    }, 500);
  };

  const finishEstimate = useMemo(() => {
    if (!settings?.target) return null;

    const targetMs = Number(settings.target) * 3_600_000;

    if (isCounting && currentFast?.start_time) {
      return new Date(currentFast.start_time + targetMs);
    }

    return new Date(now + targetMs);
  }, [isCounting, currentFast?.start_time, settings?.target, now]);

  const openFastingSheet = () => {
    if (currentFast)
      present(
        <FastingSheet
          counter={counter}
          fastTarget={currentTarget || null}
          currentFast={currentFast}
          finishDate={finishEstimate}
          onStopFasting={finishFasting}
          onChangeTarget={changeTarget}
        />,
      );
    else openTargetSheet();
  };

  const getHabitLogs = async () => {
    const res = await dbService?.getFastSessions();
    if (res) setFastHistory(res);
  };

  // --- TÍNH TỎA ĐỘ ĐẦU MÚT DỰA TRÊN PROGRESS ---
  // const radius = width / 2 - strokeWidth; // Bán kính đường tròn

  useEffect(() => {
    getHabitLogs();
  }, []);

  const showHistory = () => {
    present(<FastHistorySheet />, {
      isRaw: true,
      snapPoints: ["100%"],
    });
  };

  useEffect(() => {
    if (selectedHistory)
      addModal({
        type: "custom",
        render: <FastDetail fast={selectedHistory} />,
      });
  }, [selectedHistory]);

  return (
    <LinearGradient
      colors={heroGradient(theme)}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={{
        borderRadius: RADIUS.xl,
        borderWidth: 1,
        borderColor: theme.text + "0F",
        overflow: "hidden",
      }}
    >
      {/* Hoa văn nền của effect theme, dưới vòng tròn */}
      <CardEffect />

      <View
        key="skia-counter-render"
        style={{ width: width, height: width }}
        className="justify-center items-center relative"
      >
        {/* CANVAS SKIA RENDER VÒNG TRÒN PROGRESS & EFFECT */}
        <FastingCircle
          width={width}
          centerX={centerX}
          centerY={centerY}
          radius={radius}
          progress={progress}
          isCounting={isCounting}
          color={color}
          backgroundColor={theme.text + "14"}
          strokeWidth={strokeWidth}
        />

        <CircleCounterContent
          isCounting={isCounting}
          counter={counter}
          currentFast={currentFast}
          currentTarget={currentTarget}
          settings={settings}
          theme={theme}
          finishEstimate={finishEstimate}
          openFastingSheet={openFastingSheet}
          openTargetSheet={openTargetSheet}
          showHistory={showHistory}
          phaseTitle={phase ? t(`process.${phase.key}`) : undefined}
          ringColor={color}
          diameter={radius * 2 - strokeWidth}
        />
      </View>
    </LinearGradient>
  );
};

export default CircleCounter;
