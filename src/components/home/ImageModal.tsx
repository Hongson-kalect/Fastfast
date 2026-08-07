import { MaterialIcons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  LinearTransition,
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";

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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => setVisible(false)}
    >
      {/* Overlay nền mờ */}
      <Pressable
        className="flex-1 bg-gray-900/60 justify-end"
        onPress={() => setVisible(false)}
      >
        {/* Container nội dung đẩy từ dưới lên */}
        <Animated.View
          layout={LinearTransition.springify().duration(150).damping(80)}
          className="w-full p-4 pb-8 bg-gray-800 rounded-t-3xl"
          entering={SlideInDown.springify().damping(18).stiffness(180).mass(1)}
          exiting={SlideOutDown.duration(150)}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            {/* ─── PREVIEW ẢNH ĐANG CÓ ─── */}
            {photoUri && (
              <Animated.View
                entering={SlideInDown.duration(200)}
                className="aspect-2/3 rounded-2xl overflow-hidden mb-4 bg-black border border-gray-700 relative"
              >
                <Image
                  source={{ uri: photoUri }}
                  className="w-full h-full"
                  resizeMode="contain"
                />

                {/* Nút xóa ảnh nằm gọn trong Preview */}
                <TouchableOpacity
                  onPress={handleDeletePhoto}
                  className="absolute top-2 right-2 bg-red-600/80 p-3 rounded-full active:bg-red-700"
                >
                  <MaterialIcons name="delete" size={24} color="white" />
                </TouchableOpacity>
              </Animated.View>
            )}

            <Text className="text-gray-400 text-sm text-center mb-4 font-medium">
              {photoUri ? "Cập nhật ảnh" : "Thêm ảnh đáng nhớ hôm nay"}
            </Text>

            {/* ─── HÀNH ĐỘNG CHỌN ─── */}
            <View className="gap-3">
              {/* Chụp ảnh */}
              <TouchableOpacity
                onPress={handleTakePhoto}
                className="flex-row items-center justify-center h-14 rounded-xl gap-2 bg-primary active:opacity-80"
              >
                <MaterialIcons name="photo-camera" size={22} color="white" />
                <Text className="text-white font-semibold text-base">
                  Chụp ảnh mới
                </Text>
              </TouchableOpacity>

              {/* Chọn từ bộ sưu tập */}
              <TouchableOpacity
                onPress={handleSelectPhoto}
                className="flex-row items-center justify-center bg-gray-700 h-14 rounded-xl gap-2 active:bg-gray-600 border border-gray-600"
              >
                <MaterialIcons name="photo-library" size={22} color="white" />
                <Text className="text-white font-semibold text-base">
                  Chọn từ bộ sưu tập
                </Text>
              </TouchableOpacity>

              {/* Hủy đóng modal */}
              <TouchableOpacity
                onPress={() => setVisible(false)}
                className="flex-row items-center justify-center h-14 rounded-xl active:bg-gray-700/50"
              >
                <Text className="text-gray-400 font-medium text-base">
                  Hủy bỏ
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};
