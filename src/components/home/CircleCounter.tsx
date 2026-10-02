import { FASTING_TARGETS } from "@/constants/data";
import { useDBService } from "@/hooks/useDBService";
import { FastSession } from "@/interfaces/db.type";
import { useBottomSheet } from "@/provider/BottomSheet";
import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import {
  BlurMask,
  Canvas,
  Group,
  Path,
  Rect,
  Skia,
  SkMatrix,
  SweepGradient,
  vec,
} from "@shopify/react-native-skia";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  StyleSheet,
  useWindowDimensions,
  View
} from "react-native";
import {
  cancelAnimation,
  Easing,
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { FastDetail } from "../fast_detail";
import { CircleCounterContent } from "./CircleCounterContent";
import FastHistorySheet from "./FastHistorySheet";
import { FastingCircle } from "./FastingCircle";
import FastingSheet from "./FastingSheet";
import TargetSheet from "./TargetSheet";

type Props = {
  isCounting: boolean;
  counter: number;
  currentFast: FastSession | null;
  finishFasting: () => void;
};

const colorRange = {
  start: Skia.Color("#FF0000"),
  end: Skia.Color("#00FF00"),
};

const padding = 48;
const MIN_ANGLE = 3;
const strokeWidth = 20;
// const padding = 10;
// const MIN_ANGLE = 0.1; // Góc xoay tối thiểu nếu cần
const effect = "None"; // "Christmas" | "None"

const createStarPath = (
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
) => {
  const path = Skia.Path.Make();

  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;

    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;

    if (i === 0) {
      path.moveTo(x, y);
    } else {
      path.lineTo(x, y);
    }
  }

  path.close();

  return path;
};

export const CircleCounter = ({
  isCounting,
  counter,
  currentFast,
  finishFasting,
}: Props) => {
  const { settings, theme } = useAppStore();
  const dbService = useDBService();
  const { present, hide } = useBottomSheet();
  const { addModal } = useModalStore();
  const [now, setNow] = useState(() => Date.now());
  useFocusEffect(
    useCallback(() => {
      setNow(Date.now());
    }, []),
  );

  const [selectedHistory, setSelectedHistory] = useState<FastSession | null>(
    null,
  );
  const [fastHistory, setFastHistory] = useState<FastSession[]>([]);

  const target = settings?.target ? Number(settings.target) * 3_600 : undefined;

  const progress = target ? Math.min(Math.max(counter / target, 0.05), 1) : 1;

  const { width } = useWindowDimensions();

  const centerX = width / 2;
  const centerY = width / 2;
  const radius = centerX - padding;

  const circlePath =
    radius > 0 ? Skia.Path.Circle(centerX, centerY, radius) : null;

  const currentTarget = settings?.target
    ? FASTING_TARGETS.find((item) => item.hours === settings.target) || null
    : null;

  const color = currentTarget?.colors.accent || theme.primary;

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
  const animatedMatrix = useDerivedValue(() => {
    const matrix = Skia.Matrix();
    matrix.translate(centerX, centerY);
    // matrix.rotate(Math.PI + rotation.value);
    matrix.rotate(rotation.value);
    matrix.translate(-centerX, -centerY);
    return matrix;
  });

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
  const angle = progress * 2 * Math.PI - Math.PI / 2; // Góc hiện tại theo Radian (-90deg offset)

  const endPointX = centerX + radius * Math.cos(angle);
  const endPointY = centerY + radius * Math.sin(angle);

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
    <View className="items-center justify-center">
      <View
        key="skia-counter-render"
        style={{ width: width, height: width, marginTop: -padding + 12 }}
        className="justify-center items-center rounded-full relative"
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
          backgroundColor={theme.text + "40"}
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
        />
      </View>
    </View>
  );
};

