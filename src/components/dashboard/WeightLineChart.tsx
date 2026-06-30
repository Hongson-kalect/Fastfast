import { fonts } from "@/configs/fonts";
import { useAppSettingsStore } from "@/store/useAppSettingStore";
import { Text, useFont } from "@shopify/react-native-skia";
import { useMemo } from "react";
import { CartesianChart, Line } from "victory-native";

const date = new Date("2023-01-01");
const DATA = Array.from({ length: 20 }, (_, i) => ({
  x: date.setDate(date.getDate() + 1),
  y: 40 * i + Math.floor(Math.random() * 8) * 5,
}));
type Props = {
  data: { x: string; y: number }[];
  layout?: {
    width: number;
    height: number;
  };
  target?: number;
};
const WeightLineChart = ({ layout, target = 60, data }: Props) => {
  //Còn handle hover thì sẽ dựa vào daily routine chart để config
  const font = useFont(fonts.MulishRegular, 9);
  const font2 = useFont(fonts.MulishBold, 12);
  const font3 = useFont(fonts.MulishBold, 18);
  const { theme } = useAppSettingsStore();
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

  // const data = useMemo(() => [...DATA], []);
  return (
    <CartesianChart
      data={chartData}
      xKey="x"
      yKeys={["y", "target"]}
      axisOptions={{
        /**
         * 👇 Pass the font object to the axisOptions.
         * This will tell CartesianChart to render axis labels.
         */
        font: font,
        labelColor: theme.colors.white,
        lineColor: {
          grid: {
            y: "#e2e2e2",
            x: "transparent",
          },
          frame: "#e2e2e2",
        },
        // lineWidth:1,

        /**
         * 👇 We will also use the formatXLabel prop to format the month number
         * from a number to a month name.
         */
        formatXLabel: (value) => {
          const today =
            (new Date().getMonth() + 1).toString().padStart(2, "0") +
            "/" +
            new Date().getDate().toString().padStart(2, "0");
          // if (value === 0) return "0";
          const date =
            (new Date(value).getMonth() + 1).toString().padStart(2, "0") +
            "/" +
            new Date(value).getDate().toString().padStart(2, "0");
          if (date === today) return "Now";
          return date;
        },
      }}
      domainPadding={{ top: 37, right: 0, bottom: 0, left: 0 }}
      domain={{
        y: [Math.min(target, Math.floor((min - (max - min) / 2) / 10) * 10)],
      }}
    >
      {({ points, chartBounds }) => (
        <>
          {/* //👇 pass a PointsArray to the Line component, as well as options. */}
          <Line
            points={points.y}
            curveType="linear"
            color={theme.colors.primary}
            strokeWidth={3}
            animate={{ type: "timing", duration: 300 }}
          />
          {/* <Area
            points={points.y}
            curveType="natural"
            color={theme.colors.primary}
            y0={chartBounds.bottom}
            animate={{ type: "timing", duration: 300 }}
          >
            <LinearGradient
              start={vec(0, 0)} // 👈 The start and end are vectors that represent the direction of the gradient.
              end={vec(0, 200)}
              colors={[
                // 👈 The colors are an array of strings that represent the colors of the gradient.
                theme.colors.primary + "dd",
                theme.colors.primary + "11", // 👈 The second color is the same as the first but with an alpha value of 50%.
              ]}
            />
          </Area> */}

          <Line
            points={points.target}
            curveType="linear"
            color="#FF4D4Faa"
            strokeWidth={1}
            animate={{ type: "timing", duration: 300 }}
          />

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
                  text={`${data[index]?.y}`} // data có phần tử padding ở đầu
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
                  text={`${data[index]?.y}`} // data có phần tử padding ở đầu
                  font={font2}
                  color={theme.colors.white + "cc"}
                  // align="center"
                />
              );
          })}
        </>
      )}
    </CartesianChart>
  );
};

export default WeightLineChart;
