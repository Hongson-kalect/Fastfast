import { useAppSettingsStore } from "@/store/useAppSettingStore";
import {
  BlurMask,
  Canvas,
  interpolateColors,
  Path,
  Skia,
  SweepGradient,
  vec,
} from "@shopify/react-native-skia";
import { useEffect, useMemo, useState } from "react";
import { LayoutChangeEvent, View } from "react-native";
import {
  cancelAnimation,
  Easing,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { ThemedText } from "../themed-text";
import Counter from "./Counter";

type Props = {
  counter: number;
  targetHours?: number;
};

const colorRange = {
  start: Skia.Color("#FF0000"),
  end: Skia.Color("#00FF00"),
};

const padding = 12;
const HomeTimeCounter = ({ counter, targetHours = 24 }: Props) => {
  const [layout, setLayout] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const detectCounterLayout = (e: LayoutChangeEvent) => {
    if (layout) return;
    const { width, height } = e.nativeEvent.layout;
    setLayout({ width: width + 10, height: height + 42 });
  };
  const { theme } = useAppSettingsStore();
  const targetSeconds = targetHours * 3600 * 1000;
  const progress = Math.min(counter / targetSeconds, 1);
  const progressColor = useMemo(() => {
    return interpolateColors(
      progress,
      [0, 1], // Input range: tiến trình từ 0% đến 100%
      [colorRange.start, colorRange.end], // Output range: màu tương ứng
    );
  }, [progress, colorRange.start, colorRange.end]);

  const strokeWidth = 20;

  const capsulePath = useMemo(() => {
    if (!layout) return null;

    const rect = Skia.XYWHRect(
      padding + strokeWidth / 2,
      padding + strokeWidth / 2 + 4,
      layout.width - strokeWidth,
      layout.height - strokeWidth,
    );

    const rRect = Skia.RRectXY(rect, layout.height / 2, layout.height / 2);

    return Skia.Path.RRect(rRect);
  }, [layout, strokeWidth]);

  const centerX = layout?.width ? layout.width / 2 : 0;
  const centerY = layout?.height ? layout.height / 2 : 0;

  // 1. Khởi tạo giá trị xoay
  const rotation = useSharedValue(0);

  // 2. Xử lý triệt để bài toán Cleanup khi Unmount / Hot Reload
  useEffect(() => {
    rotation.value = 0; // Reset về 0 trước khi chạy
    rotation.value = withRepeat(
      withTiming(2 * Math.PI, { duration: 7000, easing: Easing.linear }),
      -1,
      false,
    );

    // HÀM CLEANUP QUAN TRỌNG: Dừng ngay lập tức animation cũ khi hot-reload hoặc huỷ màn hình
    return () => {
      cancelAnimation(rotation);
    };
  }, [layout]); // Trigger lại nếu layout thay đổi để tính ma trận chuẩn xác nhất

  // 3. Loại bỏ mảng dependency thủ công để Skia tự động tracking luồng native mượt 100%
  const animatedMatrix = useDerivedValue(() => {
    const matrix = Skia.Matrix();
    matrix.translate(centerX, centerY);
    matrix.rotate(Math.PI + rotation.value);
    matrix.translate(-centerX, -centerY);
    return matrix;
  }); // KHÔNG truyền mảng [rotation] ở đây nữa!

  return (
    <View className="items-center justify-center">
      {!layout ? (
        <View
          key="measuring-layout"
          onLayout={detectCounterLayout}
          className="py-6 px-10 opacity-0 absolute"
        >
          <Counter itemClassName="text-white!" counter={counter} type="large" />
        </View>
      ) : (
        <View
          key="skia-counter-render"
          style={{ width: layout.width, height: layout.height }}
          className="justify-start items-start rounded-full"
        >
          {/* CANVAS SKIA DÙNG PATH CHUẨN ĐỂ SỬ DỤNG START/END */}
          <Canvas
            className=" "
            style={{
              borderWidth: 1,
              borderColor: "white",
              paddingTop: 20,
              top: -padding,
              left: -padding,
              width: layout.width + padding * 2,
              height: layout.height + padding * 2 + 4,
            }}
          >
            {capsulePath && (
              <>
                {/* 1. Đường viền nền tối phía sau */}
                <Path
                  path={capsulePath}
                  color={"#333"}
                  style="stroke"
                  strokeWidth={strokeWidth}
                />
                {/* 2. Đường tiến độ hiện tại */}
                <Path
                  path={capsulePath}
                  color={
                    progress === 1
                      ? theme.colors.primary + "dd"
                      : theme.colors.primary + Math.floor(progress * 100)
                  }
                  style="stroke"
                  strokeWidth={strokeWidth}
                  strokeCap={"round"}
                  start={0}
                  end={progress}
                />

                {/* 3. Đường trắng chạy quanh */}
                <Path
                  path={capsulePath}
                  style="stroke"
                  strokeWidth={strokeWidth}
                  strokeCap="round"
                  start={0}
                  end={progress}
                >
                  <SweepGradient
                    c={vec(layout.width / 2, layout.height / 2)}
                    matrix={animatedMatrix}
                    colors={[
                      theme.colors.primary + "10",
                      theme.colors.primary + "30",
                      theme.colors.primary + "80",
                      theme.colors.primary,
                      "#FFFFFF",
                      theme.colors.primary,
                      theme.colors.primary + "80",
                      theme.colors.primary + "30",
                      theme.colors.primary + "10",
                    ]}
                    positions={[0, 0.45, 0.7, 0.82, 0.9, 0.94, 0.97, 0.99, 1]}
                  />

                  <BlurMask blur={10} style="solid" />
                </Path>
              </>
            )}
          </Canvas>

          {/* Ruột bên trong chứa Text đếm giờ */}
          <View
            className="absolute bg-black rounded-full justify-center items-center"
            style={{
              marginLeft: 6,
              marginTop: 9,
              width: layout.width - 20,
              height: layout.height - 25,
            }}
          >
            <Counter
              itemClassName="text-white!"
              counter={counter}
              type="large"
            />
          </View>
        </View>
      )}

      <ThemedText type="small" className="mt-4">
        You're doing great, keep it up
      </ThemedText>
    </View>
  );
};

export default HomeTimeCounter;
