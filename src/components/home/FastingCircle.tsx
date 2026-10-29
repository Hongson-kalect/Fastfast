import {
  BlurMask,
  Canvas,
  Group,
  Path,
  Skia,
  SweepGradient,
  vec,
} from "@shopify/react-native-skia";
import { useEffect } from "react";
import {
  cancelAnimation,
  Easing,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

type Props = {
  width: number;
  centerX: number;
  centerY: number;
  radius: number;
  progress: number;
  isCounting: boolean;
  color: string;
  backgroundColor: string;
  strokeWidth: number;
};

export const FastingCircle = ({
  width,
  centerX,
  centerY,
  radius,
  progress,
  isCounting,
  color,
  backgroundColor,
  strokeWidth,
}: Props) => {
  const rotation = useSharedValue(0);
  const circlePath =
    radius > 0 ? Skia.Path.Circle(centerX, centerY, radius) : null;

  useEffect(() => {
    if (!isCounting) {
      cancelAnimation(rotation);
      rotation.value = 0;
      return;
    }

    rotation.value = withRepeat(
      withTiming(2 * Math.PI, {
        duration: 6000,
        easing: Easing.linear,
      }),
      -1,
      false,
    );

    return () => {
      cancelAnimation(rotation);
    };
  }, [isCounting, rotation]);

  const animatedMatrix = useDerivedValue(() => {
    const matrix = Skia.Matrix();

    matrix.translate(centerX, centerY);
    matrix.rotate(rotation.value);
    matrix.translate(-centerX, -centerY);

    return matrix;
  });

  return (
    <Canvas style={{ width, height: width }}>
      {circlePath && (
        <Group
          transform={[{ rotate: -Math.PI / 2 }]}
          origin={vec(centerX, centerY)}
        >
          <Path
            path={circlePath}
            color={backgroundColor}
            style="stroke"
            strokeWidth={strokeWidth}
          />

          {isCounting && (
            <>
              <Path
                path={circlePath}
                // Độ đậm tăng theo tiến trình nhưng luôn đủ thấy (~25% → ~87%)
                color={
                  color +
                  Math.round(0x40 + progress * (0xdd - 0x40))
                    .toString(16)
                    .padStart(2, "0")
                }
                style="stroke"
                strokeWidth={strokeWidth}
                strokeCap="round"
                start={0}
                end={progress}
              />

              <Path
                path={circlePath}
                style="stroke"
                strokeWidth={strokeWidth}
                strokeCap="round"
                start={0}
                end={progress}
              >
                {/* Vệt sáng quay: cùng tông màu, đuôi dài và mềm, chỉ ánh trắng nhẹ ở đỉnh */}
                <SweepGradient
                  c={vec(centerX, centerY)}
                  matrix={animatedMatrix}
                  colors={[
                    color + "00",
                    color + "00",
                    color + "40",
                    color + "AA",
                    "#FFFFFF99",
                    color + "AA",
                    color + "00",
                  ]}
                  positions={[0, 0.55, 0.75, 0.86, 0.9, 0.94, 1]}
                />
                <BlurMask blur={8} style="solid" />
              </Path>
            </>
          )}
        </Group>
      )}
    </Canvas>
  );
};
