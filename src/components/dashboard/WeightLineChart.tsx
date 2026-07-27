import { fonts } from "@/configs/fonts";
import { useAppStore } from "@/stores/appStore";
import {
  Circle,
  DashPathEffect,
  Group,
  LinearGradient,
  RoundedRect,
  Text,
  useFont,
  vec,
} from "@shopify/react-native-skia";
import { useEffect, useMemo, useState } from "react";
import { useWindowDimensions, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAnimatedReaction, useDerivedValue } from "react-native-reanimated";
import { runOnJS } from "react-native-worklets";
import { Bar, CartesianChart, Line, useChartPressState } from "victory-native";
import { ThemedText } from "../themed-text";

type Props = {
  data: { x: string; fast: number; weight: number | null }[];
  layout?: {
    width: number;
    height: number;
  };
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
};

const WeightLineChart = ({
  layout,
  data,
  onInteractionStart,
  onInteractionEnd,
}: Props) => {
  const font = useFont(fonts.MulishRegular, 9);
  const font2 = useFont(fonts.MulishBold, 12);
  const font3 = useFont(fonts.MulishRegular, 11);
  const font4 = useFont(fonts.MulishBold, 15);
  const { theme, settings } = useAppStore();
  const { width } = useWindowDimensions();

  // 👇 1. Khởi tạo State để quản lý hành động Press/Hover trên Chart
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const { state, isActive } = useChartPressState({
    x: "0",
    y: { fast: 0, weight: 0, weightRatio: 0, target: 0 },
  });

  const [chartHeight, chartData, rightAxis] = useMemo(() => {
    const arr: {
      x: string;
      fast: number;
      weight: number | null;
      weightRatio: number | null;
      target: number | null;
    }[] = [];
    let max_weight = settings?.weight_target || 0;
    let max_fast = 0;
    let min_weight = settings?.weight_target || 9999;
    let min_fast = 9999;
    // Chuẩn hóa cân nặng: min = 70%, max = 90 % => cần có min và max trước, vd min = 0 max =24
    // max = 36 => min weight =65 -> 70. 65 = 65/70 * 0.9 = gap = 5 => 5 = 20% => = 70%+ gap/5*20
    // slot 5 = Math.ceil(max_weight) = 80%
    // Math.floor(min_weight) = 70%
    // cần tính [0,1,2,3,4,5]
    // cần tính [0,24,48,72,96%,120]?
    // Đường 70 =
    // Max = 100/120
    // Min = 70/120

    data.map((item) => {
      if (item.fast > max_fast) max_fast = item.fast;
      if (item.fast < min_fast) min_fast = item.fast;
      if (item.weight && item.weight > max_weight) max_weight = item.weight;
      if (item.weight && item.weight < min_weight) min_weight = item.weight;

      arr.push({
        x: item.x,
        fast: item.fast,
        weight: item.weight,
        weightRatio: null,
        target: Number(settings?.weight_target),
      });
    });
    const weight_delta = max_weight - min_weight || 1;
    const barChartRatio = 60;
    const gap = 20;
    const lineChartRatio = 100 - barChartRatio - gap;
    const chartHeight = Math.ceil((max_fast * 100) / barChartRatio);
    let targetRatio = null;

    if (settings?.weight_target) {
      targetRatio =
        Math.floor(
          chartHeight *
            ((barChartRatio + gap) / 100 +
              (((settings?.weight_target - min_weight) / weight_delta) *
                lineChartRatio) /
                100) *
            100,
        ) / 100;
    }
    arr.forEach((item) => {
      item.target = targetRatio;
      if (!item.weight) return;

      item.weightRatio =
        Math.floor(
          chartHeight *
            ((barChartRatio + gap) / 100 +
              (((item.weight - min_weight) / weight_delta) * lineChartRatio) /
                100) *
            100,
        ) / 100;
    });

    const rightAxisData: number[] = [];
    const axisGap = ((max_weight - min_weight || 1) / lineChartRatio) * 25;
    for (let i = 0; i < 6; i++) {
      rightAxisData.push(
        Math.round((max_weight + (i - 4) * axisGap) * 10) / 10,
      );
    }

    console.log(
      settings?.weight_target,
      min_weight,
      max_weight,
      min_fast,
      max_fast,
      arr,
    );
    return [chartHeight, arr, rightAxisData];
  }, [data, settings]);

  const labelText = useDerivedValue(() => {
    const val = state.x.value.value;
    return val + " :";
  });
  const toolTipText = useDerivedValue(() => {
    const val = state.y.fast.value.value;
    return val != null ? `${Math.round(val * 10) / 10} kg` : "";
  });

  const isDenseData = data.length > 15;
  const activeFont = isDenseData ? font : font2;
  const charWidthOffset = isDenseData ? 3 : 4;

  useAnimatedReaction(
    () => ({
      isActive: state.isActive.value,
      index: state.matchedIndex.value,
    }),
    (res) => {
      if (res.isActive && res.index !== undefined) {
        runOnJS(setActiveIndex)(res.index);
      } else {
        runOnJS(setActiveIndex)(null);
      }
    },
    [state],
  );

  useEffect(() => {
    if (isActive) {
      onInteractionStart?.();
    } else {
      onInteractionEnd?.();
    }
  }, [isActive]);

  // Nếu bạn muốn làm tròn hoặc format số đẹp hơn:
  //

  return (
    <GestureHandlerRootView style={{ flex: 1, paddingRight: 17 }}>
      <View className="absolute left-0 -top-4 items-end">
        <ThemedText
          style={{
            fontFamily: "MulishRegular",
          }}
          className="text-[9px]! text-white/50!"
        >
          (h)
        </ThemedText>
      </View>
      <View className="absolute -right-1 bottom-0 -top-4 justify-between ">
        {rightAxis.reverse().map((item, index) => {
          if (index === 0)
            return (
              <ThemedText
                style={{
                  fontFamily: "MulishRegular",
                }}
                key={index}
                className="text-[9px]!  text-white/50!"
              >
                (kg)
              </ThemedText>
            );
          return (
            <ThemedText
              style={{
                fontFamily: "MulishRegular",
              }}
              key={index}
              className={`text-[9px]!  ${[1, 2, 3, 4].includes(index) ? "text-white/50!" : "text-transparent!"} `}
            >
              {item}
            </ThemedText>
          );
        })}
        {/* <ThemedText className="text-[9px]!">5</ThemedText>
        <ThemedText className="text-[9px]!">4</ThemedText>
        <ThemedText className="text-[9px]!">3</ThemedText>
        <ThemedText className="text-[9px]!">2</ThemedText>
        <ThemedText className="text-[9px]!">1</ThemedText>
        <ThemedText className="text-[9px]!">0</ThemedText> */}
      </View>
      <CartesianChart
        data={chartData}
        xKey="x"
        yKeys={["weight", "target", "fast", "weightRatio"]} // fast đã normalize
        chartPressState={state}
        axisOptions={{
          font: font,
          labelColor: theme.white + "88",
          lineColor: theme.white + "44",
        }}
        domainPadding={{ top: 400 / 6, right: 40, bottom: 0, left: 25 }}
        domain={{
          y: [0, chartHeight], // Domain cân nhắc sao cho khoảng dưới thoáng cho Bar
        }}
      >
        {({ points, chartBounds }) => {
          const rightAxisTicks = [0, 6, 12, 18, 24];
          const totalHeight = chartBounds.bottom - chartBounds.top;
          return (
            <>
              {/* 1. RENDER BAR (THỜI GIAN NHỊN ĂN) - Lớp nền dưới cùng */}
              <Group opacity={isActive ? 0.5 : 1}>
                <Bar
                  points={points.fast} // Truyền từng point riêng rẽ
                  chartBounds={chartBounds}
                  color={theme.primary}
                  roundedCorners={{ topLeft: 4, topRight: 4 }}
                  barWidth={(width - 64 - 80) / data.length} //80 cho gap
                  animate={{ type: "timing", duration: 300 }}
                >
                  <LinearGradient
                    start={vec(0, 0)}
                    end={vec(0, 600)}
                    colors={[theme.primary, theme.primary + "50"]}
                  />
                </Bar>
                {!isActive &&
                  points.fast.map((point, index) => {
                    const val = Number(data[index]?.fast);
                    if (!val || val === 0) return null;

                    const textStr = `${val}`;
                    const textX = point.x - textStr.length * charWidthOffset;

                    return (
                      <Text
                        key={index}
                        x={textX}
                        y={(point.y ?? 0) - 4}
                        text={textStr}
                        font={font3}
                        color={theme.white + "dd"}
                      />
                    );
                  })}
              </Group>

              {/* 2. RENDER LINE (CÂN NẶNG & TARGET) - Lớp đè phía trên */}
              {/* Đường Target */}
              {points.target && (
                <Line
                  points={points.target}
                  curveType="cardinal"
                  color={theme.error + "80"}
                  strokeWidth={1}
                >
                  {/* intervals={[độ dài nét liền, độ dài khoảng trống]} */}
                  <DashPathEffect intervals={[6, 4]} />
                </Line>
              )}

              {/* Đường Cân Nặng Chính */}
              <Line
                opacity={isActive ? 0.5 : 1}
                points={points.weightRatio}
                curveType="natural" // Dùng natural để đường cân nặng mềm mại hơn
                color={theme.secondary}
                strokeWidth={2}
                animate={{ type: "spring", duration: 500 }}
              />

              {/* 3. STATIC VALUE LABELS (Chỉ hiển thị khi KHÔNG Touch) */}
              {!isActive &&
                points.weightRatio.map((point, index) => {
                  const val = chartData[index]?.weight;
                  const prevVal = chartData[index - 1]?.weight;
                  const nextVal = chartData[index + 1]?.weight;

                  if (!val || (val === prevVal && val === nextVal)) return null;

                  return (
                    <Text
                      key={`weight-label-${index}`}
                      x={point.x - `${val}`.length * 3}
                      y={(point.y ?? 0) - 12}
                      text={`${val}`}
                      font={font2}
                      color={theme.secondary}
                    />
                  );
                })}

              {/* 4. TOOLTIP INTERACTIVE (Khi Press/Pan) */}
              {isActive && state.x.position && (
                <Group>
                  {/* Vạch kẻ dọc chỉ ngày đang chọn (Crosshair Line) */}
                  <Line
                    points={[
                      { x: state.x.position.value, y: chartBounds.top },
                      { x: state.x.position.value, y: chartBounds.bottom },
                    ]}
                    color={theme.white + "40"}
                    strokeWidth={1}
                  />

                  {/* Dot điểm cân nặng */}
                  <Circle
                    cx={state.x.position}
                    cy={state.y.weightRatio.position}
                    r={6}
                    color={theme.white}
                  />

                  {activeIndex !== null && (
                    <Bar
                      points={[points.fast[activeIndex]]}
                      chartBounds={chartBounds}
                      color={theme.primary}
                      roundedCorners={{ topLeft: 4, topRight: 4 }}
                      barWidth={(width - 64) / data.length - 4}
                    >
                      <LinearGradient
                        start={vec(0, 0)}
                        end={vec(0, 400)}
                        colors={[theme.primary, theme.primary + "50"]}
                      />
                    </Bar>
                  )}

                  {/* Panel Tooltip hiển thị đồng thời cả 2 thông số */}
                  <RoundedRect
                    x={10}
                    y={0}
                    width={120}
                    height={56}
                    r={10}
                    color={theme.background + "CC"}
                  />

                  <Text
                    x={24}
                    y={12}
                    text={labelText}
                    font={font}
                    color={theme.white + "CC"}
                  />

                  <Text
                    x={16}
                    y={30}
                    text={`⚖️ Cân: ${state.y.weight.value.value.toFixed(1)} kg`}
                    font={font2}
                    color={theme.secondary}
                  />
                  <Text
                    x={16}
                    y={46}
                    text={`⏱️ Nhịn: ${state.y.fast.value.value} hrs`}
                    font={font2}
                    color={theme.primary}
                  />
                </Group>
              )}
            </>
          );
        }}
      </CartesianChart>
    </GestureHandlerRootView>
  );
};

export default WeightLineChart;
