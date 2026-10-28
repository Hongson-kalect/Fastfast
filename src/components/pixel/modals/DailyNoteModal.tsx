import { useEffect, useRef, useState } from "react";
import { TextInput, TouchableOpacity, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useAppStore } from "@/stores/appStore";
import { getContrastTextColor } from "@/utils/color";
import { getLocalTodayStr } from "@/utils/timer";
import { Ionicons } from "@expo/vector-icons";
import { NoteModalShell } from "./NoteModalShell";
import { useT } from "@/providers/Language";

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
  const t = useT();
  const today = getLocalTodayStr();
  const date = dateStr ?? today;

  const theme = useAppStore((state) => state.theme);
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

    const inputRef = useRef<TextInput>(null);
    useEffect(() => {
      if (visible && inputRef.current) {
        setTimeout(() => inputRef.current?.focus(), 150);
      }
    }, [visible]);
  

  return (
    <NoteModalShell
      visible={visible}
      setVisible={setVisible}
      title={date === today ? t("note.today") : t("note.forDate", { date })}
      icon="pen"
    >
      <View className="gap-y-4">
        <TextInput
          ref={inputRef}
          value={tempText}
          onChangeText={setTempText}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          cursorColor={theme.text}
          placeholder={t("note.placeholder")}
          placeholderTextColor={`${theme.text}55`}
          className="min-h-32 rounded-2xl border border-text-base/10 bg-background px-4 py-3 text-sm text-text-base"
        />

        <TouchableOpacity
          className="flex-row items-center justify-center gap-x-2 p-4 rounded-lg bg-primary"
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
            {t("common.save")}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </NoteModalShell>
  );
};
