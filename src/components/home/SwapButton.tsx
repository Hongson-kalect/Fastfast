// @/components/Button.tsx
import { ThemedText } from "@/components/themed-text";
import { EMOTIONS } from "@/constants/data";
import { useDBService } from "@/hooks/useDBService";
import { DailyNote, MoodLevel } from "@/interfaces/db.type";
import { useAppStore } from "@/stores/appStore";
import { Feather, FontAwesome6, Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { PhotoPickerModal } from "./ImageModal";
import NoteModal from "./NoteModal";

interface ButtonProps extends TouchableOpacityProps {
  isCounting: boolean;
  toggleCounting: () => void;
  variant?: "primary" | "secondary";
  loading?: boolean;
  className?: string;
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
  ...props
}: ButtonProps) => {
  const dbService = useDBService();
  const [todayNote, setTodayNote] = useState<DailyNote | null>(null);
  const { weight, updateWeight } = useAppStore();

  const detectTodayNote = async () => {
    const todayNote = await dbService?.getDailyNote();
    console.log("todayNote", todayNote);
    setTodayNote(todayNote || null);
  };

  const getCurrrentWeight = async () => {
    const weightObj = await dbService?.getCurrentWeight();
    console.log("weight", weight);
    updateWeight(weightObj?.weight || 0);
  };

  const [todayData, setTodayData] = useState<{
    note?: string;
    mood?: MoodLevel;
    image?: string;
  }>(() => {
    return {
      note: todayNote?.note,
      image: todayNote?.image_uri,
      mood: todayNote?.mood_level,
    };
  });

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

  const handleSelectMood = async (
    mood?: MoodLevel,
    note?: string,
    newWeight?: number,
  ) => {
    if (!dbService) return console.log("db not ready");
    console.log("Selected Mood:", mood);
    // Lưu vào database local của bạn tại đây...

    // Đóng menu an toàn
    animationProgress.value = 0;
    setIsMenuOpen(false);
    setTodayData({ ...todayData, note: note, mood: mood });

    await dbService.setDailyNote(mood, note, todayData?.image);

    if (newWeight && weight !== newWeight) {
      await dbService.updateWeight(newWeight);
      updateWeight(newWeight);
    }
    // Thêm emoji và node(nếu có vào trong db)
  };

  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [imageOptionVisible, setImageOptionVisible] = useState(false);
  const { theme } = useAppStore();

  const [tempImage, setTempImage] = useState<string | undefined>(undefined);

  const handleUpdateImage = async (uri: string | undefined) => {
    if (!dbService) return console.log("db not ready");
    setTodayData({ ...todayData, image: uri });

    await dbService.setDailyNote(todayNote?.mood_level, todayNote?.note, uri);
    console.log(uri);
    setTempImage(uri);
  };

  useEffect(() => {
    if (!dbService) return;
    detectTodayNote();
    getCurrrentWeight();
  }, [dbService]);
  
  useEffect(() => {
    if (!todayNote) return;
    setTodayData({
      note: todayNote?.note || undefined,
      image: todayNote?.image_uri || undefined,
      mood: todayNote?.mood_level || undefined,
    });
  }, [todayNote]);

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
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setImageOptionVisible(true)}
          disabled={loading}
          className={`h-20 w-20 rounded-full flex-row items-center justify-center border shadow-md ${todayData.image ? "shadow-primary border-primary" : "shadow-gray-200 border-gray-500"} ${loading ? "opacity-60" : ""} ${className}`}
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
              {todayData.image ? (
                <Image
                  source={{ uri: todayData.image }}
                  className="w-20 h-20 rounded-full"
                />
              ) : (
                <Feather name="image" size={28} color="white" />
              )}
              {/* <Feather name="image" size={28} color="white" /> */}
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
          onPress={() => setNoteModalVisible(true)}
          activeOpacity={0.7}
          disabled={loading}
          className={`h-20 w-20 rounded-full flex-row items-center justify-center border shadow-md ${todayData.mood ? "shadow-primary border-primary" : "shadow-gray-200 border-gray-500"} ${loading ? "opacity-60" : ""} ${className}`}
          {...props}
        >
          {loading ? (
            <ActivityIndicator color="#38BDF8" />
          ) : (
            <View className="flex items-center justify-center flex-1">
              <ThemedText
                color={"white"}
                type="subtitle"
                style={{ fontWeight: "bold" }}
              >
                {todayData?.mood ? (
                  <ThemedText type="subtitle" className="">
                    {EMOTIONS[todayData.mood - 1].emoji}
                  </ThemedText>
                ) : (
                  <Feather name="edit-2" size={28} color="white" />
                )}
              </ThemedText>
              {todayData.note && (
                <View className="absolute -top-4 right-0">
                  <Ionicons name="chatbox" size={24} color="white" />
                </View>
              )}
            </View>
          )}
        </TouchableOpacity>

        {/* Note modal */}
        <NoteModal
          visible={noteModalVisible}
          setVisible={setNoteModalVisible}
          note={todayData.note}
          mood={todayData.mood}
          weight={weight}
          onSelectMood={handleSelectMood}
        />
        <PhotoPickerModal
          visible={imageOptionVisible}
          setVisible={setImageOptionVisible}
          photoUri={todayData.image || tempImage}
          updateImage={handleUpdateImage}
        />
      </View>
    </View>
  );
};
