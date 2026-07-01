import { fonts } from "@/configs/fonts";
import { useAppSettingsStore } from "@/store/useAppSettingStore";
import { Circle, Group, Text, useFont } from "@shopify/react-native-skia";
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
  target?: number;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
};

const WeightLineChart = ({
  layout,
  target = 60,
  data,
  onInteractionStart,
  onInteractionEnd,
}: Props) => {
  const font = useFont(fonts.MulishRegular, 9);
  const font2 = useFont(fonts.MulishBold, 12);
  const font3 = useFont(fonts.MulishBold, 18);
  const { theme } = useAppSettingsStore();

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
      arr.push({ x: item.x, y: item.y, target });
      if (item.y > max) max = item.y;
      if (item.y < min) min = item.y;
    });
    return [max, min, arr];
  }, [data, target]);

  const toolTipText = useDerivedValue(() => {
    // state.y.y.value bản chất đã là một SharedValue chứa số (hoặc string)
    const val = state.y.y.value.value;
    return val ? `${val.toFixed(1)} kg` : "";
  });

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
          labelColor: theme.colors.white,
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
        domainPadding={{ top: 37, right: 20, bottom: 0, left: 20 }}
        domain={{
          y: [Math.min(target, Math.floor((min - (max - min) / 2) / 5) * 5)],
        }}
      >
        {({ points, chartBounds }) => (
          <>
            <Line
              points={points.y}
              curveType="linear"
              color={theme.colors.primary}
              strokeWidth={3}
              animate={{ type: "timing", duration: 300 }}
            />

            <Line
              points={points.target}
              curveType="linear"
              color="#FF4D4Faa"
              strokeWidth={1}
              animate={{ type: "timing", duration: 300 }}
            />

            {/* 👇 3. Chỉ hiển thị Static Text gốc khi KHÔNG bấm vào Chart */}
            {!isActive &&
              points.y.map((point, index) => {
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
                      color={theme.colors.white}
                    />
                  );
                if (uniqueShowIndex.includes(index))
                  return (
                    <Text
                      key={index}
                      x={point.x - data[index]?.y.toString().length * 10}
                      y={(point?.y || 0) - 4}
                      text={`${data[index]?.y}`}
                      font={font2}
                      color={theme.colors.white + "cc"}
                    />
                  );
              })}

            {/* 👇 4. RENDER TOOLTIP KHI NGƯỜI DÙNG PRESS / HOVER */}
            {isActive && (
              <Group>
                {/* Dấu chấm tròn (Indicator Node) tại điểm đang được chọn */}
                <Circle
                  cx={state.x.position}
                  cy={state.y.y.position}
                  r={6}
                  color={theme.colors.primary}
                />
                <Circle
                  cx={state.x.position}
                  cy={state.y.y.position}
                  r={20}
                  color={theme.colors.primary + "33"} // Tạo hiệu ứng mờ bao quanh
                />

                {/* Hiển thị giá trị dạng Text nhảy động theo ngón tay/chuột */}
                <Text
                  x={state.x.position}
                  y={state.y.y.position} // Hoặc dùng state.y.y.position.value - 15 nếu muốn dịch chuyển
                  text={toolTipText}
                  font={font3}
                  color={theme.colors.white}
                />
              </Group>
            )}
          </>
        )}
      </CartesianChart>
    </GestureHandlerRootView>
  );
};

export default WeightLineChart;
