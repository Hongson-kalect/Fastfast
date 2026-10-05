import { FASTING_TARGETS } from "@/constants/data";
import { MoodLevel } from "@/constants/emotions";
import { useDBService } from "@/hooks/useDBService";
import { DailyNote } from "@/interfaces/db.type";
import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import React, { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  ZoomIn,
} from "react-native-reanimated";
import FastEndTimeModal from "./FastEndTimeModal";
import FastStartTimeModal from "./FastStartTimeModal";
import { PhotoPickerModal } from "./ImageModal";
import NoteModal from "./NoteModal";
import { SwapFastButton } from "./SwapButton/SwapFastButton";
import { SwapImageButton } from "./SwapButton/SwapImageButton";
import { SwapMoodButton } from "./SwapButton/SwapMoodButton";

type SwapButtonProps = {
  isCounting: boolean;
  toggleCounting: (delayTime?: number) => void;
  loading?: boolean;
  className?: string;
};

export const SwapButton = React.memo(
  ({
    isCounting,
    toggleCounting,
    loading = false,
    className = "",
    ...props
  }: SwapButtonProps) => {
    const dbService = useDBService();

    const [todayNote, setTodayNote] = useState<DailyNote | null>(null);

    const { updateWeight, weight, currentFastSession, theme, settings } =
      useAppStore();

    const [todayData, setTodayData] = useState<{
      note?: string;
      mood?: MoodLevel;
      image?: string;
    }>({});

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [noteModalVisible, setNoteModalVisible] = useState(false);
    const [imageOptionVisible, setImageOptionVisible] = useState(false);
    const [tempImage, setTempImage] = useState<string | undefined>();

    const animationProgress = useSharedValue(0);

    const overlayStyle = useAnimatedStyle(() => ({
      opacity: withTiming(animationProgress.value, {
        duration: 200,
      }),
    }));

    const color = settings?.target
      ? (FASTING_TARGETS.find((item) => item.hours === settings.target)?.colors
          .accent ?? theme.primary)
      : theme.primary;

    const detectTodayNote = async () => {
      const note = await dbService?.getDailyNote();
      setTodayNote(note || null);
    };

    const getCurrentWeight = async () => {
      const weightObj = await dbService?.getCurrentWeight();
      updateWeight(weightObj?.weight || 0);
    };

    const toggleMenu = () => {
      if (isMenuOpen) {
        animationProgress.value = 0;
        setIsMenuOpen(false);
        return;
      }

      setIsMenuOpen(true);
      animationProgress.value = 1;
    };

    const handleSelectMood = async (
      mood?: MoodLevel,
      note?: string,
      newWeight?: number,
    ) => {
      if (!dbService) return console.log("db not ready");

      animationProgress.value = 0;
      setIsMenuOpen(false);

      setTodayData((prev) => ({
        ...prev,
        note,
        mood,
      }));

      await dbService.setDailyNote(mood, note, todayData.image);

      if (newWeight && weight !== newWeight) {
        await dbService.updateWeight(newWeight);
        updateWeight(newWeight);
      }
    };

    const handleUpdateImage = async (uri: string | undefined) => {
      if (!dbService) return console.log("db not ready");

      setTodayData((prev) => ({
        ...prev,
        image: uri,
      }));

      await dbService.setDailyNote(todayNote?.mood_level, todayNote?.note, uri);

      setTempImage(uri);
    };

    const { addModal, closeCurrentModal } = useModalStore();

    const handleDelaySubmit = (selectedTime: number) => {
      closeCurrentModal();
      toggleCounting(selectedTime);
    };

    const showDelayModal = () => {
      if (isCounting && currentFastSession) {
        const finishTime = currentFastSession.target_duration
          ? currentFastSession.start_time +
            currentFastSession.target_duration * 60 * 1000
          : null;

        addModal({
          type: "custom",
          render: (
            <FastEndTimeModal
              startTime={currentFastSession.start_time}
              targetFinishTime={finishTime}
              currentFast={currentFastSession}
            />
          ),
        });

        return;
      }

      addModal({
        type: "custom",
        render: (
          <FastStartTimeModal
            minTime={currentFastSession?.end_time}
            onSubmit={handleDelaySubmit}
          />
        ),
      });
    };

    useEffect(() => {
      if (!dbService) return;

      detectTodayNote();
      getCurrentWeight();
    }, [dbService]);

    useEffect(() => {
      if (!todayNote) return;

      setTodayData({
        note: todayNote.note || undefined,
        image: todayNote.image_uri || undefined,
        mood: todayNote.mood_level || undefined,
      });
    }, [todayNote]);

    const imageScale = useSharedValue(1);
    const fastScale = useSharedValue(1);
    const moodScale = useSharedValue(1);

    const imageAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: imageScale.value }],
    }));

    const fastAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: fastScale.value }],
    }));

    const moodAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: moodScale.value }],
    }));

    const handlePressIn = (scale: typeof imageScale, value = 0.94) => {
      scale.value = withSpring(value, {
        damping: 16,
        stiffness: 300,
      });
    };

    const handlePressOut = (scale: typeof imageScale) => {
      scale.value = withSpring(1, {
        damping: 14,
        stiffness: 260,
      });
    };

    return (
      <View className="h-28 flex-row items-end justify-center gap-4">
        {/* Overlay */}
        <Animated.View
          style={overlayStyle}
          pointerEvents={isMenuOpen ? "auto" : "none"}
          className="absolute inset-0 z-10 h-screen w-screen bg-background/60"
        >
          <Pressable className="flex-1" onPress={toggleMenu} />
        </Animated.View>

        <View className="relative z-20 w-full flex-row items-center justify-center gap-7">
          {/* Image */}
          <Animated.View entering={ZoomIn.delay(0).duration(180)}>
            <Animated.View style={imageAnimatedStyle}>
              <View className="rounded-full p-1 mt-4">
                <SwapImageButton
                  image={todayData.image}
                  loading={loading}
                  className={className}
                  onPress={() => {
                    setImageOptionVisible(true);
                  }}
                  onPressIn={() => {
                    handlePressIn(imageScale, 0.95);
                  }}
                  onPressOut={() => {
                    handlePressOut(imageScale);
                  }}
                  {...props}
                />
              </View>
            </Animated.View>
          </Animated.View>

          {/* Fast */}
          <Animated.View entering={ZoomIn.delay(50).duration(220)}>
            <Animated.View style={fastAnimatedStyle}>
              <SwapFastButton
                isCounting={isCounting}
                loading={loading}
                color={color}
                className={className}
                onPress={() => toggleCounting()}
                onLongPress={showDelayModal}
                onPressIn={() => {
                  handlePressIn(fastScale, 0.92);
                }}
                onPressOut={() => {
                  handlePressOut(fastScale);
                }}
              />
            </Animated.View>
          </Animated.View>

          {/* Mood */}
          <Animated.View entering={ZoomIn.delay(100).duration(180)}>
            <Animated.View style={moodAnimatedStyle}>
              <View className="rounded-full p-1 mt-4">
                <SwapMoodButton
                  mood={todayData.mood}
                  note={todayData.note}
                  loading={loading}
                  className={className}
                  onPress={() => {
                    setNoteModalVisible(true);
                  }}
                  onPressIn={() => {
                    handlePressIn(moodScale, 0.95);
                  }}
                  onPressOut={() => {
                    handlePressOut(moodScale);
                  }}
                />
              </View>
            </Animated.View>
          </Animated.View>

          {/* Modals */}
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
  },
);
