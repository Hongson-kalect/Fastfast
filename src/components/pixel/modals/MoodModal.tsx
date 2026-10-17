import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Animated, {
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";

import { useAppStore } from "@/stores/appStore";
import { EMOTION_PACKS, MoodLevel } from "@/constants/emotions";
import { NoteModalShell } from "./NoteModalShell";
import { getLocalTodayStr } from "@/util/timer";

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
  const today = getLocalTodayStr();
  const date = dateStr ?? today;

  const { settings } = useAppStore();

  const emotions =
    EMOTION_PACKS[settings?.emotion_pack ?? "default"].emotions;

  const handleSave = (mood: MoodLevel) => {
    if (mood == null) return;

    onSave(mood, date);
    setVisible(false);
  };

  return (
    <NoteModalShell
      visible={visible}
      setVisible={setVisible}
      title={date === today ? "Today Mood" : `Mood ${date}`}
      icon="face-smile"
    >
      <View className="gap-y-5">
        <View className="flex-row justify-between">
          {emotions.map((item, index) => {
            const isSelected = item.level === mood;

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
                  style={
                    isSelected
                      ? { transform: [{ scale: 1.08 }] }
                      : undefined
                  }
                >
                  <Text style={{ fontSize: 28 }}>
                    {item.icon}
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