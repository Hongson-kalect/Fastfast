import { Image, View } from "react-native";
import { ThemedText } from "../themed-text";
import { DailyNote } from "@/interfaces/db.type";

type Props = {
  weight: number | null;
  note?: DailyNote | null;
};

export default function PixelDailyNote({ weight, note }: Props) {
  return (
    <View className="gap-y-4">
      {/* Weight */}
      <View className="flex-row items-center gap-x-3">
        <View className="flex-1 flex-row items-center justify-between rounded-2xl border border-text-base/10 bg-background2 p-3.5">
          <ThemedText
            size="xs"
            weight="medium"
            color="text"
            opacity="medium"
          >
            Cân nặng
          </ThemedText>

          <View className="flex-row items-baseline">
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
          </View>
        </View>
      </View>

      {/* Note */}
      <View className="rounded-2xl border border-text-base/10 bg-background2 p-4">
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
    </View>
  );
}