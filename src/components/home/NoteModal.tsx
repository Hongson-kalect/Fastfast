import { EMOTIONS } from "@/constants/data";
import { MoodLevel } from "@/interfaces/db.type";
import { useAppStore } from "@/stores/appStore";
import { MaterialIcons } from "@expo/vector-icons";
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

type Props = {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  note?: string;
  mood?: MoodLevel;
  onSelectMood: (mood?: MoodLevel, note?: string) => void;
};

const NoteModal = ({
  visible,
  setVisible,
  note,
  mood,
  onSelectMood,
}: Props) => {
  const { theme } = useAppStore();
  const [tempText, setTempText] = useState(note || "");

  useEffect(() => {
    setTempText(note || "");
  }, [note]);

  return (
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
              <View className="items-end mb-2">
                <TouchableOpacity
                  disabled={!(note || mood)}
                  activeOpacity={0.7}
                  onPress={() => {
                    onSelectMood();
                    setVisible(false);
                  }}
                  className={`${note || mood ? "" : "opacity-50"} bg-error flex-row items-center gap-2 rounded-lg px-2 py-1`}
                >
                  <MaterialIcons name="delete" size={20} color={"white"} />
                  <Text className="text-white! font-bold">Clear</Text>
                </TouchableOpacity>
              </View>
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
                          (onSelectMood(item.level, tempText),
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
