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
import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, useWindowDimensions, View } from "react-native";
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
  cancelFasting: () => void;
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
  cancelFasting,
}: Props) => {
  const { settings, theme } = useAppStore();
  const dbService = useDBService();
  const { present, hide } = useBottomSheet();
  const { addModal } = useModalStore();

  const [selectedHistory, setSelectedHistory] = useState<FastSession | null>(
    null,
  );
  const [fastHistory, setFastHistory] = useState<FastSession[]>([]);

  // 1. Tính toán target thời gian (giờ -> ms)
  const target = useMemo<undefined | number>(() => {
    if (!settings?.target) return undefined;
    return Number(settings.target * 3600000);
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
        duration: 7000,
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
    return settings?.target
      ? FASTING_TARGETS.find((item) => item.hours === settings?.target)
      : null;
  }, [settings?.target]);

  const color = useMemo(() => {
    return currentTarget?.colors.accent || theme.primary;
  }, [currentTarget, theme.primary]);

  // 9. Handlers & Modals
  const openTargetSheet = () => {
    present(<TargetSheet currentFast={currentFast} />);
  };

  const changeTarget = () => {
    hide();
    setTimeout(() => {
      openTargetSheet();
    }, 500);
  };

  const openFastingSheet = () => {
    if (currentTarget && currentFast)
      present(
        <FastingSheet
          counter={counter}
          fastTarget={currentTarget}
          currentFast={currentFast}
          onStopFasting={finishFasting}
          onCancelFasting={cancelFasting}
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
                color={isCounting ? "#333333" : "#FFFFFF77"}
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
          {isCounting ? (
            <Pressable
              onPress={openFastingSheet}
              hitSlop={10}
              className="items-center justify-between h-full pt-8 pb-10"
            >
              {/* 1. TẦNG TRÊN: Thời gian bắt đầu & Mục tiêu */}
              <View className="items-center gap-1">
                {currentTarget ? (
                  <Text
                    style={{ color: currentTarget.colors.accent }}
                    className="text-[14px] text-white/50 uppercase font-bold"
                  >
                    Intermittent {settings?.target || 16}h
                  </Text>
                ) : (
                  <View></View>
                )}
                {currentFast?.start_time && (
                  <Text className="text-[11px] text-white/80">
                    Bắt đầu: {getRelativeTime(new Date(currentFast.start_time))}
                    {/* VD: 08:00 */}
                  </Text>
                )}
              </View>

              {/* 2. TẦNG GIỮA: Đồng hồ đếm chính */}
              <View className="my-auto">
                <Counter
                  itemClassName="text-white font-bold text-2xl"
                  counter={counter}
                  type="large"
                />
              </View>

              {/* 3. TẦNG DƯỚI: Dự kiến kết thúc */}
              <View className="items-center gap-1">
                {currentFast?.target_duration && (
                  <View className="bg-white/10 px-2.5 py-0.5 rounded-full">
                    <Text className="text-[12px] text-white/70">
                      Dự kiến:{" "}
                      {getRelativeTime(
                        new Date(
                          currentFast.start_time +
                            currentFast.target_duration * 3_600_000,
                        ),
                      )}
                    </Text>
                  </View>
                )}

                <Pressable onPress={showHistory} hitSlop={8} className="mt-1">
                  <Text className="text-[11px] text-white/40 underline">
                    Lịch sử nhịn
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          ) : (
            <Pressable
              hitSlop={10}
              onPress={openTargetSheet}
              className="justify-center items-center w-full h-full gap-2"
            >
              {settings?.target ? (
                <ThemedText type="title">
                  {settings?.target + ":00:00"}
                </ThemedText>
              ) : (
                <ThemedText type="title">00:00:00</ThemedText>
              )}

              <View
                style={{
                  borderColor: currentTarget?.colors.accent || theme.warning,
                }}
                className="absolute border-b flex-row items-center gap-1 bottom-6"
              >
                <ThemedText
                  style={{
                    color: currentTarget?.colors.accent || theme.warning,
                  }}
                  type="small"
                  className="text-[11px]!"
                >
                  {currentTarget?.label || "Set target"}
                </ThemedText>
              </View>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
};

export default CircleCounter;
