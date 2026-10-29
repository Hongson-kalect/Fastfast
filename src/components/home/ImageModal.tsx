import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import { getContrastTextColor } from "@/utils/color";
import {
  deleteSavedImage,
  resolveImageUri,
  selectPhoto,
  takePhoto,
} from "@/utils/image";
import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Image,
  Pressable,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  LinearTransition,
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";
import AppModal from "../modals/AppModal";
import { ThemedText } from "../themed-text";
import { useDBService } from "@/hooks/useDBService";
import { useShallow } from "zustand/react/shallow";
import { useT } from "@/providers/Language";

interface PhotoPickerModalProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  photoUri?: string; // Tên file ảnh lưu trong DB, ghép đường dẫn khi hiển thị
  updateImage: (uri?: string) => void; // Hàm callback trả lại kết quả (uri mới hoặc null)
}

export const PhotoPickerModal = ({
  visible,
  setVisible,
  photoUri,
  updateImage,
}: PhotoPickerModalProps) => {
  const t = useT();
  const { theme, settings } = useAppStore(
    useShallow((state) => ({ theme: state.theme, settings: state.settings })),
  );
  // 1. Hàm xử lý lưu ảnh vĩnh viễn vào thư mục ứng dụng
  const handleSelectPhoto = async () => {
    try {
      const uri = await selectPhoto();

      if (uri) {
        updateImage(uri);
        setVisible(false);
      }
    } catch (error) {
      console.error("Lỗi chọn hoặc lưu ảnh:", error);
      addModal({
        type: "alert",
        title: t("term.error"),
        message: t("image.saveError"),
      });
    }
  };

  const dbService = useDBService()
  const addModal = useModalStore((state) => state.addModal);

  const handleTakePhoto = async () => {
    try {
      const uri = await takePhoto();

      if (uri) {
        updateImage(uri);
        setVisible(false);
      }
    } catch (error) {
      console.error("Lỗi chọn hoặc lưu ảnh:", error);
      addModal({
        type: "alert",
        title: t("term.error"),
        message: t("image.saveError"),
      });
    }
  };

  const handleDeletePhoto = () => {
    addModal({
      type: "confirm",
      title: t("image.deleteTitle"),
      message: t("image.deleteConfirm"),
      okText: t("common.delete"),
      cancelText: t("common.cancel"),
      onOk: async () => {
        try {
          await dbService.setDailyNote(undefined, undefined, null);
          // Chỉ xóa file nếu ảnh nằm trong document/images.
          deleteSavedImage(photoUri);

          // Cập nhật dữ liệu ảnh của ngày đang xem.
          updateImage(undefined);

          setVisible(false);
        } catch (error) {
          console.error("Lỗi xóa ảnh:", error);
          addModal({
            type: "alert",
            title: t("term.error"),
            message: t("image.deleteError"),
          });
        }
      },
    });
  };

  const [, setPreviewVisible] = useState(false);

  const openImagePreview = () => {
    if (!photoUri) return;
    setPreviewVisible(true);
  };

  const handleAddPhoto = () => {
    addModal({
      type: "confirm",
      title: t("image.addTitle"),
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

  const isDark = settings?.is_dark_mode ?? true;
  const backdropOpacity = isDark ? "70" : "75";

  return (
    <AppModal
      visible={visible}
      animationType="fade"
      onRequestClose={() => setVisible(false)}
    >
      <Pressable
        className="flex-1 justify-end"
        onPress={() => setVisible(false)}
        style={{
          backgroundColor: theme.text + backdropOpacity,
        }}
      >
        <Animated.View
          layout={LinearTransition.springify().duration(180).damping(80)}
          entering={SlideInDown.springify().damping(18).stiffness(180).mass(1)}
          exiting={SlideOutDown.duration(150)}
          className="w-full rounded-t-[32px] bg-background2 px-4 pb-8 pt-5"
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            {/* Header */}
            <View className="mb-5 flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View className="h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                  <MaterialIcons
                    name="photo-camera"
                    size={21}
                    color={theme.primary}
                  />
                </View>

                <View>
                  <ThemedText size="lg" weight="bold" color="title">
                    {photoUri ? t("image.yourPhoto") : t("image.addAPhoto")}
                  </ThemedText>

                  <ThemedText size="xxs" color="text" opacity="medium">
                    {t("common.today")}
                  </ThemedText>
                </View>
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

            {/* Preview */}
            {photoUri ? (
              <Animated.View
                entering={SlideInDown.duration(200)}
                className="relative mb-5 aspect-[3/4] overflow-hidden rounded-[28px] bg-background"
              >
                {/* Image preview */}
                <Pressable onPress={openImagePreview} className="h-full w-full">
                  <Image
                    source={{ uri: resolveImageUri(photoUri) ?? undefined }}
                    className="h-full w-full"
                    resizeMode="cover"
                  />

                  {/* Zoom hint */}
                  <View className="absolute bottom-3 left-3 h-9 w-9 items-center justify-center rounded-full bg-background/75">
                    <MaterialIcons
                      name="zoom-in"
                      size={19}
                      color={theme.text}
                    />
                  </View>
                </Pressable>

                {/* Delete */}
                <TouchableOpacity
                  hitSlop={8}
                  activeOpacity={0.8}
                  onPress={handleDeletePhoto}
                  className="absolute right-3 top-3 h-11 w-11 items-center justify-center rounded-full bg-background/80"
                >
                  <MaterialIcons
                    name="delete-outline"
                    size={23}
                    color={theme.error}
                  />
                </TouchableOpacity>
              </Animated.View>
            ) : (
              <Pressable
                onPress={handleAddPhoto}
                className="mb-5 aspect-[3/4] items-center justify-center overflow-hidden rounded-[28px] border border-dashed border-text-base/15 bg-background active:bg-text-base/5"
              >
                {/* <View className="mb-3 h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <MaterialIcons
                    name="add-a-photo"
                    size={30}
                    color={theme.primary}
                  />
                </View> */}

                <ThemedText size="sm" weight="semibold" color="text">
                  {t("image.capture")}
                </ThemedText>

                <ThemedText
                  size="xxs"
                  color="text"
                  opacity="low"
                  className="mt-1"
                >
                  {t("image.chooseSource")}
                </ThemedText>
              </Pressable>
            )}

            {/* Actions */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleTakePhoto}
                className="h-14 flex-1 flex-row items-center justify-center gap-2 rounded-full border border-text-base/10 bg-background"
              >
                <MaterialIcons
                  name="photo-camera"
                  size={25}
                  color={theme.text}
                />

                <ThemedText size="sm" weight="bold" color="text">
                  {t("term.camera")}
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleSelectPhoto}
                className="h-14 flex-1 flex-row items-center justify-center gap-2 rounded-full bg-primary"
              >
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
              </TouchableOpacity>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </AppModal>
  );
};
