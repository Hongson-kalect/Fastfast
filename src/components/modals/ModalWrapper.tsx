import { useAppStore } from "@/stores/appStore";
import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { Divider } from "react-native-paper";
import Animated, {
  Easing,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { runOnJS } from "react-native-worklets";
import { ThemedText } from "../themed-text";

type Props = {
  show: boolean;
  type?: "input" | "alert" | "confirm" | "prompt" | "custom" | "menu" | "tabs";
  title?: string | React.ReactNode;
  bottom?: React.ReactNode;
  titlePosition?: "center" | "left" | "right";
  inAnimation?: "fade" | "slideDown" | "slideUp" | "zoomIn" | "zoomOut";
  outAnimation?: "fade" | "slideDown" | "slideUp" | "zoomOut" | "zoomIn";
  onCancel: () => void;
  rightContent?: React.ReactNode;
  leftContent?: React.ReactNode;
  centerContent?: React.ReactNode;
  padding?: number;
  children: React.ReactNode;
  backdropOpacity?: number;
  onExitComplete?: () => void;
};

const ANIMATION_DURATION = 200;

export default function ModalWrapper({
  show,
  onCancel,
  children,
  title,
  bottom,
  padding = 7,
  titlePosition = "left",

  inAnimation = "slideUp",
  outAnimation = "slideDown",
  onExitComplete,

  backdropOpacity = 0.5,
}: Props) {
  const { height, width } = useWindowDimensions();
  const { theme } = useAppStore();
  const [mounted, setMounted] = useState(show);
  const progress = useSharedValue(show ? 1 : 0);

  const handleExitComplete = () => {
  setMounted(false);
  onExitComplete?.();
};

  /**
   * ================================
   * OPEN / CLOSE LIFECYCLE
   * ================================
   */
  useEffect(() => {
    if (show) {
      // 1. Mount Modal
      setMounted(true);

      // 2. Animate Open (không cần requestAnimationFrame nếu đã set mounted)
      progress.value = 0;
      progress.value = withTiming(1, {
        duration: ANIMATION_DURATION,
        easing: Easing.out(Easing.cubic),
      });
    } else if (mounted) {
      // 3. Animate Close
      progress.value = withTiming(
        0,
        {
          duration: ANIMATION_DURATION,
          easing: Easing.in(Easing.cubic),
        },
        (finished) => {
          if (finished) {
            // ⚠️ BẮT BUỘC dùng runOnJS để chuyển call về JS Thread an toàn
            runOnJS(handleExitComplete)();
          }
        },
      );
    }
  }, [show]);
  /**
   * ================================
   * BACKDROP
   * ================================
   */
  const backdropStyle = useAnimatedStyle(() => {
    return {
      opacity: progress.value * backdropOpacity,
    };
  });

  const contentStyle = useAnimatedStyle(() => {
    const p = progress.value;
    const animation = show ? inAnimation : outAnimation;

    switch (animation) {
      case "fade":
        return {
          opacity: p,
        };

      case "slideUp":
        return {
          opacity: p,
          transform: [
            {
              translateY: (1 - p) * 50,
            },
          ],
        };

      case "slideDown":
        return {
          opacity: p,
          transform: [
            {
              translateY: -(1 - p) * 50,
            },
          ],
        };

      case "zoomOut":
        return {
          opacity: p,
          transform: [
            {
              scale: 0.85 + p * 0.15,
            },
          ],
        };

      case "zoomIn":
      default:
        return {
          opacity: p,
          transform: [
            {
              scale: 0.85 + p * 0.15,
            },
          ],
        };
    }
  });

  if (!mounted) {
    return null;
  }

  return (
    <Modal
      transparent
      visible={mounted}
      animationType="none"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View
        style={[
          styles.container,
          {
            padding: StatusBar.currentHeight,
          },
        ]}
      >
        {/* =====================================
            BACKDROP
        ====================================== */}

        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel}>
          <Animated.View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}
          />
        </Pressable>

        {/* =====================================
            MODAL CONTENT
        ====================================== */}

        <View style={{ width: width - 40 }}>
          <Animated.View
            style={[contentStyle]}
            /**
             * Layout animation chỉ chịu trách nhiệm
             * khi kích thước content thay đổi.
             *
             * Không dùng nó cho enter / exit.
             */
            layout={LinearTransition.mass(0.6)}
          >
            <View
              style={{
                backgroundColor: theme.background,
                borderWidth: 0.5,
              }}
              className="
                relative
                shadow-lg
                shadow-text-base/40
                border
                border-text-base/60
                rounded-2xl
              "
            >
              <View
                className="pb-5 pt-3 w-full"
                style={{
                  maxHeight: (height / 4) * 3,
                }}
              >
                {/* =================================
                    TITLE
                ================================== */}

                {!!title &&
                  (typeof title === "string" ? (
                    <View>
                      <ThemedText
                        style={{
                          textAlign: titlePosition,
                          fontFamily: "PlaypenSans-Semibold",
                          color: theme.text,
                        }}
                        className="text-xl p-4"
                      >
                        {title}
                      </ThemedText>

                      <Divider className="bg-red-400" />
                    </View>
                  ) : (
                    title
                  ))}

                {/* =================================
                    CONTENT
                ================================== */}

                <Animated.ScrollView keyboardShouldPersistTaps="handled">
                  <View
                    style={{
                      padding,
                    }}
                  >
                    {children}
                  </View>
                </Animated.ScrollView>

                {/* =================================
                    BOTTOM
                ================================== */}

                {!!bottom && (
                  <>
                    <Divider />
                    {bottom}
                  </>
                )}
              </View>

              {/* =================================
                  CLOSE BUTTON
              ================================== */}

              {!!title && (
                <Pressable
                  onPress={onCancel}
                  className="
                    absolute
                    top-2
                    right-2
                    p-2
                    rounded-full
                  "
                >
                  <ThemedText
                    style={{
                      color: theme.subText1,
                    }}
                    className="text-lg font-semibold"
                  >
                    ×
                  </ThemedText>
                </Pressable>
              )}
            </View>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",

    /**
     * Đảm bảo modal nằm trên toàn bộ screen.
     */
    width: "100%",
    height: "100%",
  },

  backdrop: {
    backgroundColor: "#000",
  },
});
