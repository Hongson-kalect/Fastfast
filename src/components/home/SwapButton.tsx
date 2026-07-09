// @/components/Button.tsx
import { ThemedText } from "@/components/themed-text";
import { EMOTIONS } from "@/constants/data";
import { DailyNote, MoodLevel } from "@/interfaces/db.type";
import { useAppStore } from "@/stores/appStore";
import { Feather, FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
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
  isCounting: boolean;
  toggleCounting: () => void;
  variant?: "primary" | "secondary";
  loading?: boolean;
  className?: string;
  todayNote: DailyNote | null;
  data?: {
    note?: string;
    mood: 0 | 1 | 2 | 3 | 4;
    image?: string;
  };
}

export const SwapButton = ({
  isCounting,
  toggleCounting,
  variant = "primary",
  loading = false,
  className = "",
  todayNote,
  ...props
}: ButtonProps) => {
  const { dbService } = useAppStore();
  const [todayData, setTodayData] = useState<{
    note: string | null;
    mood: MoodLevel | null;
    image: string | null;
  }>(() => {
    return {
      note: todayNote?.note || null,
      image: todayNote?.image_uri || null,
      mood: todayNote?.mood_level || null,
    };
  });

  const [tempText, setTempText] = useState<string>(() => todayData?.note || "");
  useEffect(() => {
    setTempText(todayData?.note || "");
  }, [todayData?.note]);

  const baseStyle =
    "h-28 w-28 rounded-full flex-row items-center justify-center px-6";
  const variantStyle = isCounting
    ? "bg-gray-700 border-2 border-gray-500 shadow-inner shadow-gray-200 "
    : "bg-primary shadow-md shadow-primary";

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

  const handleSelectEmoji = async (mood: MoodLevel) => {
    if (!dbService) return console.log("db not ready");
    if (!mood) return alert("m vào đây hay v");
    console.log("Selected Mood:", mood);
    // Lưu vào database local của bạn tại đây...

    // Đóng menu an toàn
    animationProgress.value = 0;
    setIsMenuOpen(false);
    setTodayData({ ...todayData, note: tempText, mood: mood });

    await dbService.setDailyNote(mood, tempText);

    // Thêm emoji và node(nếu có vào trong db)
  };

  const [visible, setVisible] = useState(false);

  const emojis = ["😫", "😮‍💨", "🙂", "😃", "🥰"];
  const { theme } = useAppStore();

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
          onPress={toggleCounting}
          activeOpacity={0.7}
          disabled={loading}
          className={`${baseStyle} ${variantStyle} ${loading ? "opacity-60" : ""} ${className}`}
          {...props}
        >
          {loading ? (
            <ActivityIndicator color="#38BDF8" />
          ) : isCounting ? (
            <FontAwesome6 name="stop" size={52} color="white" />
          ) : (
            <FontAwesome6
              name="play"
              size={52}
              style={{ marginLeft: 8 }}
              color="white"
            />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setVisible(true)}
          activeOpacity={0.7}
          disabled={loading}
          className={`h-20 w-20 ${todayData?.mood ? "bg-primary" : "bg-gray-700"} rounded-full flex-row items-center justify-center border border-gray-500 shadow-inner shadow-gray-200 ${loading ? "opacity-60" : ""} ${className}`}
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

        {/* Note modal */}
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
                      cursorColor={theme.white}
                      selectionColor={theme.white}
                      style={{ fontSize: 14 }}
                      value={tempText}
                      onChangeText={(text) => setTempText(text)}
                      multiline
                      placeholder="What are you feeling today?"
                      placeholderTextColor={theme.white + "aa"}
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
                          .damping(18)
                          .stiffness(180)
                          .mass(1)
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
                            (handleSelectEmoji(item.level),
                              console.log(item.emoji),
                              setVisible(false));
                          }}
                        >
                          <Text style={{ fontSize: 28 }} key={item.level}>
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
