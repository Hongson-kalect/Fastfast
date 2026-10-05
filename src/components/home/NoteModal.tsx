import { EMOTIONS } from "@/constants/data";
import { MoodLevel } from "@/interfaces/db.type";
import { useAppStore } from "@/stores/appStore";
import { FontAwesome6 } from "@expo/vector-icons";
import { useEffect, useState } from "react";
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
  const [tempWeight, setTempWeight] = useState(weight?.toString() ?? "");

  const parsedWeight = tempWeight ? Number(tempWeight) : undefined;

  useEffect(() => {
    setTempText(note ?? "");
  }, [note]);

  useEffect(() => {
    setTempWeight(weight?.toString() ?? "");
  }, [weight]);

  const weightError = checkWeightError(tempWeight);

  const handleSelectMood = (level: MoodLevel) => {
    onSelectMood(level, tempText, parsedWeight);
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
        className="flex-1 justify-end bg-background/80"
        onPress={() => setVisible(false)}
      >
        <Animated.View
          layout={LinearTransition.springify().duration(180).damping(80)}
        >
          <Pressable
            className="mx-3 mb-3 rounded-[32px] bg-background2 px-5 pb-5 pt-6"
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View className="mb-6 flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View className="h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                  <FontAwesome6 name="pen" size={17} color={theme.primary} />
                </View>

                <ThemedText size="xl" weight="bold" color="title">
                  Daily note
                </ThemedText>
              </View>

              <TouchableOpacity
                hitSlop={10}
                activeOpacity={0.7}
                onPress={() => setVisible(false)}
                className="h-9 w-9 items-center justify-center rounded-full bg-text-base/5"
              >
                <ThemedText
                  size="md"
                  weight="bold"
                  color="text"
                  opacity="medium"
                >
                  ×
                </ThemedText>
              </TouchableOpacity>
            </View>

            {/* Weight + Note */}
            <View className="mb-6 flex-row gap-3">
              {/* Weight */}
              <View className="w-[88px]">
                <View className="mb-2 ml-1 flex-row items-center gap-1.5">
                  <FontAwesome6
                    name="weight-scale"
                    size={11}
                    color={theme.text}
                    style={{ opacity: 0.55 }}
                  />

                  <ThemedText
                    size="xxs"
                    weight="semibold"
                    color="text"
                    opacity="half"
                  >
                    Weight
                  </ThemedText>
                </View>

                <View
                  className={`h-24 overflow-hidden rounded-3xl ${
                    weightError
                      ? "border border-error bg-error/10"
                      : "border border-primary/20 bg-primary/10"
                  }`}
                >
                  <TextInput
                    value={tempWeight}
                    placeholder={weight?.toString() || "0"}
                    placeholderTextColor={`${theme.text}55`}
                    onChangeText={setTempWeight}
                    maxLength={6}
                    keyboardType="decimal-pad"
                    style={{
                      textAlign: "center",
                      fontVariant: ["tabular-nums"],
                    }}
                    className="flex-1 px-2 pt-2 text-2xl font-bold text-text-base"
                  />

                  <ThemedText
                    size="xxs"
                    weight="semibold"
                    color="text"
                    opacity="medium"
                    className="absolute bottom-2 right-2"
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
                <View className="mb-2 ml-1 flex-row items-center gap-1.5">
                  <FontAwesome6
                    name="message"
                    size={11}
                    color={theme.text}
                    style={{ opacity: 0.55 }}
                  />

                  <ThemedText
                    size="xxs"
                    weight="semibold"
                    color="text"
                    opacity="half"
                  >
                    Note
                  </ThemedText>
                </View>

                <TextInput
                  value={tempText}
                  onChangeText={setTempText}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  cursorColor={theme.text}
                  placeholder="How did you feel today?"
                  placeholderTextColor={`${theme.text}55`}
                  className="h-24 rounded-3xl border border-text-base/10 bg-background px-4 py-3 text-sm text-text-base"
                />
              </View>
            </View>

            {/* Mood */}
            <View>
              <View className="mb-3 flex-row items-center gap-1.5">
                <FontAwesome6
                  name="face-smile"
                  size={11}
                  color={theme.text}
                  style={{ opacity: 0.55 }}
                />

                <ThemedText
                  size="xxs"
                  weight="semibold"
                  color="text"
                  opacity="medium"
                >
                  Mood
                </ThemedText>
              </View>

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
                        .delay(index * 40)}
                      exiting={SlideOutDown.duration(100)}
                    >
                      <TouchableOpacity
                        activeOpacity={0.75}
                        onPress={() => handleSelectMood(item.level)}
                        className={`h-14 w-14 items-center justify-center rounded-full border-2 ${
                          isSelected
                            ? "border-primary bg-primary/15"
                            : "border-text-base/10 bg-background"
                        }`}
                        style={
                          isSelected
                            ? {
                                transform: [{ scale: 1.08 }],
                              }
                            : undefined
                        }
                      >
                        <Text style={{ fontSize: 28 }}>{item.emoji}</Text>
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}
              </View>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

export default NoteModal;
