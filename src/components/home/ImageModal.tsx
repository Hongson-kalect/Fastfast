import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import { MaterialIcons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  LinearTransition,
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";
import { ThemedText } from "../themed-text";

interface PhotoPickerModalProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  photoUri?: string; // Uri hiện tại truyền từ DB lên để hiển thị preview
  updateImage: (uri?: string) => void; // Hàm callback trả lại kết quả (uri mới hoặc null)
}

export const PhotoPickerModal = ({
  visible,
  setVisible,
  photoUri,
  updateImage,
}: PhotoPickerModalProps) => {
  const { theme } = useAppStore();
  // 1. Hàm xử lý lưu ảnh vĩnh viễn vào thư mục ứng dụng
  const saveImagePermanently = async (cacheUri: string) => {
    try {
      const filename = cacheUri.split("/").pop() ?? `${Date.now()}.jpg`;

      const file = new FileSystem.File(cacheUri);

      const imagesDir = new FileSystem.Directory(
        FileSystem.Paths.document,
        "images",
      );

      if (!imagesDir.exists) {
        imagesDir.create();
      }

      const destination = new FileSystem.File(imagesDir, filename);

      file.move(destination);

      updateImage(destination.uri);
    } catch (e) {
      console.log(e);
    }
  };

  // 2. Logic xử lý CHỤP ẢNH MỚI từ Camera
  const handleTakePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(
        "Quyền truy cập",
        "App cần quyền sử dụng Camera để chụp hình thể!",
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [9, 16], // Ép ảnh vuông
      quality: 0.7, // Nén ảnh nhẹ
    });

    if (!result.canceled && result.assets[0]) {
      await saveImagePermanently(result.assets[0].uri);
      setVisible(false);
    }
  };

  // 3. Logic xử lý CHỌN ẢNH có sẵn từ Thư viện (Gallery)
  const handleSelectPhoto = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(
        "Quyền truy cập",
        "App cần quyền truy cập bộ sưu tập để chọn ảnh!",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [2, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      await saveImagePermanently(result.assets[0].uri);
      setVisible(false);
    }
  };

  // 4. Logic xử lý XÓA ẢNH hiện tại
  const handleDeletePhoto = () => {
    Alert.alert(
      "Xóa ảnh",
      "Bạn có chắc chắn muốn xóa ảnh track hình thể của ngày hôm nay?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: () => {
            updateImage(undefined); // Truyền null báo hiệu xóa ảnh
            setVisible(false);
          },
        },
      ],
    );
  };

  const [previewVisible, setPreviewVisible] = useState(false);

  const openImagePreview = () => {
    if (!photoUri) return;
    setPreviewVisible(true);
  };

  const closeImagePreview = () => {
    setPreviewVisible(false);
  };

  const { addModal } = useModalStore();
  const handleAddPhoto = () => {
    addModal({
      type: "confirm",
      title: "Add Photo",
      okText: (
        <View className="flex-row items-center justify-center gap-2">
          <MaterialIcons name="photo-library" size={25} color={theme.text} />

          <ThemedText size="sm" weight="bold" color="text">
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => setVisible(false)}
    >
      <Pressable
        className="flex-1 justify-end bg-background/70"
        onPress={() => setVisible(false)}
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
                    {photoUri ? "Your photo" : "Add a photo"}
                  </ThemedText>

                  <ThemedText size="xxs" color="text" opacity="medium">
                    Hôm nay
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
                    source={{ uri: photoUri }}
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
                  Capture the moment
                </ThemedText>

                <ThemedText
                  size="xxs"
                  color="text"
                  opacity="low"
                  className="mt-1"
                >
                  Chọn camera hoặc thư viện
                </ThemedText>
              </Pressable>
            )}

            {/* Actions */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleTakePhoto}
                className="h-16 flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-text-base/10 bg-background"
              >
                <MaterialIcons
                  name="photo-camera"
                  size={25}
                  color={theme.text}
                />

                <ThemedText size="sm" weight="bold" color="text">
                  Camera
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleSelectPhoto}
                className="h-16 flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-primary"
              >
                <MaterialIcons
                  name="photo-library"
                  size={25}
                  color={theme.text}
                />

                <ThemedText size="sm" weight="bold" color="text">
                  Gallery
                </ThemedText>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};
