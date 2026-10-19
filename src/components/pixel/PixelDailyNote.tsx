import { useDBService } from "@/hooks/useDBService";
import { DailyNote } from "@/interfaces/db.type";
import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import { getContrastTextColor } from "@/util/color";
import { getWeight } from "@/util/home/fast";
import { deleteSavedImage, selectPhoto, takePhoto } from "@/util/image";
import { getLocalTodayStr } from "@/util/timer";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Image, Pressable, View } from "react-native";
import { Toast } from "toastify-react-native";
import { ThemedText } from "../themed-text";
import { DailyNoteModal } from "./modals/DailyNoteModal";
import { WeightModal } from "./modals/WeightModal";

type Props = {
  note?: DailyNote | null;
  date?: string;
};

export default function PixelDailyNote({
  note,
  date = getLocalTodayStr(),
}: Props) {
  const { theme, weight } = useAppStore();
  const [weightModalVisible, setWeightModalVisible] = useState(false);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [modalNote, setModalNote] = useState({
    note: note?.note,
    weight: weight,
    image_uri: note?.image_uri,
    // log_date: note?.log_date,
  });

  const getActiveWeight = async () => {
    const weight = await getWeight(dbService, date);
    console.log("get weight", weight, date);

    console.log(weight?.weight);
    setModalNote((prev) => ({ ...prev, weight: weight ? weight.weight : 0 }));
  };

  useEffect(() => {
    console.log("component reload", weight, modalNote);
  }, [modalNote]);

  const { addModal } = useModalStore();
  const dbService = useDBService();

  const updateNote = async (noteText: string) => {
    await dbService.setDailyNote(
      undefined,
      noteText || "",
      undefined,
      note?.log_date,
    );
    setModalNote((prev) => ({ ...prev, note: noteText }));
  };

  const updateImage = async (uri: string | undefined) => {
    await dbService.setDailyNote(undefined, undefined, uri || null, date);
    if (!uri) {
      deleteSavedImage(note?.image_uri);
    }
    setModalNote({ ...modalNote, image_uri: uri });
  };

  const updateWeight = async (weight: number) => {
    await dbService.updateWeight(weight, date);
    setModalNote({ ...modalNote, weight });
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
        text1: "Lỗi",
        text2: "Không thể lưu ảnh!",
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
        text1: "Lỗi",
        text2: "Không thể lưu ảnh!",
        useModal: true,
      });
    }
  };

  const handleImagePress = () => {
    if (note?.image_uri) {
      addModal({
        type: "confirm",
        title: "Cập nhật ảnh",
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
              Đổi ảnh
            </ThemedText>
          </View>
        ),
        cancelText: (
          <View className="flex-row items-center justify-center gap-2">
            <MaterialIcons name="photo-camera" size={25} color={theme.text} />

            <ThemedText size="sm" weight="bold" color="text">
              Xóa ảnh
            </ThemedText>
          </View>
        ),
        onOk: () => {
          handleAddPhoto();
        },
        onCancel: () => {
          handleTakePhoto();
        },
      });
    } else {
      handleAddPhoto();
    }
  };

  const handleAddPhoto = () => {
    addModal({
      type: "confirm",
      title: "Thêm hình ảnh",
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
            Gallery
          </ThemedText>
        </View>
      ),
      cancelText: (
        <View className="flex-row items-center justify-center gap-2">
          <MaterialIcons name="photo-camera" size={25} color={theme.text} />

          <ThemedText size="sm" weight="bold" color="text">
            Camera
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

  useEffect(() => {
    getActiveWeight();
  }, []);

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
              Cân nặng
            </ThemedText>

            <ThemedText size="xxs" color="text" opacity="medium">
              {modalNote.weight ? "Nhấn để chỉnh sửa" : "Thêm cân nặng"}
            </ThemedText>
          </View>
        </View>

        <View className="flex-row items-baseline">
          <ThemedText
            size="xl"
            weight="bold"
            color={modalNote.weight ? "warning" : "text"}
            opacity={modalNote.weight ? undefined : "low"}
          >
            {modalNote.weight || "—"}
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
              GHI CHÚ TRONG NGÀY
            </ThemedText>
          </View>

          <View className="flex-row items-center gap-x-1">
            <ThemedText size="xxs" color="primary" opacity="medium">
              {modalNote?.note ? "Chỉnh sửa" : "Thêm"}
            </ThemedText>
            <Ionicons name="chevron-forward" size={14} color={theme.primary} />
          </View>
        </View>

        {modalNote?.note?.trim() ? (
          <ThemedText size="sm" color="text" style={{ lineHeight: 24 }}>
            {modalNote.note}
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
              size="sm"
              color="text"
              opacity="low"
              style={{ fontStyle: "italic" }}
            >
              Thêm ghi chú cho ngày này...
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
              HÌNH ẢNH
            </ThemedText>
          </View>

          <View className="flex-row items-center gap-x-1">
            <ThemedText size="xxs" color="primary" opacity="medium">
              {modalNote?.image_uri ? "Chỉnh sửa" : "Thêm ảnh"}
            </ThemedText>
            <Ionicons name="chevron-forward" size={14} color={theme.primary} />
          </View>
        </View>

        {modalNote?.image_uri ? (
          <View className="overflow-hidden rounded-xl bg-background">
            <Image
              source={{ uri: modalNote.image_uri }}
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
              Thêm hình ảnh cho ngày này
            </ThemedText>
          </View>
        )}
      </Pressable>

      {/* Keep the modals mounted inside the screen */}
      <WeightModal
        visible={weightModalVisible}
        setVisible={setWeightModalVisible}
        weight={modalNote.weight}
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
