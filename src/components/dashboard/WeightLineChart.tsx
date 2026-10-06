import { fonts } from "@/configs/fonts";
import { useBottomSheet } from "@/provider/BottomSheet";
import { useAppStore } from "@/stores/appStore";
import { Feather } from "@expo/vector-icons";
import {
  Circle,
  DashPathEffect,
  Group,
  LinearGradient,
  RoundedRect,
  Line as SkiaLine,
  Text,
  useFont,
  vec,
} from "@shopify/react-native-skia";
import { useEffect, useMemo } from "react";
import { TouchableOpacity, useWindowDimensions, View } from "react-native";
import { useDerivedValue } from "react-native-reanimated";
import { Bar, CartesianChart, Line, useChartPressState } from "victory-native";
import { ThemedText } from "../themed-text";
import ChartRangeSheet from "./ChartRangeSheet";

type Props = {
  data: { x: string; fast: number; weight: number | null }[];
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
};

const WeightLineChart = ({
  data,
  onInteractionStart,
  onInteractionEnd,
}: Props) => {
  const font = useFont(fonts.MulishRegular, 7);
  const font2 = useFont(fonts.MulishBold, 12);
  const font3 = useFont(fonts.MulishRegular, 11);
  const font4 = useFont(fonts.MulishBold, 15);
  const { theme, settings } = useAppStore();
  const { width } = useWindowDimensions();
  const { present } = useBottomSheet();

  // 👇 1. Khởi tạo State để quản lý hành động Press/Hover trên Chart
  const { state, isActive } = useChartPressState({
    x: "0",
    y: { fast: 0, weight: 0, weightRatio: 0, target: 0 },
  });

  const openTimeRangeSheet = () => {
    present(<ChartRangeSheet />);
  };

  const xPosition = useDerivedValue(() => {
    return state.x.position.value;
  });

  const isDenseData = data.length > 15;
  const activeBarFont = isDenseData ? font : font3;
  const activeLineFont = isDenseData ? font : font2;
  const charWidthOffset = isDenseData ? 3 : 4;

  const weightTarget = settings?.weight_target ?? null;

  const [chartHeight, chartData, rightAxis] = useMemo(() => {
    const arr: {
      x: string;
      fast: number;
      weight: number | null;
      weightRatio: number | null;
      target: number | null;
    }[] = [];

    let maxWeight = weightTarget ?? 0;
    let minWeight = weightTarget ?? 9999;
    let maxFast = 0;

    data.forEach((item) => {
      if (item.fast > maxFast) {
        maxFast = item.fast;
      }

      if (item.weight) {
        if (item.weight > maxWeight) {
          maxWeight = item.weight;
        }

        if (item.weight < minWeight) {
          minWeight = item.weight;
        }
      }
    });

    const weightDelta = maxWeight - minWeight || 1;

    const barChartRatio = 60;
    const gap = 20;
    const lineChartRatio = 100 - barChartRatio - gap;

    const chartHeight = Math.ceil(
      (Math.max(maxFast, 24) * 100) / barChartRatio,
    );

    let targetRatio: number | null = null;

    if (weightTarget) {
      targetRatio =
        Math.floor(
          chartHeight *
            ((barChartRatio + gap) / 100 +
              (((weightTarget - minWeight) / weightDelta) * lineChartRatio) /
                100) *
            100,
        ) / 100;
    }

    data.forEach((item) => {
      let weightRatio: number | null = null;

      if (item.weight) {
        weightRatio =
          Math.floor(
            chartHeight *
              ((barChartRatio + gap) / 100 +
                (((item.weight - minWeight) / weightDelta) * lineChartRatio) /
                  100) *
              100,
          ) / 100;
      }

      arr.push({
        x: item.x,
        fast: item.fast || 0,
        weight: item.weight,
        weightRatio,
        target: targetRatio,
      });
    });

    const axisGap = ((maxWeight - minWeight || 1) / lineChartRatio) * 25;

    const rightAxisData: number[] = [];

    for (let i = 0; i < 6; i++) {
      rightAxisData.push(Math.round((maxWeight + (i - 4) * axisGap) * 10) / 10);
    }

    return [chartHeight, arr, rightAxisData];
  }, [data, weightTarget]);
  const hasWeightData = data.some((item) => item.weight != null);

  const rightAxisReversed = [...rightAxis].reverse();

  useEffect(() => {
    if (isActive) {
      onInteractionStart?.();
    } else {
      onInteractionEnd?.();
    }
  }, [isActive]);

  return (
    <View className="my-4">
      {/* Header */}
      <View className="mb-3 flex-row items-center justify-between">
        <View>
          <ThemedText size="md" weight="bold" color="title">
            Weight & Fast progress
          </ThemedText>

          <ThemedText size="xxs" color="text" opacity="low" className="mt-0.5">
            Your progress over time
          </ThemedText>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={openTimeRangeSheet}
          className="flex-row items-center gap-1.5 rounded-full bg-background2 px-3 py-1.5"
        >
          <ThemedText size="xxs" weight="semibold" color="text">
            {settings?.chart_range || 7} days
          </ThemedText>

          <Feather name="chevron-down" size={13} color={theme.text} />
        </TouchableOpacity>
      </View>

      <View className="rounded-2xl bg-background2 px-2 py-4">
        <View
          style={{
            height: 360,
            paddingRight: 17,
            paddingLeft: 5,
          }}
        >
          {/* Left axis label */}
          <View className="absolute left-0 -top-2 items-end">
            <ThemedText
              size="xxs"
              color="text"
              opacity="medium"
              style={{
                fontFamily: "MulishRegular",
                left: 4,
              }}
            >
              (h)
            </ThemedText>
          </View>

          {/* Right axis */}
          {hasWeightData && (
            <View className="absolute -right-1 bottom-2 -top-2 justify-between">
              {rightAxisReversed.map((item, index) => {
                if (index === 0) {
                  return (
                    <ThemedText
                      key={index}
                      size="xxs"
                      color="text"
                      opacity="medium"
                      style={{
                        fontFamily: "MulishRegular",
                      }}
                    >
                      (kg)
                    </ThemedText>
                  );
                }

                return (
                  <ThemedText
                    key={index}
                    size="tiny"
                    color="text"
                    opacity={[1, 2, 3, 4].includes(index) ? "medium" : "none"}
                    style={{
                      fontFamily: "MulishRegular",
                    }}
                  >
                    {item}
                  </ThemedText>
                );
              })}
            </View>
          )}

          <CartesianChart
            data={chartData}
            xKey="x"
            yKeys={["weight", "target", "fast", "weightRatio"]}
            chartPressState={state}
            axisOptions={{
              font,
              labelColor: theme.text + "88",
              lineColor: theme.text + "44",
            }}
            xAxis={{
              font,
              labelColor: theme.text + "88",
              tickCount: data.length,
            }}
            domainPadding={{
              top: 400 / 6,
              right: 25,
              bottom: 0,
              left: 25,
            }}
            domain={{
              y: [0, chartHeight],
            }}
          >
            {({ points, chartBounds }) => (
              <>
                {/* Fast bars */ console.log("point ", points.target)}
                <Group opacity={isActive ? 0.5 : 0.75}>
                  <Bar
                    points={points.fast}
                    chartBounds={chartBounds}
                    color={theme.primary}
                    roundedCorners={{
                      topLeft: 2,
                      topRight: 2,
                    }}
                    barWidth={(width - 64 - 80) / chartData.length}
                    animate={{
                      type: "timing",
                      duration: 300,
                    }}
                  >
                    <LinearGradient
                      start={vec(0, 220)}
                      end={vec(0, 400)}
                      colors={[theme.primary, theme.primary + "50"]}
                    />
                  </Bar>

                  {!isActive &&
                    points.fast.map((point, index) => {
                      const val = chartData[index]?.fast;

                      if (!val) return null;

                      const textStr = `${val}`;

                      return (
                        <Text
                          key={index}
                          x={point.x - textStr.length * charWidthOffset}
                          y={(point.y ?? 0) - 4}
                          text={textStr}
                          font={activeBarFont}
                          color={theme.text + "DD"}
                        />
                      );
                    })}
                </Group>

                {/* Target line */}
                {points.target[0] && (
                  <Line
                    points={[
                      {
                        ...points.target[0],
                        x: 0,
                      },
                      {
                        ...points.target[0],
                        x: width,
                      },
                    ]}
                    // curveType="cardinal"
                    color={"#FF000080"}
                    strokeWidth={1}
                  >
                    <DashPathEffect intervals={[6, 4]} />
                  </Line>
                )}

                {/* Weight line */}
                <Line
                  opacity={isActive ? 0.5 : 1}
                  points={points.weightRatio}
                  curveType="linear"
                  color={theme.secondary}
                  strokeWidth={2}
                  animate={{
                    type: "timing",
                    duration: 300,
                  }}
                />

                {/* Static weight labels */}
                {!isActive &&
                  points.weightRatio.map((point, index) => {
                    const val = chartData[index]?.weight;
                    const prevVal = chartData[index - 1]?.weight;
                    const nextVal = chartData[index + 1]?.weight;

                    if (!val || (val === prevVal && val === nextVal)) {
                      return null;
                    }

                    if (index === chartData.length - 1) {
                      return (
                        <Group key={`weight-label-${index}`}>
                          <Text
                            x={point.x - `${val}`.length * 3}
                            y={(point.y ?? 0) - 12}
                            text={`${val}`}
                            font={activeLineFont}
                            color={theme.secondary}
                          />

                          <Circle
                            cx={point.x}
                            cy={point.y ?? 0}
                            r={6}
                            color={theme.secondary}
                            opacity={0.3}
                          />

                          <Circle
                            cx={point.x}
                            cy={point.y ?? 0}
                            r={3.5}
                            color={theme.secondary}
                          />
                        </Group>
                      );
                    }

                    return (
                      <Text
                        key={`weight-label-${index}`}
                        x={point.x - `${val}`.length * 3}
                        y={(point.y ?? 0) - 12}
                        text={`${val}`}
                        font={activeLineFont}
                        color={theme.secondary}
                      />
                    );
                  })}

                {/* Interactive tooltip */}
                {isActive && (
                  <ActiveTooltip
                    state={state}
                    chartBounds={chartBounds}
                    length={chartData.length}
                  />
                )}
              </>
            )}
          </CartesianChart>
        </View>
      </View>
      <View className="mt-2 flex-row items-center justify-center gap-4">
        <View className="flex-row items-center gap-1.5">
          <View
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: theme.secondary }}
          />
          <ThemedText size="xxs" color="text" opacity="medium">
            Weight
          </ThemedText>
        </View>

        <View className="flex-row items-center gap-1.5">
          <View
            className="h-2 w-2 rounded-sm"
            style={{ backgroundColor: theme.primary }}
          />
          <ThemedText size="xxs" color="text" opacity="medium">
            Fasting
          </ThemedText>
        </View>

        {hasWeightData && (
          <View className="flex-row items-center gap-1.5">
            <View
              className="w-3"
              style={{
                borderTopWidth: 1,
                borderTopColor: theme.error + "70",
                borderStyle: "dashed",
              }}
            />
            <ThemedText size="xxs" color="text" opacity="medium">
              Target
            </ThemedText>
          </View>
        )}
      </View>
    </View>
  );
};

