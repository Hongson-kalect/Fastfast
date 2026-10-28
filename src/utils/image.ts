import * as FileSystem from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as MediaLibrary from "expo-media-library";
import * as ImagePicker from "expo-image-picker";
import i18n from "i18next";
import { Alert } from "react-native";

/**
 * Lưu ảnh (file URI trong cache) vào thư viện ảnh của máy.
 * Chỉ xin quyền ghi ảnh; cần Development Build (Expo Go Android không hỗ trợ).
 */
export const saveToGallery = async (cacheUri: string): Promise<boolean> => {
  try {
    const permission = await MediaLibrary.requestPermissionsAsync(true, [
      "photo",
    ]);
    if (!permission.granted) {
      Alert.alert(i18n.t("common.permission"), i18n.t("perm.saveImage"));
      return false;
    }

    await MediaLibrary.Asset.create(cacheUri);
    return true;
  } catch (error) {
    console.error("Lỗi khi lưu ảnh vào Gallery:", error);
    Alert.alert(i18n.t("common.error"), i18n.t("perm.saveFailed"));
    return false;
  }
};

// Ảnh ghi chú chỉ xem trên điện thoại: cạnh dài 1080px là đủ nét
const MAX_IMAGE_EDGE = 1080;
const IMAGE_QUALITY = 0.6;

/**
 * Thu nhỏ ảnh (cạnh dài tối đa 1080px) và nén sang WebP để giảm dung lượng
 * lưu trên máy và khi sao lưu. Trả về URI file WebP trong cache.
 */
const compressImage = async (
  asset: ImagePicker.ImagePickerAsset,
): Promise<string> => {
  const context = ImageManipulator.manipulate(asset.uri);

  if (Math.max(asset.width, asset.height) > MAX_IMAGE_EDGE) {
    context.resize(
      asset.width >= asset.height
        ? { width: MAX_IMAGE_EDGE, height: null }
        : { width: null, height: MAX_IMAGE_EDGE },
    );
  }

  const image = await context.renderAsync();
  const result = await image.saveAsync({
    format: SaveFormat.WEBP,
    compress: IMAGE_QUALITY,
  });

  return result.uri;
};

// Thư mục ảnh của app. Đường dẫn tuyệt đối đổi theo máy/lần cài,
// nên DB chỉ lưu tên file và ghép với thư mục này khi cần dùng.
export const getImagesDir = () =>
  new FileSystem.Directory(FileSystem.Paths.document, "images");

/** Tên file từ giá trị đã lưu (tên file, hoặc đường dẫn tuyệt đối kiểu cũ). */
export const toImageName = (stored: string) =>
  stored.split("/").pop() ?? stored;

/** URI hiển thị của ảnh đã lưu trong DB; null nếu không có ảnh. */
export const resolveImageUri = (stored?: string | null): string | null => {
  if (!stored) return null;
  return new FileSystem.File(getImagesDir(), toImageName(stored)).uri;
};

/**
 * Lưu ảnh từ cache vào thư mục document/images.
 * Trả về tên file để lưu vào DB.
 */
export const saveImagePermanently = async (
  cacheUri: string,
): Promise<string> => {
  const sourceFile = new FileSystem.File(cacheUri);

  const imagesDir = getImagesDir();

  if (!imagesDir.exists) {
    imagesDir.create({ intermediates: true, idempotent: true });
  }

  const originalName = cacheUri.split("/").pop() ?? "image.jpg";
  const extension = originalName.match(/\.[^.]+$/)?.[0] ?? ".jpg";

  // Tạo tên mới để tránh ghi đè ảnh đã lưu trước đó.
  const filename = `image_${Date.now()}${extension}`;
  const destination = new FileSystem.File(imagesDir, filename);

  sourceFile.move(destination);

  return filename;
};

/**
 * Chụp ảnh bằng camera.
 * Trả về tên file ảnh đã lưu, hoặc null nếu người dùng hủy.
 */
export const takePhoto = async (): Promise<string | null> => {
  const permission = await ImagePicker.requestCameraPermissionsAsync();

  if (!permission.granted) {
    Alert.alert(i18n.t("common.permission"), i18n.t("perm.camera"));
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [9, 16],
    // Nén một lần duy nhất ở compressImage
    quality: 1,
  });

  if (result.canceled || !result.assets[0]) {
    return null;
  }

  return saveImagePermanently(await compressImage(result.assets[0]));
};

/**
 * Chọn ảnh từ thư viện.
 * Trả về tên file ảnh đã lưu, hoặc null nếu người dùng hủy.
 */
export const selectPhoto = async (): Promise<string | null> => {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    Alert.alert(i18n.t("common.permission"), i18n.t("perm.gallery"));
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [2, 3],
    // Nén một lần duy nhất ở compressImage
    quality: 1,
  });

  if (result.canceled || !result.assets[0]) {
    return null;
  }

  return saveImagePermanently(await compressImage(result.assets[0]));
};

/**
 * Xóa file ảnh do app lưu trong document/images.
 * Nhận giá trị lưu trong DB; chỉ xoá trong thư mục ảnh của app.
 */
export const deleteSavedImage = (stored?: string | null): void => {
  if (!stored) return;

  const file = new FileSystem.File(getImagesDir(), toImageName(stored));

  if (file.exists) {
    file.delete();
  }
};
