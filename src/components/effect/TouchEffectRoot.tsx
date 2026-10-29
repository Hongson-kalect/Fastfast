import { ReactNode, useRef, useState } from "react";
import { GestureResponderEvent, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useEffectSelection } from "./slots";
import { TOUCH_EFFECT_DURATION } from "./types";

// Giới hạn số hiệu ứng cùng lúc khi chạm liên tục
const MAX_BURSTS = 3;
// Chỉ tính là "chạm" khi nhấc tay nhanh và gần như không di chuyển (không phải vuốt cuộn)
const TAP_MAX_MOVE = 10;
const TAP_MAX_MS = 400;

type Burst = { id: number; x: number; y: number };

/**
 * Gốc của app (thay GestureHandlerRootView): nghe các cú chạm mà không chặn chúng,
 * rồi vẽ hiệu ứng `touch` của theme tại điểm chạm. Không có effect thì không làm gì.
 */
export const TouchEffectRoot = ({ children }: { children: ReactNode }) => {
  const effect = useEffectSelection();
  const Touch = effect?.context.animate ? effect.definition.touch : undefined;

  const [bursts, setBursts] = useState<Burst[]>([]);
  const start = useRef<{ x: number; y: number; time: number } | null>(null);
  const nextId = useRef(0);

  const onTouchStart = (event: GestureResponderEvent) => {
    const { pageX, pageY, touches } = event.nativeEvent;
    // Bỏ qua đa điểm (zoom, chạm hai ngón)
    start.current = touches.length > 1 ? null : { x: pageX, y: pageY, time: Date.now() };
  };

  const onTouchEnd = (event: GestureResponderEvent) => {
    const begin = start.current;
    start.current = null;
    if (!Touch || !begin) return;

    const { pageX, pageY } = event.nativeEvent;
    const moved = Math.hypot(pageX - begin.x, pageY - begin.y);
    if (moved > TAP_MAX_MOVE || Date.now() - begin.time > TAP_MAX_MS) return;

    const id = nextId.current++;
    setBursts((current) => [...current.slice(1 - MAX_BURSTS), { id, x: pageX, y: pageY }]);
    setTimeout(() => {
      setBursts((current) => current.filter((burst) => burst.id !== id));
    }, TOUCH_EFFECT_DURATION + 50);
  };

  return (
    <GestureHandlerRootView
      style={{ flex: 1 }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchCancel={() => {
        start.current = null;
      }}
    >
      {children}

      {Touch && effect && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {bursts.map((burst) => (
            <Touch key={burst.id} {...effect.context} x={burst.x} y={burst.y} />
          ))}
        </View>
      )}
    </GestureHandlerRootView>
  );
};