type TooltipProps = {
  chartBounds: any;
  state: any;
  length: number;
};
const ActiveTooltip = ({ chartBounds, state, length }: TooltipProps) => {
  const { theme } = useAppStore();
  const width = useWindowDimensions().width;
  const p1 = useDerivedValue(() =>
    vec(state.x.position.value, chartBounds.top),
  );

  const p2 = useDerivedValue(() =>
    vec(state.x.position.value, chartBounds.bottom),
  );

  const labelText = useDerivedValue(() => {
    const val = state.x.value.value;
    return val + " :";
  });

  const weightText = useDerivedValue(() => {
    const raw = state.y.weight.value.value;

    if (raw == null) {
      return "No Data";
    }

    const val = Math.round(raw * 10) / 10;
    return val ? `- ${val} Kg` : "- No weight data";
  });

  const fastText = useDerivedValue(() => {
    const raw = state.y.fast.value.value;
    const val = Math.round(raw * 10) / 10;
    return `- ${val} Hours`;
  });

  const barWidth = (width - 64 - 80) / length;

  const font = useFont(fonts.MulishBold, 9);
  const font2 = useFont(fonts.MulishBold, 12);
  const font4 = useFont(fonts.MulishBold, 15);

  // 3. Tùy chọn Opacity cho Bar nếu bạn muốn animation ẩn/hiện mượt mà
  // 1. Tọa độ X trung tâm của cột active
  const rectX = useDerivedValue(() => {
    return state.x.position.value - barWidth / 2;
  });

  // 2. Tọa độ Y đỉnh của cột (Lấy trực tiếp từ state.y.fast.position)
  const rectY = useDerivedValue(() => {
    // Trường hợp giá trị Y không tồn tại hoặc null
    const yPos = state.y.fast.position.value;
    return yPos ?? chartBounds.bottom;
  });

  // 3. Chiều cao của cột = Đáy chart - Tọa độ Y đỉnh
  const rectHeight = useDerivedValue(() => {
    const yPos = state.y.fast.position.value;
    if (yPos === undefined || yPos === null) return 0;
    return Math.max(0, chartBounds.bottom - yPos);
  });

  // 4. Opacity điều khiển ẩn/hiện mượt bằng state.isActive
  const barOpacity = useDerivedValue(() => {
    return state.isActive.value ? 1 : 0;
  });

  return (
    <Group opacity={barOpacity}>
      {/* Crosshair */}
      <SkiaLine p1={p1} p2={p2} color={theme.text + "40"} strokeWidth={1} />

      {/* Weight point */}
      <Circle
        cx={state.x.position}
        cy={state.y.weightRatio.position}
        r={6}
        color={theme.text}
      />

      {/* Selected bar */}
      <RoundedRect
        x={rectX}
        y={rectY}
        width={barWidth}
        height={rectHeight}
        r={4}
        color={theme.primary}
      />

      {/* Tooltip */}
      <RoundedRect
        x={6}
        y={6}
        width={150}
        height={68}
        r={8}
        color={theme.background2 + "F2"}
      />

      <Text
        x={18}
        y={20}
        text={labelText}
        font={font}
        color={theme.text + "99"}
      />

      <Text
        x={18}
        y={40}
        text={weightText}
        font={font2}
        color={theme.secondary}
      />

      <Text x={18} y={58} text={fastText} font={font2} color={theme.primary} />
    </Group>
  );
};

export default WeightLineChart;
