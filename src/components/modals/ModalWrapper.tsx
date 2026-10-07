import { useAppStore } from "@/stores/appStore";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from "react-native";
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
  onExitComplete?: () => void;
};

const ANIMATION_DURATION = 300;

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
}: Props) {
  const { height, width } = useWindowDimensions();
  const theme = useAppStore((state) => state.theme);
  const settings = useAppStore((state) => state.settings);
  const [mounted, setMounted] = useState(show);
  const progress = useSharedValue(show ? 1 : 0);
  const isDark = settings?.is_dark_mode ?? true;

  const backdropOpacity = isDark ? 0.4 : 0.45;

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
            runOnJS(setMounted)(false);
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
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        {/* 2. Cho phép chạm vào backdrop để vừa tắt keyboard vừa handle cancel */}
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.container}>
            {/* Backdrop */}
            <Pressable style={StyleSheet.absoluteFill} onPress={onCancel}>
              <Animated.View
                pointerEvents="none"
                style={[
                  StyleSheet.absoluteFill,
                  styles.backdrop,
                  {
                    backgroundColor: theme.text,

                    borderWidth: 1,
                    borderColor: theme.text,
                    // opacity: isDark ? 1 : 0.5,

                    shadowColor: "#000",
                    shadowOffset: {
                      width: 0,
                      height: 10,
                    },
                    shadowOpacity: 0.2,
                    shadowRadius: 24,

                    elevation: 12,
                  },
                  backdropStyle,
                ]}
              />
            </Pressable>

            {/* Modal */}
            <View
              style={{
                width: Math.min(width - 32, 520),
                maxHeight: height * 0.82,
              }}
            >
              <Animated.View
                layout={LinearTransition.springify()
                  .damping(40)
                  .stiffness(100)
                  .mass(1)}
                style={contentStyle}
              >
                <View
                  className="overflow-hidden rounded-3xl"
                  style={{
                    backgroundColor: theme.background,
                  }}
                >
                  {/* Header */}
                  {!!title && (
                    <View
                      className="px-5 pb-3 pt-5"
                      style={{
                        paddingRight: 52,
                      }}
                    >
                      {typeof title === "string" ? (
                        <ThemedText
                          size="xl"
                          weight="bold"
                          color="title"
                          style={{
                            textAlign: titlePosition,
                          }}
                        >
                          {title}
                        </ThemedText>
                      ) : (
                        title
                      )}
                    </View>
                  )}

                  {/* Close */}
                  {!!title && (
                    <Pressable
                      onPress={onCancel}
                      hitSlop={8}
                      className="absolute right-4 top-4 h-9 w-9 items-center justify-center rounded-full bg-text-base/10"
                    >
                      <Ionicons name="close" size={18} color={theme.text} />
                    </Pressable>
                  )}

                  {/* Content */}
                  <Animated.ScrollView
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                    contentContainerStyle={{
                      paddingHorizontal: padding,
                      paddingTop: title ? 4 : padding,
                      paddingBottom: padding,
                    }}
                  >
                    {children}
                  </Animated.ScrollView>

                  {/* Bottom */}
                  {!!bottom && (
                    <View
                      className="px-4 pb-4 pt-2"
                      style={{
                        borderTopWidth: 1,
                        borderTopColor: theme.text + "0D",
                      }}
                    >
                      {bottom}
                    </View>
                  )}
                </View>
              </Animated.View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
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
