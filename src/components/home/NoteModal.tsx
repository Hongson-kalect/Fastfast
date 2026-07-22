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
  const inputRef = useRef<TextInput>(null);
  const [tempText, setTempText] = useState(note || "");
  const [tempWeight, setTempWeight] = useState(weight?.toString());
  const [weightError, setWeightError] = useState("");

  const [selection, setSelection] = useState({
    start: 0,
    end: 0,
  });
  const checkWeightError = (text: string): string => {
    if (text === "") return "";

    // Chỉ cho phép số và dấu .
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

  useEffect(() => {
    setTempText(note || "");
  }, [note]);

  useEffect(() => {
    setTempWeight(weight?.toString());
  }, [weight]);

  useEffect(() => {
    const error = checkWeightError(tempWeight || "");
    setWeightError(error);
  }, [tempWeight]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => setVisible(false)}
    >
      {/* Overlay */}
      <Pressable
        className="flex-1 bg-gray-900/70"
        onPress={() => setVisible(false)}
      >
        {/* Thanh reaction */}
        <View className="absolute bottom-8 left-4 right-4">
          <Animated.View
            layout={LinearTransition.springify().duration(100).damping(80)}
          >
            <Pressable className="p-2" onPress={(e) => e.stopPropagation()}>
              {/* <View className="items-end mb-2">
                <TouchableOpacity
                  disabled={!(note || mood)}
                  activeOpacity={0.7}
                  onPress={() => {
                    onSelectMood();
                    setVisible(false);
                  }}
                  className={`${note || mood ? "" : "opacity-20"} bg-error flex-row items-center gap-2 rounded-lg px-2 py-1`}
                >
                  <MaterialIcons name="delete" size={20} color={"white"} />
                  <Text className="text-white! font-bold">Clear</Text>
                </TouchableOpacity>
              </View> */}
              <View className="mb-1 flex-row items-center justify-between">
                <ThemedText color="white" className="text-xs!">
                  Weight
                </ThemedText>
                <View>
                  <ThemedText color="error" className="text-xs! font-medium">
                    {weightError ? weightError : " "}
                  </ThemedText>
                </View>
                <View className="items-end">
                  <ThemedText
                    color="primary"
                    className="text-gray-200! text-xs!"
                  >
                    Daily note
                  </ThemedText>
                </View>
              </View>
              <View className="flex-row items-center justify-between gap-2 mb-4">
                <View
                  className={`h-20 w-20 shadow ${weightError ? "shadow-error bg-error" : "shadow-primary bg-primary"} rounded-xl items-center justify-center`}
                >
                  <TextInput
                    ref={inputRef}
                    value={tempWeight}
                    placeholder={weight?.toString() || "0"}
                    placeholderTextColor={"#ddd"}
                    onChangeText={setTempWeight}
                    maxLength={6}
                    selection={selection}
                    hitSlop={10}
                    keyboardType="numeric"
                    className="text-white! text-xl! font-bold!"
                    onSelectionChange={(e) =>
                      setSelection(e.nativeEvent.selection)
                    }
                    onFocus={() => {
                      requestAnimationFrame(() => {
                        setSelection({
                          start: 0,
                          end: tempWeight?.length || 0,
                        });
                      });
                    }}
                  />
                  <View className="absolute bottom-1.5 right-1.5">
                    <ThemedText className="text-white/70! italic text-xs!">
                      kg
                    </ThemedText>
                  </View>
                </View>
                <View className="flex-1">
                  <TextInput
                    textAlignVertical="top"
                    cursorColor={theme.white}
                    style={{ fontSize: 14 }}
                    value={tempText}
                    onChangeText={(text) => setTempText(text)}
                    multiline
                    placeholder="What are you feeling today?"
                    placeholderTextColor={theme.white + "99"}
                    numberOfLines={3}
                    className="h-20 shadow shadow-white border-solid rounded-xl p-2 bg-gray-500  text-white"
                  ></TextInput>
                </View>
              </View>

              <View className={"flex-row items-center justify-center gap-2"}>
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
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 999,
                          borderColor: "gray",
                          borderWidth: 1,
                        }}
                        className={`items-center justify-center ${isSelected ? "bg-primary shadow-primary shadow-lg" : "bg-white flex-1"}`}
                        key={index}
                        onPress={() => {
                          (onSelectMood(
                            item.level,
                            tempText,
                            Number(tempWeight),
                          ),
                            console.log(item.emoji),
                            setVisible(false));
                        }}
                      >
                        <Text style={{ fontSize: 28 }} key={item.level}>
                          {item.emoji}
                        </Text>
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}
              </View>
            </Pressable>
          </Animated.View>
        </View>
      </Pressable>
    </Modal>
  );
};

export default NoteModal;
