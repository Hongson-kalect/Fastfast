import { useDBService } from "@/hooks/useDBService";
import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import { getContrastTextColor } from "@/utils/color";
import {
  deleteSavedImage,
  resolveImageUri,
  selectPhoto,
  takePhoto,
} from "@/utils/image";
import { getLocalTodayStr } from "@/utils/timer";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Image, Pressable, View } from "react-native";
import { Toast } from "toastify-react-native";
import { ThemedText } from "../themed-text";
import { DailyNoteModal } from "./modals/DailyNoteModal";
import { WeightModal } from "./modals/WeightModal";
import { useT } from "@/providers/Language";

export type ModalNote = {
  note?: string;
  weight?: number;
  image_uri?: string;
};
type Props = {
  note: ModalNote;
  updateSheetNote: (note: ModalNote) => void;
  date?: string;
};

export default function PixelDailyNote({
  note,
  updateSheetNote,
  date = getLocalTodayStr(),
}: Props) {
  const t = useT();
  const theme = useAppStore((state) => state.theme);
  const [weightModalVisible, setWeightModalVisible] = useState(false);
  const [noteModalVisible, setNoteModalVisible] = useState(false);

  const addModal = useModalStore((state) => state.addModal);
  const dbService = useDBService();

  const updateNote = async (noteText: string) => {
    await dbService.setDailyNote(undefined, noteText || "", undefined, date);
    updateSheetNote({ note: noteText });
  };

  const updateImage = async (uri: string | undefined) => {
    await dbService.setDailyNote(undefined, undefined, uri || null, date);

    if (!uri || uri !== note?.image_uri) {
      deleteSavedImage(note?.image_uri);
    }
    updateSheetNote({ image_uri: uri });
  };

  const updateWeight = async (weight: number) => {
    await dbService.updateWeight(weight, date);
    updateSheetNote({ weight });
  };

  const handleSelectPhoto = async () => {
    try {
      const uri = await selectPhoto();

      if (uri) {
        updateImage(uri);
      }
    } catch (error) {
      console.error("Lỗi chọn hoặc lưu ảnh:", error);
      Toast.show({
        type: "error",
        text1: t("term.error"),
        text2: t("image.saveError"),
        useModal: true,
      });
    }
  };

  const handleTakePhoto = async () => {
    try {
      const uri = await takePhoto();

      if (uri) {
        updateImage(uri);
      }
    } catch (error) {
      console.error("Lỗi chọn hoặc lưu ảnh:", error);
      Toast.show({
        type: "error",
        text1: t("term.error"),
        text2: t("image.saveError"),
        useModal: true,
      });
    }
  };

  const handleImagePress = () => {
    if (note?.image_uri) {
      addModal({
        type: "confirm",
        title: t("pixelDetail.updatePhoto"),
        okText: (
          <View className="flex-row items-center justify-center gap-2">
            <MaterialIcons
              name="photo-library"
              size={25}
              color={getContrastTextColor(theme.primary)}
            />

            <ThemedText
              size="sm"
              weight="bold"
              colorHex={getContrastTextColor(theme.primary)}
            >
              {t("pixelDetail.changePhoto")}
            </ThemedText>
          </View>
        ),
        cancelText: (
          <View className="flex-row items-center justify-center gap-2">
            <MaterialIcons name="delete" size={25} color={theme.text} />

            <ThemedText size="sm" weight="bold" color="text">
              {t("image.deleteTitle")}
            </ThemedText>
          </View>
        ),
        onOk: async () => {
          handleAddPhoto();
        },
        onCancel: async () => {
          await handleDeleteImage();
        },
      });
    } else {
      handleAddPhoto();
    }
  };

  const handleDeleteImage = async () => {
    addModal({
      type: "confirm",
      title: t("image.deleteTitle"),
      okText: (
        <View className="flex-row items-center justify-center gap-2">
          <MaterialIcons
            name="delete"
            size={25}
            color={getContrastTextColor(theme.primary)}
          />

          <ThemedText
            size="sm"
            weight="bold"
            colorHex={getContrastTextColor(theme.primary)}
          >
            {t("common.delete")}
          </ThemedText>
        </View>
      ),
      onOk: () => {
        deleteSavedImage(note?.image_uri);
        updateImage(undefined);
      },
    });
  };

  const handleAddPhoto = () => {
    addModal({
      type: "confirm",
      title: t("pixelDetail.photoFrom"),
      okText: (
        <View className="flex-row items-center justify-center gap-2">
          <MaterialIcons
            name="photo-library"
            size={25}
            color={getContrastTextColor(theme.primary)}
          />

          <ThemedText
            size="sm"
            weight="bold"
            colorHex={getContrastTextColor(theme.primary)}
          >
            {t("term.gallery")}
          </ThemedText>
        </View>
      ),
      cancelText: (
        <View className="flex-row items-center justify-center gap-2">
          <MaterialIcons name="photo-camera" size={25} color={theme.text} />

          <ThemedText size="sm" weight="bold" color="text">
            {t("term.camera")}
          </ThemedText>
        </View>
      ),
      onOk: () => {
        handleSelectPhoto();
      },
      onCancel: () => {
        handleTakePhoto();
      },
    });
  };

  return (
    <View className="gap-y-3">
      {/* Weight */}
      <Pressable
        onPress={() => setWeightModalVisible(true)}
        className="flex-row items-center justify-between rounded-2xl border border-text-base/10 bg-background2 p-4"
      >
        <View className="flex-row items-center gap-x-3">
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-warning/10">
            <Ionicons name="scale-outline" size={20} color={theme.warning} />
          </View>

          <View className="gap-y-1">
            <ThemedText size="sm" weight="semibold">
              {t("term.weight")}
            </ThemedText>

            <ThemedText size="xxs" color="text" opacity="medium">
              {note?.weight ? t("pixelDetail.weightHint") : t("pixelDetail.addWeight")}
            </ThemedText>
          </View>
        </View>

        <View className="flex-row items-baseline">
          <ThemedText
            size="xl"
            weight="bold"
            color={note?.weight ? "warning" : "text"}
            opacity={note?.weight ? undefined : "low"}
          >
            {note.weight || "—"}
          </ThemedText>

          <ThemedText size="xs" color="text" opacity="medium" className="ml-1">
            kg
          </ThemedText>

          <Ionicons
            name="chevron-forward"
            size={16}
            color={theme.text}
            style={{ opacity: 0.4, marginLeft: 8 }}
          />
        </View>
      </Pressable>

      {/* Daily note */}
      <Pressable
        onPress={() => setNoteModalVisible(true)}
        className="rounded-2xl border border-text-base/10 bg-background2 p-4"
      >
        <View className="mb-3 flex-row items-center justify-between">
          <View className="flex-row items-center gap-x-2">
            <Ionicons
              name="document-text-outline"
              size={17}
              color={theme.primary}
            />
            <ThemedText
              size="xxs"
              weight="semibold"
              color="text"
              opacity="medium"
              style={{ letterSpacing: 1.2 }}
            >
              {t("pixelDetail.dayNote")}
            </ThemedText>
          </View>

          <View className="flex-row items-center gap-x-1">
            <ThemedText size="xxs" color="primary" opacity="medium">
              {note?.note ? t("common.edit") : t("common.add")}
            </ThemedText>
            <Ionicons name="chevron-forward" size={14} color={theme.primary} />
          </View>
        </View>

        {note?.note?.trim() ? (
          <ThemedText size="sm" color="text" style={{ lineHeight: 24 }}>
            {note.note}
          </ThemedText>
        ) : (
          <View className="flex-row items-center gap-x-2 py-1">
            <Ionicons
              name="add-circle-outline"
              size={18}
              color={theme.text}
              style={{ opacity: 0.45 }}
            />
            <ThemedText
              size="xs"
              color="text"
              opacity="low"
              style={{ fontStyle: "italic" }}
            >
              {t("pixelDetail.notePlaceholder")}
            </ThemedText>
          </View>
        )}
      </Pressable>

      {/* Image */}
      <Pressable
        onPress={handleImagePress}
        className="rounded-2xl border border-text-base/10 bg-background2 p-4"
      >
        <View className="mb-3 flex-row items-center justify-between">
          <View className="flex-row items-center gap-x-2">
            <Ionicons name="image-outline" size={17} color={theme.primary} />
            <ThemedText
              size="xxs"
              weight="semibold"
              color="text"
              opacity="medium"
              style={{ letterSpacing: 1.2 }}
            >
              {t("pixelDetail.photos")}
            </ThemedText>
          </View>

          <View className="flex-row items-center gap-x-1">
            <ThemedText size="xxs" color="primary" opacity="medium">
              {note?.image_uri ? t("common.edit") : t("pixelDetail.addPhoto")}
            </ThemedText>
            <Ionicons name="chevron-forward" size={14} color={theme.primary} />
          </View>
        </View>

        {note?.image_uri ? (
          <View className="overflow-hidden rounded-xl bg-background">
            <Image
              source={{ uri: resolveImageUri(note.image_uri) ?? undefined }}
              className="aspect-9/16 w-full rounded-xl"
              resizeMode="cover"
            />
          </View>
        ) : (
          <View className="h-24 items-center justify-center gap-y-2 rounded-xl border border-dashed border-text-base/15 bg-background">
            <Ionicons
              name="cloud-upload-outline"
              size={25}
              color={theme.text}
              style={{ opacity: 0.45 }}
            />
            <ThemedText size="xxs" color="text" opacity="low">
              {t("pixelDetail.photoHint")}
            </ThemedText>
          </View>
        )}
      </Pressable>

      {/* Keep the modals mounted inside the screen */}
      <WeightModal
        visible={weightModalVisible}
        setVisible={setWeightModalVisible}
        weight={note?.weight}
        dateStr={date}
        onSave={(value, date) => {
          if (value) updateWeight(value);
          // Lưu hoặc xóa cân nặng của đúng ngày.
        }}
      />

      <DailyNoteModal
        visible={noteModalVisible}
        setVisible={setNoteModalVisible}
        dateStr={date}
        note={note?.note}
        onSave={(value, date) => {
          updateNote(value);
          // Chỉ cập nhật ghi chú.
        }}
      />

      {/* <PhotoPickerModal
        visible={imageModalVisible}
        setVisible={setImageModalVisible}
        photoUri={note?.image_uri}
        updateImage={(uri) => {
          
        }}/> */}
    </View>
  );
}
