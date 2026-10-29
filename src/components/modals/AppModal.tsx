import { ReactNode, useEffect } from "react";
import {
  BackHandler,
  KeyboardAvoidingView,
  StyleSheet,
} from "react-native";
import { Portal } from "react-native-paper";
import Animated, { FadeIn } from "react-native-reanimated";

type Props = {
  visible: boolean;
  onRequestClose?: () => void;
  animationType?: "none" | "fade";
  children: ReactNode;
};

/**
 * Thay cho Modal của react-native ở các modal có ô nhập.
 *
 * Modal của RN là một cửa sổ Android riêng; với edge-to-edge (bắt buộc từ SDK 56)
 * cửa sổ đó không resize khi bàn phím mở và sự kiện Keyboard của JS không bắn ra,
 * nên KeyboardAvoidingView bên trong không làm gì. Overlay này render qua Portal
 * vào cửa sổ chính, nơi sự kiện bàn phím hoạt động bình thường.
 */
export const AppModal = ({
  visible,
  onRequestClose,
  animationType = "none",
  children,
}: Props) => {
  // Nút Back của Android đóng modal như Modal gốc
  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onRequestClose?.();
      return true;
    });
    return () => sub.remove();
  }, [visible, onRequestClose]);

  if (!visible) return null;

  return (
    <Portal>
      <Animated.View
        entering={animationType === "fade" ? FadeIn.duration(200) : undefined}
        style={StyleSheet.absoluteFill}
      >
        <KeyboardAvoidingView behavior="padding" style={styles.fill}>
          {children}
        </KeyboardAvoidingView>
      </Animated.View>
    </Portal>
  );
};

const styles = StyleSheet.create({
  fill: { flex: 1 },
});

export default AppModal;
