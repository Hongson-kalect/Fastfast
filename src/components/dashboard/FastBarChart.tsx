import { BarChartSkeleton } from "@/components/skeleton/ChartSkeleton";
import { fonts } from "@/configs/fonts";
import { useAppStore } from "@/stores/appStore";
import {
  Group,
  LinearGradient,
  RoundedRect,
  Text,
  useFont,
  vec,
} from "@shopify/react-native-skia";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useWindowDimensions } from "react-native";
import Animated, {
  FadeOut,
  useAnimatedReaction,
  useDerivedValue,
} from "react-native-reanimated";
import { runOnJS } from "react-native-worklets";
import { Bar, CartesianChart, useChartPressState } from "victory-native";

type Props = {
  data: { x: string; y: number }[];
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
};

export function FastBarChart({
  data,
  onInteractionStart,
  onInteractionEnd,
}: Props) {
  const font = useFont(fonts.MulishRegular, 8);
  const font2 = useFont(fonts.MulishMedium, 12);
  const font3 = useFont(fonts.MulishBold, 18);
  const { state, isActive } = useChartPressState({
    x: "0",
    y: { y: 0 },
  });
  const { theme } = useAppStore();
  // const data = useMemo(() => [...DATA], []);
  const { width, height } = useWindowDimensions();

  const [isReady, setIsReady] = useState(false);

  const labelText = useDerivedValue(() => {
    const val = state.x.value.value;
    return val + " :";
  });
  const toolTipText = useDerivedValue(() => {
    const val = state.y.y.value.value;
    return val != null ? `${Math.round(val * 10) / 10} Hours` : "";
  });

  // 1. Bridge active index từ UI Thread về JS Thread
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

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

  // 1. Dùng useMemo để tính toán yMax tránh block JS thread mỗi lần render
  const yMax = useMemo(() => {
    if (!data || data.length === 0) return 24;
    const maxVal = Math.max(...data.map((item) => Number(item.y) || 0));
    return Math.max(maxVal, 24);
  }, [data]);

  // 2. Tính toán font & offset căn chỉnh chữ
  const isDenseData = data.length > 15;
  const activeFont = isDenseData ? font : font2;
  const charWidthOffset = isDenseData ? 3 : 4;

  useFocusEffect(
    useCallback(() => {
      const timeout = setTimeout(() => {
        setIsReady(true);
      }, 200);

      return () => clearTimeout(timeout);
    }, []),
  );

  useEffect(() => {
    if (isActive) {
      onInteractionStart?.();
    } else {
      onInteractionEnd?.();
    }
  }, [isActive]);

  if (!isReady || !font || !font2) {
    return (
      <Animated.View exiting={FadeOut} style={{ height: 100, width }}>
        <BarChartSkeleton />
      </Animated.View>
    ); // Hiển thị Skeleton ngay lập tức
  }

  return (
    <CartesianChart
      data={data}
      xKey="x"
      yKeys={["y"]}
      chartPressState={state}
      axisOptions={{
        font: font,
        labelColor: theme.white,
        lineColor: "#ddd",
      }}
      domainPadding={{ top: 35, right: 32, bottom: 0, left: 32 }}
      domain={{ y: [0, yMax] }}
    >
      {({ points, chartBounds }) => (
        <>
          <Group opacity={isActive ? 0.5 : 1}>
            <Bar
              points={points.y} // Truyền từng point riêng rẽ
              chartBounds={chartBounds}
              color={theme.primary}
              roundedCorners={{ topLeft: 4, topRight: 4 }}
              barWidth={(width - 64) / data.length - 4}
              animate={{ type: "timing", duration: 300 }}
            >
              <LinearGradient
                start={vec(0, 0)}
                end={vec(0, 400)}
                colors={[theme.primary, theme.primary + "50"]}
              />
            </Bar>
          </Group>
          {/* Render nhãn giá trị trên đầu mỗi cột (ẩn khi Tooltip active) */}
          {!isActive &&
            points.y.map((point, index) => {
              const val = Number(data[index]?.y);
              if (!val || val === 0) return null;

              const textStr = `${val}`;
              const textX = point.x - textStr.length * charWidthOffset;

              return (
                <Text
                  key={index}
                  x={textX}
                  y={(point.y ?? 0) - 4}
                  text={textStr}
                  font={activeFont}
                  color={theme.white}
                />
              );
            })}

          {/* Tooltip khi Touch/Press vào Chart */}
          {isActive && activeIndex !== null && (
            <Group>
              <RoundedRect
                x={10}
                y={1}
                width={140}
                height={54}
                r={12}
                color="#222222aa"
              />

              <Bar
                points={[points.y[activeIndex]]}
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

              {/* Label Tooltip */}
              <Text
                x={22}
                y={15}
                text={labelText}
                font={font}
                color={theme.white + "CC"}
              />

              {/* Value Tooltip */}
              <Text
                x={22}
                y={40}
                text={toolTipText}
                font={font3}
                color={theme.white}
              />
            </Group>
          )}
        </>
      )}
    </CartesianChart>
  );
}
