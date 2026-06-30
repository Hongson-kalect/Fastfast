import { BarChartSkeleton } from "@/components/skeleton/ChartSkeleton";
import { fonts } from "@/configs/fonts";
import { useAppSettingsStore } from "@/store/useAppSettingStore";
import { LinearGradient, Text, useFont, vec } from "@shopify/react-native-skia";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useWindowDimensions, View } from "react-native";
import Animated, { FadeOut } from "react-native-reanimated";
import { Bar, CartesianChart } from "victory-native";

const DATA = Array.from({ length: 7 }, (_, i) => ({
  x: i + 1,
  y: 20 + Math.floor(Math.random() * 80),
}));

export function FastBarChart() {
  const font = useFont(fonts.MulishRegular, 9);
  const font2 = useFont(fonts.MulishMedium, 14);
  const { theme } = useAppSettingsStore();
  const data = useMemo(() => [...DATA], []);
  const { width, height } = useWindowDimensions();

  const [isReady, setIsReady] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const timeout = setTimeout(() => {
        setIsReady(true);
      }, 200);

      return () => clearTimeout(timeout);
    }, []),
  );

  if (!isReady || !font || !font2) {
    return (
      <Animated.View exiting={FadeOut} style={{ height: 100, width }}>
        <BarChartSkeleton />
      </Animated.View>
    ); // Hiển thị Skeleton ngay lập tức
  }

  return (
    <>
      <CartesianChart
        data={DATA}
        xKey="x"
        yKeys={["y"]}
        // alignment='middle'
        // padding={{ bottom: 0, top: 10, right: 0, left: 0 }}
        axisOptions={{
          /**
           * 👇 Pass the font object to the axisOptions.
           * This will tell CartesianChart to render axis labels.
           */
          font: font,
          labelColor: theme.colors.white,
          lineColor: "#ddd",
          /**
           * 👇 We will also use the formatXLabel prop to format the month number
           * from a number to a month name.
           */
          formatXLabel: (value) => {
            if (value === 0) return "0";
            // const date = new Date(2023, value - 1);
            return "L " + value;
          },
        }}
        domainPadding={{ top: 20, right: 32, bottom: 0, left: 32 }}
        domain={{ y: [0, 100] }}
      >
        {({ points, chartBounds }) => (
          <>
            <View onLayout={() => setIsReady(true)}></View>
            <Bar
              points={points.y}
              chartBounds={chartBounds}
              color={theme.colors.primary}
              roundedCorners={{ topLeft: 4, topRight: 4 }}
              barWidth={32}
            >
              <LinearGradient
                start={vec(0, 0)} // 👈 The start and end are vectors that represent the direction of the gradient.
                end={vec(0, 400)}
                colors={[
                  // 👈 The colors are an array of strings that represent the colors of the gradient.
                  theme.colors.primary,
                  theme.colors.primary + "50", // 👈 The second color is the same as the first but with an alpha value of 50%.
                ]}
              />
            </Bar>

            {points.y.map((point, index) => {
              // if (index === 0 || index === points.y.length - 1) return null;
              return (
                <Text
                  key={index}
                  x={point.x - 8}
                  y={(point?.y || 0) - 6}
                  text={`${data[index]?.y}`} // data có phần tử padding ở đầu
                  font={font2}
                  color={theme.colors.white}
                  // align="center"
                />
              );
            })}
          </>
          //👇 pass a PointsArray to the Bar component, as well as options.
        )}
      </CartesianChart>
    </>
  );
}
