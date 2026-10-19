import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { TextInput, TouchableOpacity, View } from "react-native";

import { checkWeightError } from "@/components/home/NoteModal";
import { ThemedText } from "@/components/themed-text";
import { useDBService } from "@/hooks/useDBService";
import { useAppStore } from "@/stores/appStore";
import { getContrastTextColor } from "@/util/color";
import { getWeight } from "@/util/home/fast";
import { getLocalTodayStr } from "@/util/timer";
import { NoteModalShell } from "./NoteModalShell";

type Props = {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  dateStr?: string;
  weight?: number | null;
  onSave: (weight: number | null, date: string) => void;
};

export const WeightModal = ({
  visible,
  setVisible,
  dateStr,
  weight,
  onSave,
}: Props) => {
  const today = getLocalTodayStr();
  const date = dateStr ?? today;

  const { theme, weight: currentWeight } = useAppStore();
  const db = useDBService();

  const [tempWeight, setTempWeight] = useState("");
  const [initialWeight, setInitialWeight] = useState<number | undefined>(
    weight ?? currentWeight ?? undefined,
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;

    let cancelled = false;

    const loadWeight = async () => {
      setLoading(true);

      try {
        const result = await getWeight(db, date);

        if (cancelled) return;

        const value =
          result?.weight != null ? result.weight : (currentWeight ?? undefined);

        setInitialWeight(value);
        setTempWeight(value != null ? String(value) : "");
      } catch (error) {
        if (cancelled) return;

        console.log("Error loading weight", error);

        const fallback = currentWeight ?? undefined;
        setInitialWeight(fallback);
        setTempWeight(fallback != null ? String(fallback) : "");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadWeight();

    return () => {
      cancelled = true;
    };
  }, [visible, date, db, currentWeight]);

  const weightError = checkWeightError(tempWeight);

  const handleSave = () => {
    if (loading || weightError) return;

    const trimmed = tempWeight.trim();
    const value = trimmed === "" ? null : Number(trimmed);

    if (value !== null && (!Number.isFinite(value) || value <= 0)) {
      return;
    }

    if (value === initialWeight) {
      setVisible(false);
      return;
    }

    onSave(value, date);
    setVisible(false);
  };

  const disabled = loading || !!weightError;

  return (
    <NoteModalShell
      visible={visible}
      setVisible={setVisible}
      title={date === today ? "Today Weight" : `Weight ${date}`}
      icon="weight-scale"
    >
      <View className="gap-y-4">
        <View
          className={`h-24 overflow-hidden rounded-2xl ${
            weightError
              ? "border border-error bg-error/10"
              : "border border-primary/20 bg-primary/10"
          }`}
        >
          <TextInput
            value={tempWeight}
            placeholder={initialWeight?.toString() ?? "0"}
            placeholderTextColor={`${theme.text}55`}
            onChangeText={setTempWeight}
            maxLength={6}
            keyboardType="decimal-pad"
            editable={!loading}
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
            className="absolute bottom-2 right-3"
          >
            kg
          </ThemedText>
        </View>

        {weightError ? (
          <ThemedText size="xxs" color="error">
            {weightError}
          </ThemedText>
        ) : null}

        <TouchableOpacity
          className={`flex-row items-center justify-center gap-x-2 px-4 py-2 rounded-lg bg-primary  ${
            disabled ? "bg-primary/40" : "bg-primary"
          }`}
          onPress={handleSave}
          disabled={disabled}
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
