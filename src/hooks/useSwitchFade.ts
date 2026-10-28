import { useEffect, useRef } from "react";
import {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

/**
 * Hiệu ứng mờ rồi hiện lại khi nội dung đổi kiểu (VD lịch pixel đổi chế độ).
 * Chỉ animate opacity của một view bọc ngoài, không đụng tới từng ô bên trong.
 */
export const useSwitchFade = (key: string) => {
  const opacity = useSharedValue(1);
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    opacity.value = 0.25;
    opacity.value = withTiming(1, { duration: 260 });
  }, [key, opacity]);

  return useAnimatedStyle(() => ({ opacity: opacity.value }));
};
