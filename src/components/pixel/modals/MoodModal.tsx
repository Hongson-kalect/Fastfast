import { Text, TouchableOpacity, View } from "react-native";
import Animated, { SlideInDown, SlideOutDown } from "react-native-reanimated";

import { getEmotionPack, MoodLevel } from "@/constants/emotions";
import { useAppStore } from "@/stores/appStore";
import { getLocalTodayStr } from "@/utils/timer";
import { NoteModalShell } from "./NoteModalShell";
import { useT } from "@/providers/Language";

type Props = {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  mood?: MoodLevel | null;
  dateStr?: string;
  onSave: (mood: MoodLevel, date: string) => void;
};

export const MoodModal = ({
  visible,
  setVisible,
  mood,
  dateStr,
  onSave,
}: Props) => {
  const t = useT();
  const today = getLocalTodayStr();
  const date = dateStr ?? today;

  const settings = useAppStore((state) => state.settings);
  const isDark = settings?.is_dark_mode ?? true;

  const emotions = getEmotionPack(settings?.emotion_pack).emotions;

  const handleSave = (mood: MoodLevel) => {
    if (mood == null) return;

    onSave(mood, date);
    setVisible(false);
  };

  return (
    <NoteModalShell
      visible={visible}
      setVisible={setVisible}
      title={date === today ? t("dayModal.todayMood") : t("dayModal.moodFor", { date })}
      icon="face-smile"
    >
      <View className="gap-y-5">
        <View className="flex-row justify-between">
          {emotions.map((item, index) => {
            const isSelected = item.level === mood;
            const background = item.color[isDark ? "dark" : "light"];

            return (
              <Animated.View
                key={item.level}
                entering={SlideInDown.springify()
                  .damping(18)
                  .stiffness(180)
                  .mass(1)
                  .delay(index * 40)}
                exiting={SlideOutDown.duration(100)}
              >
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() => handleSave(item.level)}
                  className={`h-14 w-14 items-center justify-center rounded-full border-2 ${
                    isSelected
                      ? "border-primary bg-primary/15"
                      : "border-text-base/10 bg-background2"
                  }`}
                  style={[
                    isSelected ? { transform: [{ scale: 1.08 }] } : undefined,
                    {
                      backgroundColor: background,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 28 }}>
                    {item.icon[isDark ? "dark" : "light"]}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* <SaveButton
          disabled={selectedMood == null}
          onPress={handleSave}
        /> */}
      </View>
    </NoteModalShell>
  );
};
