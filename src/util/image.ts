
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { Alert } from "react-native";

/**
 * Lưu ảnh từ cache vào thư mục document/images.
 * Trả về URI mới nếu thành công.
 */
export const saveImagePermanently = async (
  cacheUri: string,
): Promise<string> => {
  const sourceFile = new FileSystem.File(cacheUri);

  const imagesDir = new FileSystem.Directory(
    FileSystem.Paths.document,
    "images",
  );

  if (!imagesDir.exists) {
    imagesDir.create({ intermediates: true, idempotent: true });
  }

  const originalName = cacheUri.split("/").pop() ?? "image.jpg";
  const extension = originalName.match(/\.[^.]+$/)?.[0] ?? ".jpg";

  // Tạo tên mới để tránh ghi đè ảnh đã lưu trước đó.
  const filename = `image_${Date.now()}${extension}`;
  const destination = new FileSystem.File(imagesDir, filename);

  sourceFile.move(destination);

  return destination.uri;
};

/**
 * Chụp ảnh bằng camera.
 * Trả về URI ảnh đã lưu, hoặc null nếu người dùng hủy.
 */
export const takePhoto = async (): Promise<string | null> => {
  const permission = await ImagePicker.requestCameraPermissionsAsync();

  if (!permission.granted) {
    Alert.alert(
      "Quyền truy cập",
      "App cần quyền sử dụng Camera để chụp ảnh!",
    );
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [9, 16],
    quality: 0.7,
  });

  if (result.canceled || !result.assets[0]) {
    return null;
  }

  return saveImagePermanently(result.assets[0].uri);
};

/**
 * Chọn ảnh từ thư viện.
 * Trả về URI ảnh đã lưu, hoặc null nếu người dùng hủy.
 */
export const selectPhoto = async (): Promise<string | null> => {
  const permission =
    await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    Alert.alert(
      "Quyền truy cập",
      "App cần quyền truy cập bộ sưu tập để chọn ảnh!",
    );
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [2, 3],
    quality: 0.7,
  });

  if (result.canceled || !result.assets[0]) {
    return null;
  }

  return saveImagePermanently(result.assets[0].uri);
};

/**
 * Xóa file ảnh do app lưu trong document/images.
 * Không xóa file nằm ngoài thư mục ảnh của app.
 */
export const deleteSavedImage = (uri?: string | null): void => {
  if (!uri) return;

  console.log("delete saved image", uri);

  const imagesDir = new FileSystem.Directory(
    FileSystem.Paths.document,
    "images",
  );

  const normalizedDir = imagesDir.uri.endsWith("/")
    ? imagesDir.uri
    : `${imagesDir.uri}/`;

  if (!uri.startsWith(normalizedDir)) return;

  const file = new FileSystem.File(uri);

  if (file.exists) {
    file.delete();
  }
};
