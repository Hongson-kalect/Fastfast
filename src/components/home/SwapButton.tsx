// @/components/Button.tsx
import { ThemedText } from "@/components/themed-text";
import { EMOTIONS } from "@/constants/data";
import { useAppSettingsStore } from "@/store/useAppSettingStore";
import { Feather, FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from "react-native";
import Animated, {
  LinearTransition,
  SlideInDown,
  SlideOutDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: "primary" | "secondary";
  loading?: boolean;
  className?: string;
}

export const SwapButton = ({
  title,
  variant = "primary",
  loading = false,
  className = "",
  ...props
}: ButtonProps) => {
  const baseStyle =
    "h-28 w-28 rounded-full flex-row items-center justify-center px-6";
  const variantStyle =
    variant !== "primary"
      ? "bg-error shadow-md shadow-error"
      : "bg-gray-700 border-2 border-gray-500 shadow-inner shadow-gray-200 ";

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Shared Value chỉ thuần túy phục vụ vẽ hiệu ứng ở UI Thread (0: Đóng, 1: Mở)
  const animationProgress = useSharedValue(0);

  // Animation cho lớp Overlay nền mờ
  const overlayStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(animationProgress.value, { duration: 200 }),
    };
  });

  // Xử lý bật/tắt Menu điều hướng nhịp nhàng cả 2 luồng
  const toggleMenu = () => {
    if (isMenuOpen) {
      animationProgress.value = 0; // Thu hồi animation về 0
      setIsMenuOpen(false);
    } else {
      setIsMenuOpen(true);
      animationProgress.value = 1; // Bung animation lên 1
    }
  };

  const handleSelectEmoji = (emoji: string) => {
    console.log("Selected Mood:", emoji);
    // Lưu vào database local của bạn tại đây...

    // Đóng menu an toàn
    animationProgress.value = 0;
    setIsMenuOpen(false);
  };

  const [visible, setVisible] = useState(false);

  const emojis = ["😡", "😢", "😐", "😊", "😍"];
  const [note, setNote] = useState("");
  const { theme } = useAppSettingsStore();

  return (
    <View className="flex-row items-end justify-center gap-8">
      <Animated.View
        style={[overlayStyle]}
        pointerEvents={isMenuOpen ? "auto" : "none"}
        className="absolute h-screen w-screen inset-0 bg-red-200/60 z-10"
      >
        <Pressable className="flex-1" onPress={toggleMenu} />
      </Animated.View>

      <View className="flex-row gap-8 items-center justify-center z-20 relative w-full h-20">
        {/* VÒM 5 ICON EMOJI ẨN DƯỚI NÚT EDIT */}

        <TouchableOpacity
          activeOpacity={0.7}
          disabled={loading}
          className={`h-20 w-20 rounded-full flex-row items-center justify-center border border-gray-500 shadow-inner shadow-gray-200 ${loading ? "opacity-60" : ""} ${className}`}
          {...props}
        >
          {loading ? (
            <ActivityIndicator color="#38BDF8" />
          ) : (
            <ThemedText
              color={"white"}
              type="subtitle"
              style={{ fontWeight: "bold" }}
            >
              <Feather name="image" size={28} color="white" />
            </ThemedText>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={toggleMenu}
          activeOpacity={0.7}
          disabled={loading}
          className={`${baseStyle} ${variantStyle} ${loading ? "opacity-60" : ""} ${className}`}
          {...props}
        >
          {loading ? (
            <ActivityIndicator color="#38BDF8" />
          ) : (
            <ThemedText
              color={variant !== "primary" ? "white" : "textSecondary"}
              type="subtitle"
              style={{ fontWeight: "bold" }}
            >
              {isMenuOpen ? (
                <FontAwesome6 name="close" size={56} color="white" />
              ) : (
                <FontAwesome6 name="pause" size={56} color="white" />
              )}
            </ThemedText>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setVisible(true)}
          activeOpacity={0.7}
          disabled={loading}
          className={`h-20 w-20 rounded-full flex-row items-center justify-center border border-gray-500 shadow-inner shadow-gray-200 ${loading ? "opacity-60" : ""} ${className}`}
          {...props}
        >
          {loading ? (
            <ActivityIndicator color="#38BDF8" />
          ) : (
            <ThemedText
              color={"white"}
              type="subtitle"
              style={{ fontWeight: "bold" }}
            >
              <Feather name="edit-2" size={28} color="white" />
            </ThemedText>
          )}
        </TouchableOpacity>

        <Modal
          visible={visible}
          transparent
          animationType="fade"
          onRequestClose={() => setVisible(false)}
        >
          {/* Overlay */}
          <Pressable
            className="flex-1 bg-gray-900/40"
            onPress={() => setVisible(false)}
          >
            {/* Thanh reaction */}
            <View className="absolute bottom-8 left-4 right-4">
              <Animated.View
                layout={LinearTransition.springify().duration(100).damping(80)}
              >
                <Pressable className="p-2" onPress={(e) => e.stopPropagation()}>
                  <MaterialIcons name="notes" size={24} color={"#6a7282"} />
                  <View className="mb-8">
                    <TextInput
                      textAlignVertical="top"
                      cursorColor={theme.colors.white}
                      selectionColor={theme.colors.white}
                      style={{ fontSize: 14 }}
                      value={note}
                      onChangeText={(text) => setNote(text)}
                      multiline
                      placeholder="What are you feeling today?"
                      placeholderTextColor={theme.colors.white + "aa"}
                      numberOfLines={3}
                      className="h-20 border border-gray-500 border-solid rounded-xl p-2 bg-gray-500  text-white"
                    ></TextInput>
                  </View>
                  <View
                    className={"flex-row items-center justify-center gap-2"}
                  >
                    {EMOTIONS.map((item, index) => (
                      <Animated.View
                        key={item.emoji}
                        entering={SlideInDown.springify()
                          .damping(70)
                          .delay(index * 50)}
                        exiting={SlideOutDown.duration(100)}
                      >
                        <TouchableOpacity
                          style={{
                            width: 56,
                            height: 56,
                            borderRadius: 999,
                            borderColor: "gray",
                            borderWidth: 1,
                            backgroundColor: "white",
                          }}
                          className="items-center justify-center"
                          key={index}
                          onPress={() => {
                            (handleSelectEmoji(item.emoji),
                              console.log(item.emoji),
                              setVisible(false));
                          }}
                        >
                          <Text style={{ fontSize: 28 }} key={item.emoji}>
                            {item.emoji}
                          </Text>
                        </TouchableOpacity>
                      </Animated.View>
                    ))}
                  </View>
                </Pressable>
              </Animated.View>
            </View>
          </Pressable>
        </Modal>
      </View>
    </View>
  );
};
