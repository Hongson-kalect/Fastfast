import { DailyNote } from "@/interfaces/db.type";
import { getLocalTodayStr } from "@/util/timer";
import { useState } from "react";
import { Image, Pressable, View } from "react-native";
import { ThemedText } from "../themed-text";
import { DailyNoteModal } from "./modals/DailyNoteModal";
import { MoodModal } from "./modals/MoodModal";
import { WeightModal } from "./modals/WeightModal";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  weight: number | null;
  note?: DailyNote | null;
  date?: string;
};

export default function PixelDailyNote({
  weight,
  note,
  date = getLocalTodayStr(),
}: Props) {
  const [weightModalVisible, setWeightModalVisible] = useState(false);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [moodModalVisible, setMoodModalVisible] = useState(false);

  return (
    <View className="gap-y-4">
      {/* Weight */}
      <View className="flex-row items-center gap-x-3">
        <View className="flex-1 flex-row items-center justify-between rounded-2xl border border-text-base/10 bg-background2 p-3.5">
          <ThemedText size="xs" weight="medium" color="text" opacity="medium">
            Cân nặng
          </ThemedText>

          <Pressable onPress={() => setWeightModalVisible(true)} className="flex-row items-baseline">
            <ThemedText size="lg" weight="bold" color="warning">
              {weight || "--"}
            </ThemedText>

            <ThemedText
              size="xs"
              color="text"
              opacity="medium"
              className="ml-0.5"
            >
              kg
            </ThemedText>
          </Pressable>
        </View>
      </View>

      {/* Note */}
      <View className="rounded-2xl border border-text-base/10 bg-background2 p-4">
      <View className = "flex-row items-center justify-between">

        <ThemedText
          size="xxs"
          weight="semibold"
          color="text"
          opacity="medium"
          className="mb-2.5"
          style={{ letterSpacing: 1.5 }}
        >
          GHI CHÚ TRONG NGÀY
        </ThemedText>
      </View>

      <Pressable onPress={() => setNoteModalVisible(true)}>
       <ThemedText>Edit</ThemedText>
      </Pressable>

        {note?.note ? (
          <ThemedText size="sm" color="text" style={{ lineHeight: 24 }}>
            {note.note}
          </ThemedText>
        ) : (
          <View className="py-2">
            <ThemedText
              size="sm"
              color="text"
              opacity="low"
              style={{ fontStyle: "italic" }}
            >
              Chưa có ghi chú nào được thêm.
            </ThemedText>
          </View>
        )}
      </View>

      {/* Image */}
      {note?.image_uri && (
        <View className="rounded-2xl border border-text-base/10 bg-background2 p-3">
          <ThemedText
            size="xxs"
            weight="semibold"
            color="text"
            opacity="medium"
            className="mb-2.5 ml-1"
            style={{ letterSpacing: 1.5 }}
          >
            HÌNH ẢNH
          </ThemedText>

          <View className="overflow-hidden rounded-xl bg-background">
            <Image
              source={{ uri: note.image_uri }}
              className="aspect-9/16 w-full rounded-xl"
              resizeMode="cover"
            />
          </View>
        </View>
      )}

      <WeightModal
        visible={weightModalVisible}
        setVisible={setWeightModalVisible}
        dateStr={date}
        onSave={(value, date) => {
          console.log("weight value", value, "date", date);
          // Lưu cân nặng cho đúng ngày.
        }}
      />

      <DailyNoteModal
        visible={noteModalVisible}
        setVisible={setNoteModalVisible}
        dateStr={date}
        note={note?.note}
        onSave={(value, date) => {
          console.log("note value", value, "date", date);

          // Chỉ cập nhật note.
        }}
      />
    </View>
  );
}