const StarEffect = ({
  width,
  centerX,
  centerY,
  padding,
  rotation,
  color,
  circlePath,
  progress,
  animatedMatrix,
}) => {
  const starWidth = 16;
  const orbitRadius = width / 2 - padding + starWidth / 4;

  const starX = centerX + orbitRadius;
  const starY = centerY;

  const starPath = useMemo(
    () => createStarPath(starX, starY, starWidth, 6),
    [starX, starY],
  );

  const orbitTransform = useDerivedValue(() => [
    {
      rotate: rotation.value,
    },
  ]);

  const starRotation = useSharedValue(0);

  useFrameCallback((frame) => {
    const delta = frame.timeSincePreviousFrame ?? 0;

    starRotation.value += (Math.PI * 2 * delta) / 3000;
  });

  const selfRotation = useDerivedValue(() => {
    const angle = starRotation.value % (Math.PI * 2);

    return [
      {
        rotate: angle,
      },
    ];
  });

  return (
    <>
      <Path
        path={circlePath}
        style="stroke"
        strokeWidth={strokeWidth + 2}
        strokeCap="round"
        start={0}
        end={progress}
      >
        <SweepGradient
          c={vec(centerX, centerY)}
          matrix={animatedMatrix}
          // colors={[
          //   "#00000000",
          //   "#32ADE630",
          //   "#FF3B30", // Đỏ Giáng Sinh
          //   "#FFD700", // Vàng Ánh Kim
          //   "#FFFFFF", // Tuyết Trắng
          //   "#FFD700",
          //   "#32ADE650",
          //   "#00000000",
          // ]}
          colors={[
            color + "00",
            color + "00",
            color + "22",
            color + "44",
            color + "66", // Tuyết Trắng
            color + "88", // Vàng Ánh Kim
            color + "aa", // Đỏ Giáng Sinh
            color + "dd",
            color + "22",
          ]}
          positions={[0, 0.7, 0.8, 0.85, 0.9, 0.93, 0.96, 0.98, 1]}
        />
        <BlurMask blur={8} style="solid" />
      </Path>
      <Group
        zIndex={1}
        transform={orbitTransform}
        origin={vec(centerX, centerY)}
      >
        <Group transform={selfRotation} origin={vec(starX, starY)}>
          <Path path={starPath} color={color + "60"}>
            <BlurMask blur={8} style="solid" />
          </Path>

          <Path path={starPath} color={color} />
        </Group>
      </Group>
    </>
  );
};

interface BGProps {
  size: number; // Đường kính ruột đồng hồ (width - strokeWidth - padding * 2)
  progress: number; // Tiến độ (0 -> 1)
  animatedMatrix: SkMatrix | any; // Matrix animation xoay 6000ms
}

const opacityHex = {
  0: "FF",
  1: "EE",
  2: "DD",
  3: "CC",
  4: "BB",
  5: "AA",
  6: "99",
  7: "88",
  8: "77",
  9: "66",
  10: "55",
  11: "44",
  12: "33",
  13: "22",
  14: "11",
  15: "00",
  16: "00",
};

export const ChristmasInnerBackground: React.FC<Props> = ({
  size,
  progress,
  animatedMatrix,
}) => {
  const center = size / 2;
  const baseOpacity = Math.min(0.15 + progress * 0.7, 0.85);
  const { theme } = useAppStore();

  const [baseOpacityValue, midOpacityValue, maxOpacity] = useMemo(() => {
    const base = Math.floor(baseOpacity * 16);
    const mid = Math.max(base + 2, 16);
    const max = Math.max(base + 6, 16);
    return [opacityHex[base], opacityHex[mid], opacityHex[max]];
  }, [progress]);

  return (
    <Canvas style={[styles.canvas, { width: size, height: size }]}>
      <Group opacity={baseOpacity}>
        {/* LỚP NỀN XANH LÁ (Hoặc Ảnh trang trí) */}
        <Rect x={0} y={0} width={size} height={size} color="#1E5631" />

        {/* 
          ĐỒNG BỘ HỆ TỌA ĐỘ: 
          Xoay -Math.PI / 2 (-90 deg) quanh tâm để điểm 0 độ trùng với đỉnh 12h 
        */}
        <Group
          transform={[{ rotate: -Math.PI / 2 }]}
          origin={vec(center, center)}
        >
          <Rect x={0} y={0} width={size} height={size}>
            <SweepGradient
              c={vec(center, center)}
              matrix={animatedMatrix}
              colors={[
                theme.background + midOpacityValue,
                theme.background + baseOpacityValue,
                theme.background + baseOpacityValue,
                theme.background + baseOpacityValue,
                theme.background + baseOpacityValue,
                theme.background + midOpacityValue,
                theme.background + maxOpacity, // Đỉnh điểm sáng trùng với ngôi sao
              ]}
              // Căn dải position tập trung vệt sáng khớp nhịp với outer gradient
              positions={[0.03, 0.05, 0.1, 0.9, 0.95, 0.97, 1]}
            />
          </Rect>
        </Group>

        <BlurMask blur={2} style="inner" />
      </Group>
    </Canvas>
  );
};

const styles = StyleSheet.create({
  canvas: {
    position: "absolute",
    borderRadius: 9999,
    overflow: "hidden",
  },
});

export default CircleCounter;
