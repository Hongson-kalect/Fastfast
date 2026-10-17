import { useEffect, useState } from "react";
import { TextInput, TouchableOpacity, View } from "react-native";

import { useAppStore } from "@/stores/appStore";
import { NoteModalShell } from "./NoteModalShell";
import { getLocalTodayStr } from "@/util/timer";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";
import { getContrastTextColor } from "@/util/color";

type Props = {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  note?: string | null;
  dateStr?: string;
  onSave: (note: string, date: string) => void;
};

export const DailyNoteModal = ({
  visible,
  setVisible,
  note,
  dateStr,
  onSave,
}: Props) => {
  const today = getLocalTodayStr();
  const date = dateStr ?? today;

  const { theme } = useAppStore();
  const [tempText, setTempText] = useState(note ?? "");

  useEffect(() => {
    if (visible) setTempText(note ?? "");
  }, [visible, date, note]);

  const handleSave = () => {
    if (tempText === (note ?? "")) {
      setVisible(false);
      return;
    }

    onSave(tempText, date);
    setVisible(false);
  };

  return (
    <NoteModalShell
      visible={visible}
      setVisible={setVisible}
      title={date === today ? "Today Note" : `Note ${date}`}
      icon="pen"
    >
      <View className="gap-y-4">
        <TextInput
          value={tempText}
          onChangeText={setTempText}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          cursorColor={theme.text}
          placeholder="How did you feel today?"
          placeholderTextColor={`${theme.text}55`}
          className="min-h-32 rounded-2xl border border-text-base/10 bg-background px-4 py-3 text-sm text-text-base"
        />

        <TouchableOpacity
          className="flex-row items-center justify-center gap-x-2 px-4 py-2 rounded-lg bg-primary"
          onPress={handleSave}
        >
          <Ionicons
            name="save"
            size={16}
            color={getContrastTextColor(theme.primary)}
          />
          <ThemedText
            size="sm"
            weight="semibold"
            colorHex={getContrastTextColor(theme.primary)}
          >
            Save
          </ThemedText>
        </TouchableOpacity>
      </View>
    </NoteModalShell>
  );
};