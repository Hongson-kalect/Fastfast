import { FASTING_TARGETS } from "@/constants/data";
import { useDBService } from "@/hooks/useDBService";
import { FastSession } from "@/interfaces/db.type";
import { useBottomSheet } from "@/provider/BottomSheet";
import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import { getRelativeTime } from "@/util/timer";
import {
  BlurMask,
  Canvas,
  Group,
  Path,
  Skia,
  SweepGradient,
  vec,
} from "@shopify/react-native-skia";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import {
  cancelAnimation,
  Easing,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { FastDetail } from "../fast_detail";
import { ThemedText } from "../themed-text";
import Counter from "./Counter";
import FastHistorySheet from "./FastHistorySheet";
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
const strokeWidth = 16;
// const padding = 10;
// const MIN_ANGLE = 0.1; // Góc xoay tối thiểu nếu cần

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

  // 1. Tính toán target thời gian (giờ -> ms)
  const target = useMemo<undefined | number>(() => {
    if (!settings?.target) return undefined;
    return Number(settings.target * 3_600);
  }, [settings?.target]);

  // 2. Tính toán tỷ lệ tiến trình (0.05 -> 1)
  const progress = useMemo(() => {
    return target ? Math.min(Math.max(counter / target, 0.05), 1) : 1;
  }, [target, counter]);

  const { width, height } = useWindowDimensions();
  // 3. Đo layout dạng hình vuông/tròn (lấy kích thước nhỏ nhất để vẽ vòng tròn nội tiếp)

  // 4. Các thông số hình tròn
  const centerX = width ? width / 2 : 0;
  const centerY = width ? width / 2 : 0;

  // Bán kính hình tròn (trừ đi padding và nửa độ dày nét vẽ để không bị lem viền)
  const radius = useMemo(() => {
    const size = width;
    return centerX - padding;
  }, []);

  // 5. Tạo đường dẫn Path Hình Tròn bằng Skia
  const circlePath = useMemo(() => {
    if (radius <= 0) return null;

    return Skia.Path.Circle(centerX, centerY, radius);
  }, [centerX, centerY, radius]);

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

  // 8. Theme & Colors
  const currentTarget = useMemo(() => {
    console.log("settings?.target", settings?.target, typeof settings?.target);
    return settings?.target
      ? FASTING_TARGETS.find((item) => item.hours === settings?.target)
      : null;
  }, [settings?.target]);

  const color = useMemo(() => {
    return currentTarget?.colors.accent || theme.primary;
  }, [currentTarget, theme.primary]);

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
        <Canvas
          style={{
            width: width,
            height: width,
          }}
        >
          {circlePath && (
            <Group
              transform={[
                {
                  rotate: -Math.PI / 2,
                },
              ]}
              origin={vec(centerX, centerY)}
            >
              {/* 1. Đường viền nền phía sau */}
              <Path
                path={circlePath}
                color={theme.text + "40"}
                style="stroke"
                strokeWidth={strokeWidth}
              />

              {/* 2. Đường tiến độ và vệt sáng Gradient xoay */}
              {isCounting && (
                <>
                  <Path
                    path={circlePath}
                    color={
                      progress === 1
                        ? color + "dd"
                        : color +
                          Math.floor(progress * 100)
                            .toString(16)
                            .padStart(2, "0")
                    }
                    style="stroke"
                    strokeWidth={strokeWidth}
                    strokeCap="round"
                    start={0}
                    end={progress}
                  />

                  {/* 3. Vệt sáng hiệu ứng chạy quanh đường tròn */}
                  <Path
                    path={circlePath}
                    style="stroke"
                    strokeWidth={strokeWidth}
                    strokeCap="round"
                    start={0}
                    end={progress}
                  >
                    <SweepGradient
                      c={vec(centerX, centerY)}
                      matrix={animatedMatrix}
                      colors={[
                        color + "10",
                        color + "30",
                        color + "50",
                        color,
                        "#FFFFFF",
                        color,
                        color + "50",
                        color + "30",
                        color + "10",
                      ]}
                      positions={[
                        0, 0.45, 0.75, 0.86, 0.9, 0.94, 0.97, 0.99, 1,
                      ]}
                    />

                    <BlurMask blur={10} style="solid" />
                  </Path>
                </>
              )}
            </Group>
          )}
        </Canvas>

        {/* RUỘT BÊN TRONG CĂN GIỮA HIỂN THỊ TEXT ĐẾM GIỜ */}
        <View
          className="absolute bg-background rounded-full justify-center items-center"
          style={{
            width: width - strokeWidth - padding * 2,
            height: width - strokeWidth - padding * 2,
          }}
        >
          {isCounting && currentFast ? (
            <Pressable
              onPress={openFastingSheet}
              hitSlop={10}
              className="items-center justify-between h-full pt-8 pb-14"
            >
              {/* 1. TẦNG TRÊN: Thời gian bắt đầu & Mục tiêu */}
              <View className="items-center gap-1">
                {currentTarget ? (
                  <>
                    <TouchableOpacity hitSlop={10} onPress={openTargetSheet}>
                      <ThemedText
                        weight="bold"
                        size="sm"
                        colorHex={currentTarget.colors.accent}
                        className="uppercase underline"
                      >
                        {currentTarget.label} {settings?.target || 16}h
                      </ThemedText>
                      {/* <Text
                        style={{ color: currentTarget.colors.accent }}
                        className="text-[14px] text-white/50 uppercase font-bold underline"
                      >
                        {currentTarget.label} {settings?.target || 16}h
                      </Text> */}
                    </TouchableOpacity>
                    <ThemedText opacity="half" size="xs">
                      Bắt đầu:{" "}
                      {getRelativeTime(new Date(currentFast.start_time))}
                    </ThemedText>
                  </>
                ) : (
                  <TouchableOpacity
                    onPress={openTargetSheet}
                    className="items-center"
                  >
                    <ThemedText
                      weight="bold"
                      size="sm"
                      colorHex={theme.primary}
                      className="uppercase underline"
                    >
                      Choose a target
                    </ThemedText>
                    <ThemedText opacity="half" size="xs">
                      No target had been selected
                    </ThemedText>
                  </TouchableOpacity>
                )}
              </View>

              {/* 2. TẦNG GIỮA: Đồng hồ đếm chính */}
              <View className="my-auto items-center justify-center">
                <Counter
                  itemClassName="text-white font-bold text-2xl"
                  counter={counter}
                  type="large"
                />
                {settings?.target && finishEstimate ? (
                  counter > settings.target * 3_600 ? (
                    <ThemedText size="xxs" color="success">
                      Đã hoàn thành
                    </ThemedText>
                  ) : (
                    <ThemedText size="xxs" color="text" opacity="half">
                      Hoàn thành: {getRelativeTime(finishEstimate)}
                    </ThemedText>
                  )
                ) : (
                  <ThemedText size="xxs" color="text" opacity="half">
                    Free mode
                  </ThemedText>
                )}
              </View>

              {/* 3. TẦNG DƯỚI: Dự kiến kết thúc */}
              <View className="items-center gap-1">
                <Pressable onPress={showHistory} hitSlop={8} className="mt-1">
                  <ThemedText
                    size="xs"
                    color="text"
                    opacity="half"
                    style={{ textDecorationLine: "underline" }}
                  >
                    Fasts history
                  </ThemedText>
                </Pressable>
              </View>
            </Pressable>
          ) : (
            <Pressable
              onPress={openTargetSheet}
              hitSlop={10}
              className="items-center justify-between h-full pt-8 pb-14"
            >
              {/* 1. TẦNG TRÊN: Thời gian bắt đầu & Mục tiêu */}
              <View className="items-center gap-1">
                {currentTarget ? (
                  <>
                    <ThemedText
                      size="sm"
                      weight="bold"
                      colorHex={currentTarget.colors.accent}
                      style={{
                        textTransform: "uppercase",
                        textDecorationLine: "underline",
                      }}
                    >
                      {currentTarget.label} {settings?.target || 16}h
                    </ThemedText>

                    <ThemedText size="xxs" color="text" opacity="medium">
                      {currentTarget.title}
                    </ThemedText>
                  </>
                ) : (
                  <>
                    <ThemedText
                      size="sm"
                      weight="bold"
                      color="primary"
                      style={{
                        textTransform: "uppercase",
                        textDecorationLine: "underline",
                      }}
                    >
                      Choose a target
                    </ThemedText>

                    <ThemedText size="xxs" color="text" opacity="medium">
                      No target had been selected
                    </ThemedText>
                  </>
                )}
              </View>

              {/* 2. TẦNG GIỮA: Đồng hồ đếm chính */}
              <View className="my-auto items-center justify-center">
                <Counter
                  itemClassName="text-white font-bold text-2xl"
                  counter={
                    settings?.target ? Number(settings.target) * 3_600 : 0
                  }
                  type="large"
                />

                {finishEstimate ? (
                  <ThemedText size="xxs" color="text" opacity="half">
                    Dự kiến: {getRelativeTime(finishEstimate)}
                  </ThemedText>
                ) : (
                  <ThemedText size="xxs" color="text" opacity="half">
                    Free mode
                  </ThemedText>
                )}
              </View>

              {/* 3. TẦNG DƯỚI: Lịch sử */}
              <View className="items-center gap-1">
                <Pressable onPress={showHistory} hitSlop={8} className="mt-1">
                  <ThemedText
                    size="xs"
                    color="text"
                    opacity="medium"
                    style={{ textDecorationLine: "underline" }}
                  >
                    Fasts history
                  </ThemedText>
                </Pressable>
              </View>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
};

export default CircleCounter;
