import { fonts } from "@/configs/fonts";
import { useAppStore } from "@/stores/appStore";
import {
  Circle,
  Group,
  RoundedRect,
  Text,
  useFont,
} from "@shopify/react-native-skia";
import { useEffect, useMemo } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useDerivedValue } from "react-native-reanimated";
import { CartesianChart, Line, useChartPressState } from "victory-native";

type Props = {
  data: { x: string; y: number }[];
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
  const font3 = useFont(fonts.MulishBold, 18);
  const { theme, settings } = useAppStore();

  // 👇 1. Khởi tạo State để quản lý hành động Press/Hover trên Chart
  const { state, isActive } = useChartPressState({
    x: "0",
    y: { y: 0, target: 0 },
  });

  const [max, min, chartData] = useMemo(() => {
    const arr: { x: string; y: number; target: number }[] = [];
    let max = 0;
    let min = 9999;
    data.map((item) => {
      arr.push({
        x: item.x,
        y: item.y,
        target: Number(settings?.weight_target),
      });
      if (item.y > max) max = item.y;
      if (item.y < min) min = item.y;
    });
    return [max, min, arr];
  }, [data, settings]);

  const labelText = useDerivedValue(() => {
    const val = state.x.value.value;
    return val + " :";
  });
  const toolTipText = useDerivedValue(() => {
    const val = state.y.y.value.value;
    return val != null ? `${Math.round(val * 10) / 10} kg` : "";
  });

  const tooltipX = useDerivedValue(() => state.x.position.value - 10);

  const tooltipY = useDerivedValue(() => state.y.y.position.value - 6);

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <CartesianChart
        data={chartData}
        xKey="x"
        yKeys={["y", "target"]}
        chartPressState={state} // 👇 2. Truyền state vào đây để bắt các cử chỉ press/pan
        axisOptions={{
          font: font,
          labelColor: theme.white,
          lineColor: {
            grid: { y: "#e2e2e2", x: "transparent" },
            frame: "#e2e2e2",
          },
          formatXLabel: (value) => {
            const today =
              (new Date().getMonth() + 1).toString().padStart(2, "0") +
              "/" +
              new Date().getDate().toString().padStart(2, "0");
            const date =
              (new Date(value).getMonth() + 1).toString().padStart(2, "0") +
              "/" +
              new Date(value).getDate().toString().padStart(2, "0");
            if (date === today) return "Now";
            return date;
          },
        }}
        domainPadding={{ top: 35, right: 20, bottom: 0, left: 0 }}
        domain={{
          y: [
            Math.min(
              settings?.weight_target || 9999,
              Math.max(Math.floor((min - (max - min) / 2) / 5) * 5, 0),
            ),
            Math.ceil(max / 10) * 10,
          ],
        }}
      >
        {({ points, chartBounds }) => (
          <>
            <Line
              points={points.y}
              curveType="linear"
              color={theme.primary}
              strokeWidth={3}
              animate={{ type: "timing", duration: 500 }}
            />
            {points.target && (
              <Line
                points={points.target}
                curveType="linear"
                color="#FF4D4Faa"
                strokeWidth={1}
                animate={{ type: "timing", duration: 500 }}
              />
            )}

            {/* 👇 3. Chỉ hiển thị Static Text gốc khi KHÔNG bấm vào Chart */}
            {points.y.map((point, index) => {
              const length = points.y.length - 1;
              const showIndex = Array.from({ length: 4 }, (_, i) =>
                Math.ceil((length / 4) * (i + 1)),
              );
              const uniqueShowIndex = [...new Set(showIndex)].sort(
                (a, b) => a - b,
              );

              if (index === length)
                return (
                  <Text
                    key={index}
                    x={point.x - data[index]?.y.toString().length * 13}
                    y={(point?.y || 0) - 4}
                    text={`${data[index]?.y}`}
                    font={font3}
                    color={isActive ? theme.white + "00" : theme.white}
                  />
                );
              if (Number(data[index]?.y) === 0) return null;
              if (uniqueShowIndex.includes(index))
                return (
                  <Text
                    key={index}
                    x={point.x - data[index]?.y.toString().length * 10}
                    y={(point?.y || 0) - 4}
                    text={`${data[index]?.y}`}
                    font={font2}
                    color={isActive ? theme.white + "00" : theme.white + "cc"}
                  />
                );
            })}

            {/* 👇 4. RENDER TOOLTIP KHI NGƯỜI DÙNG PRESS / HOVER */}
            {/* {isActive && ( */}
            <Group>
              {/* Indicator */}
              <Circle
                cx={state.x.position}
                cy={state.y.y.position}
                r={20}
                color={isActive ? theme.primary + "33" : theme.primary + "00"}
              />

              <Circle
                cx={state.x.position}
                cy={state.y.y.position}
                r={6}
                color={isActive ? theme.primary : theme.primary + "00"}
              />

              {/* Tooltip panel */}
              <RoundedRect
                x={10}
                y={8}
                width={140}
                height={54}
                r={12}
                color={isActive ? "#222222aa" : "#00000000"}
              />

              {/* Label */}
              <Text
                x={22}
                y={25}
                text={labelText}
                font={font}
                color={isActive ? theme.white + "CC" : theme.white + "00"}
              />

              {/* Value */}
              <Text
                x={22}
                y={48}
                text={toolTipText}
                font={font3}
                color={isActive ? theme.white : theme.white + "00"}
              />
            </Group>
            {/* )} */}
          </>
        )}
      </CartesianChart>
    </GestureHandlerRootView>
  );
};

export default WeightLineChart;
