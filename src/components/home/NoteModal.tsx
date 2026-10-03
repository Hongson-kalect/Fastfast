import { EMOTIONS } from "@/constants/data";
import { MoodLevel } from "@/interfaces/db.type";
import { useAppStore } from "@/stores/appStore";
import { useEffect, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  LinearTransition,
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";
import { ThemedText } from "../themed-text";

const checkWeightError = (text: string): string => {
  if (!text) return "";

  if (!/^[\d.]*$/.test(text)) {
    return "Chỉ được nhập số.";
  }

  const dots = (text.match(/\./g) || []).length;

  if (dots > 1) {
    return "Chỉ được nhập một dấu thập phân.";
  }

  const [integer = "", decimal = ""] = text.split(".");

  if (integer.length > 4) {
    return "Phần nguyên tối đa 4 chữ số.";
  }

  if (decimal.length > 1) {
    return "Phần thập phân tối đa 1 chữ số.";
  }

  return "";
};

type Props = {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  note?: string;
  mood?: MoodLevel;
  weight: number | null;
  onSelectMood: (mood?: MoodLevel, note?: string, weight?: number) => void;
};
const NoteModal = ({
  visible,
  setVisible,
  note,
  mood,
  weight,
  onSelectMood,
}: Props) => {
  const { theme } = useAppStore();

  const [tempText, setTempText] = useState(note ?? "");
  const [tempWeight, setTempWeight] = useState(
    weight?.toString() ?? "",
  );

  const parsedWeight = tempWeight
  ? Number(tempWeight)
  : undefined;

  useEffect(() => {
    setTempText(note ?? "");
  }, [note]);

  useEffect(() => {
    setTempWeight(weight?.toString() ?? "");
  }, [weight]);

  const weightError = checkWeightError(tempWeight);

  const handleSelectMood = (level: MoodLevel) => {
    onSelectMood(
      level,
      tempText,
      parsedWeight,
    );
    setVisible(false);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => setVisible(false)}
    >
      <Pressable
        className="flex-1 bg-background/80"
        onPress={() => setVisible(false)}
      >
        <View className="absolute bottom-6 left-4 right-4">
          <Animated.View
            layout={LinearTransition.springify()
              .duration(100)
              .damping(80)}
          >
            <Pressable
              className="rounded-3xl bg-background2 p-4"
              onPress={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <View className="mb-4 flex-row items-center justify-between">
                <View>
                  <ThemedText
                    size="md"
                    weight="bold"
                    color="title"
                  >
                    Daily note
                  </ThemedText>

                  <ThemedText
                    size="xxs"
                    color="text"
                    opacity="medium"
                    className="mt-0.5"
                  >
                    Hôm nay bạn cảm thấy thế nào?
                  </ThemedText>
                </View>

                <TouchableOpacity
                  hitSlop={10}
                  activeOpacity={0.7}
                  onPress={() => setVisible(false)}
                  className="h-8 w-8 items-center justify-center rounded-full bg-text-base/5"
                >
                  <ThemedText
                    size="sm"
                    weight="bold"
                    color="text"
                    opacity="medium"
                  >
                    ×
                  </ThemedText>
                </TouchableOpacity>
              </View>

              {/* Weight + Note */}
              <View className="mb-5 flex-row gap-2">
                {/* Weight */}
                <View className="w-20">
                  <ThemedText
                    size="xxs"
                    weight="semibold"
                    color="text"
                    opacity="medium"
                    className="mb-1.5"
                  >
                    Weight
                  </ThemedText>

                  <View
                    className={`h-20 rounded-2xl border ${
                      weightError
                        ? "border-error bg-error/10"
                        : "border-primary/20 bg-primary/10"
                    }`}
                  >
                    <TextInput
                      value={tempWeight}
                      placeholder={weight?.toString() || "0"}
                      placeholderTextColor={`${theme.text}66`}
                      onChangeText={setTempWeight}
                      maxLength={6}
                      keyboardType="decimal-pad"
                      className="flex-1 px-2 pb-3 pt-2 text-center text-xl font-bold text-text-base"
                      style={{
                        fontVariant: ["tabular-nums"],
                      }}
                    />

                    <ThemedText
                      size="xxs"
                      color="text"
                      opacity="medium"
                      className="absolute bottom-1.5 right-2"
                    >
                      kg
                    </ThemedText>
                  </View>

                  {weightError ? (
                    <ThemedText
                      size="xxs"
                      color="error"
                      className="mt-1"
                      numberOfLines={2}
                    >
                      {weightError}
                    </ThemedText>
                  ) : null}
                </View>

                {/* Note */}
                <View className="flex-1">
                  <ThemedText
                    size="xxs"
                    weight="semibold"
                    color="text"
                    opacity="medium"
                    className="mb-1.5"
                  >
                    Note
                  </ThemedText>

                  <TextInput
                    value={tempText}
                    onChangeText={setTempText}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    cursorColor={theme.text}
                    placeholder="What are you feeling today?"
                    placeholderTextColor={`${theme.text}66`}
                    className="h-20 rounded-2xl border border-text-base/10 bg-background px-3 py-2 text-xs text-text-base"
                  />
                </View>
              </View>

              {/* Mood */}
              <View>
                <ThemedText
                  size="xxs"
                  weight="semibold"
                  color="text"
                  opacity="medium"
                  className="mb-2"
                >
                  Mood
                </ThemedText>

                <View className="flex-row justify-between">
                  {EMOTIONS.map((item, index) => {
                    const isSelected = item.level === mood;

                    return (
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
                          activeOpacity={0.75}
                          onPress={() =>
                            handleSelectMood(item.level)
                          }
                          className={`h-12 w-12 items-center justify-center rounded-full border ${
                            isSelected
                              ? "border-primary bg-primary"
                              : "border-text-base/10 bg-background"
                          }`}
                        >
                          <Text style={{ fontSize: 25 }}>
                            {item.emoji}
                          </Text>
                        </TouchableOpacity>
                      </Animated.View>
                    );
                  })}
                </View>
              </View>
            </Pressable>
          </Animated.View>
        </View>
      </Pressable>
    </Modal>
  );
};

export default NoteModal;
