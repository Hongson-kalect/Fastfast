import * as Crypto from "expo-crypto";

export const uuidv7 = () => {
  // 1. Lấy timestamp hiện tại (mili giây)
  const timestamp = Date.now();

  // 2. Tạo 10 bytes ngẫu nhiên cho phần còn lại
  const randomBytes = Crypto.getRandomBytes(10);

  // 3. Chuyển timestamp thành hex (12 ký tự)
  let hex = timestamp.toString(16).padStart(12, "0");

  // 4. Thêm số 7 (Version 7)
  hex += "7";

  // 5. Thêm các bit ngẫu nhiên đã chuyển sang hex
  // Chúng ta sẽ lấy 3 ký tự ngẫu nhiên đầu tiên, sau đó là biến thể (variant), rồi phần còn lại
  const randomHex = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Cấu trúc chuẩn: 8-4-4-4-12
  // tttttttt-tttt-7rrr-vrrr-rrrrrrrrrrrr
  const part1 = hex.substring(0, 8);
  const part2 = hex.substring(8, 12);
  const part3 = "7" + randomHex.substring(0, 3);
  // Biến thể UUID (8, 9, a, hoặc b) - ở đây dùng '8' cho đơn giản
  const part4 = "8" + randomHex.substring(3, 6);
  const part5 = randomHex.substring(6, 18);

  return `${part1}-${part2}-${part3}-${part4}-${part5}`;
};
