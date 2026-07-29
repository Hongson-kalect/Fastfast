import { fonts } from "@/configs/fonts";
import { useDBService } from "@/hooks/useDBService";
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
import { useEffect, useMemo, useState } from "react";
import { TouchableOpacity, useWindowDimensions, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAnimatedReaction, useDerivedValue } from "react-native-reanimated";
import { runOnJS } from "react-native-worklets";
import { Bar, CartesianChart, Line, useChartPressState } from "victory-native";
import { ThemedText } from "../themed-text";
import ChartRangeSheet from "./ChartRangeSheet";

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
  const font = useFont(fonts.MulishRegular, 7);
  const font2 = useFont(fonts.MulishBold, 12);
  const font3 = useFont(fonts.MulishRegular, 11);
  const font4 = useFont(fonts.MulishBold, 15);
  const { theme, settings, updateWeight } = useAppStore();
  const { width } = useWindowDimensions();
  const dbService = useDBService();
  const { present } = useBottomSheet();

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
    data.map((item) => {
      if (item.fast > max_fast) max_fast = item.fast;
      if (item.fast < min_fast) min_fast = item.fast;
      if (item.weight && item.weight > max_weight) max_weight = item.weight;
      if (item.weight && item.weight < min_weight) min_weight = item.weight;

      arr.push({
        x: item.x,
        fast: item.fast || 0,
        weight: item.weight,
        weightRatio: 0,
        target: Number(settings?.weight_target),
      });
    });
    const weight_delta = max_weight - min_weight || 1;
    const barChartRatio = 60;
    const gap = 20;
    const lineChartRatio = 100 - barChartRatio - gap;
    const chartHeight = Math.ceil(
      (Math.max(max_fast, 24) * 100) / barChartRatio,
    );
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
      if (!item.weight) return (item.weightRatio = null);

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
      const val = min_weight + (i - 4) * axisGap;
      console.log(val);
      rightAxisData.push(
        Math.round((max_weight + (i - 4) * axisGap) * 10) / 10,
      );
    }

    return [chartHeight, arr, rightAxisData];
  }, [data, settings]);

  const openTimeRangeSheet = () => {
    present({
      title: "Time range",
      size: "long",
      render: () => <ChartRangeSheet />,
    });
  };

  const xPosition = useDerivedValue(() => {
    return state.x.position.value;
  });

  const isDenseData = data.length > 15;
  const activeBarFont = isDenseData ? font : font3;
  const activeLineFont = isDenseData ? font : font2;
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

  return (
    <View className="my-4">
      <View className="flex-row justify-between items-center mb-3">
        <View className="items-center justify-center gap-2">
          <ThemedText className="font-bold! text-base!">
            Weight & Fast progress
          </ThemedText>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={openTimeRangeSheet}
          className="flex-row items-center justify-center gap-2"
        >
          <View
            style={{ borderColor: theme.text + "aa" }}
            className="flex-row items-center px-2 h-8 border rounded-lg gap-1"
          >
            <ThemedText className="text-sm!">
              Last {settings?.chart_range || 7} days
            </ThemedText>

            <Feather name="chevron-down" size={14} color={theme.text} />
          </View>
        </TouchableOpacity>
      </View>

      <View
        style={{ height: 400 }}
        className="bg-[#1A1C24] py-4 px-2 border border-dashed border-gray-700 rounded-lg"
      >
        <GestureHandlerRootView
          style={{ flex: 1, paddingRight: 17, paddingLeft: 5 }}
        >
          <View className="absolute left-0 -top-4 items-end">
            <ThemedText
              style={{
                fontFamily: "MulishRegular",
              }}
              className="text-[9px]! left-1 text-white/50!"
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
                  className={`text-[7px]! text-white/50! ${![1, 2, 3, 4].includes(index) && "opacity-0!"} `}
                >
                  {item}
                </ThemedText>
              );
            })}
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
            domainPadding={{ top: 400 / 6, right: 25, bottom: 0, left: 25 }}
            domain={{
              y: [0, chartHeight], // Domain cân nhắc sao cho khoảng dưới thoáng cho Bar
            }}
          >
            {({ points, chartBounds }) => {
              return (
                <>
                  {/* 1. RENDER BAR (THỜI GIAN NHỊN ĂN) - Lớp nền dưới cùng */}
                  <Group opacity={isActive ? 0.5 : 1}>
                    <Bar
                      points={points.fast} // Truyền từng point riêng rẽ
                      chartBounds={chartBounds}
                      color={theme.primary}
                      roundedCorners={{ topLeft: 2, topRight: 2 }}
                      barWidth={(width - 64 - 80) / data.length} //80 cho gap
                      animate={{ type: "timing", duration: 300 }}
                    >
                      <LinearGradient
                        start={vec(0, 220)}
                        end={vec(0, 400)}
                        colors={[theme.primary, theme.primary + "50"]}
                      />
                    </Bar>
                    {!isActive &&
                      points.fast.map((point, index) => {
                        const val = Number(data[index]?.fast);
                        if (!val || val === 0) return null;

                        const textStr = `${val}`;
                        const textX =
                          point.x - textStr.length * charWidthOffset;

                        return (
                          <Text
                            key={index}
                            x={textX}
                            y={(point.y ?? 0) - 4}
                            text={textStr}
                            font={activeBarFont}
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
                      <DashPathEffect intervals={[6, 4]} />
                    </Line>
                  )}

                  {/* Đường Cân Nặng Chính */}
                  <Line
                    opacity={isActive ? 0.5 : 1}
                    points={points.weightRatio}
                    curveType="linear" // Dùng natural để đường cân nặng mềm mại hơn
                    color={theme.secondary}
                    strokeWidth={2}
                    animate={{ type: "timing", duration: 300 }}
                  />

                  {/* 3. STATIC VALUE LABELS (Chỉ hiển thị khi KHÔNG Touch) */}
                  {!isActive &&
                    points.weightRatio.map((point, index) => {
                      const val = chartData[index]?.weight;
                      const prevVal = chartData[index - 1]?.weight;
                      const nextVal = chartData[index + 1]?.weight;

                      if (!val || (val === prevVal && val === nextVal))
                        return null;

                      if (index === chartData.length - 1) {
                        return (
                          <Group key={`weight-label-${index}`}>
                            <Text
                              key={`weight-label-${index}`}
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
                            {/* Nút tròn chính bên trong (Inner Solid Circle) */}
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

                  {/* 4. TOOLTIP INTERACTIVE (Khi Press/Pan) */}
                  {isActive && state.x.position && (
                    <ActiveTooltip
                      state={state}
                      chartBounds={chartBounds}
                      length={data.length}
                    />
                  )}
                </>
              );
            }}
          </CartesianChart>
        </GestureHandlerRootView>
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
    const val = Math.round(state.y.weight.value.value * 10) / 10;
    return val ? `- ${Math.round(val * 10) / 10} Kg` : "No Data";
  });
  const fastText = useDerivedValue(() => {
    const val = Math.round(state.y.fast.value.value * 10) / 10;
    return val != null ? `- ${Math.round(val * 10) / 10} Hours` : "No Data";
  });

  const [barWidth] = useState((width - 64 - 80) / length);

  const font = useFont(fonts.MulishRegular, 8);
  const font2 = useFont(fonts.MulishBold, 12);
  const font3 = useFont(fonts.MulishRegular, 11);
  const font4 = useFont(fonts.MulishBold, 15);
  const activeFont = length > 15 ? font : font2;

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
      {/* Vạch kẻ dọc chỉ ngày đang chọn (Crosshair Line) */}
      <SkiaLine p1={p1} p2={p2} color={theme.white + "40"} strokeWidth={1} />

      {/* Dot điểm cân nặng */}
      <Circle
        cx={state.x.position}
        cy={state.y.weightRatio.position}
        r={6}
        color={theme.white}
      />
      <RoundedRect
        x={rectX}
        y={rectY}
        width={barWidth}
        height={rectHeight}
        r={4}
        color={theme.primary}
      />

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
        x={20}
        y={20}
        text={labelText}
        font={font2}
        color={theme.white + "CC"}
      />

      <Text
        x={24}
        y={40}
        text={weightText}
        font={font4}
        color={theme.secondary}
      />
      <Text x={24} y={60} text={fastText} font={font4} color={theme.primary} />
    </Group>
  );
};

export default WeightLineChart;
