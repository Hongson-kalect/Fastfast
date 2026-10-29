# FastFast — Việc cần làm tiếp theo

Trạng thái: `[ ]` chưa làm · `[~]` đang làm / làm một phần · `[x]` xong · `[?]` chưa kiểm lại.
Cập nhật 28/10/2026 bằng cách đối chiếu với code; các mục đã xong từ trước được gom gọn ở cuối.

---

## 1. Trước khi phát hành trên Google Play (ưu tiên cao)

### Tài khoản & cửa hàng
- [ ] Đăng ký Play Console (tài khoản cá nhân), xác minh danh tính.
- [ ] Closed test: tối thiểu **12 người thử opt-in liên tục 14 ngày** rồi mới xin được production.
  Muốn lên Play đầu tháng 12 thì closed test phải chạy từ khoảng 10/11.
- [ ] Landing page + **privacy policy URL** (app dùng Google Sign-In, Google Drive, camera/ảnh).
- [ ] Khai báo Data safety, Health apps declaration, phân loại nội dung.
- [ ] Ảnh chụp màn hình, feature graphic, mô tả (ít nhất en + vi).

### App
- [ ] Icon app + splash (đang là mẫu Expo); thêm icon thông báo cho `expo-notifications`.
- [ ] Ký bản production: AAB qua EAS (`eas build -p android --profile production`) hoặc upload key riêng.
  Bản release trong `android/` hiện ký bằng debug keystore.
- [x] Tên app "FastFast"; chặn quyền thừa (ghi âm, overlay, đọc media, foreground service phát nhạc)
  trong `app.json`. Chọn ảnh dùng trình chọn ảnh hệ thống trên Android 13+.
- [ ] Gỡ/ẩn đồ giả lập mua hàng trong `ThemeBottomSheet` (modal "Giả định", nút "Be premium", gỡ theme đã mua).
- [ ] Quyết định bản đầu có bán Pro không: có → IAP thật (RevenueCat); không → ẩn/mở theme premium.
- [ ] `FEEDBACK_EMAIL` trong Settings đang trống.
- [ ] Google Sign-In: tạo OAuth client (SHA-1 của debug, upload key và khoá ký của Play).
- [ ] Thử trên máy thật: thông báo (đạt mục tiêu, nhắc hằng ngày), đăng nhập Google + sao lưu Drive,
  chọn huy hiệu trưng bày khi đã có mốc thật.

---

## 2. Lỗi / thiếu sót còn mở (đã đối chiếu code)

- [ ] UI báo "Khiên đã đầy, +1 bị bỏ qua": `wastedShield` đã tính ở DB nhưng chưa hiện ở đâu.
- [ ] `checkAndUpdateActiveTarget` chưa được gọi → mục tiêu cân nặng không tự cập nhật.
- [ ] Index `idx_theme_single_active ON theme(is_deleted)` là UNIQUE, có vẻ sai (bảng `theme` chưa dùng).
- [ ] Achievement: chưa có "Nhận tất cả", chưa có hiệu ứng ăn mừng khi nhận mốc.
- [ ] Onboarding chưa có bước chọn mục tiêu nhịn mặc định.
- [?] Các lỗi từ đợt giả lập 02/09 → 25/10, chưa kiểm lại sau các lần sửa:
  - Streak: phiên đầu +1, phiên đầu sau khi mất streak +2.
  - ResultModal hiện `+3.9%` khi habit 98.1 → 100.
  - Badge shield trong StreakCheckModal hiện "0 -2 /".
  - FullHabitModal không hiện khi chạm 100%.
  - Bắt đầu lùi > `MAX_FAST_HOURS` vẫn được (timer hiện 144h).
- [?] Pixel: kiểm tra `pixelSize` ở chế độ ngang (`7 * ITEM_LENGTH + 48` ≤ chiều cao vùng hiển thị).

---

## 3. Sau khi phát hành (tuỳ chọn)

- [ ] Mở khoá dần chỉ số (habit → shield → retain) bằng key `feature_unlocks`, kèm modal giới thiệu.
- [ ] Chào đón người quay lại: nhân ×1.5 `habitDelta` tới ~50% đỉnh habit cũ (`MAX(habit_snap)`).
- [ ] Achievement cần input mới: `shieldUsed`, `comeback`, `noteCount`, `weightLogCount`.
- [ ] Đồng bộ cân nặng Health Connect.
- [ ] Effect theme cho các tab/sheet khác ngoài Home (cơ chế slot trong `src/components/effect`).

### Giữ nguyên (đã thống nhất)
- Mốc shield mở lại khi habit tụt: 100% mở lại khi < 70, 70% khi < 35, 35% khi về 0.
- Retain bị xoá sạch khi có ngày nghỉ bị phạt — retain đo việc *duy trì liên tục*.
- Điểm habit tăng tuyến tính theo số giờ nhịn.
- Shield từ phiên dài (≥ 48h) = ngày nghỉ hồi phục sau phiên dài (cho hụt 15 phút).
- Habit về 0 sau ~2 tuần nghỉ.
- Achievement không tặng thưởng vật chất; phần thưởng là ghi nhận (huy hiệu, trưng bày).
- Phiên dưới 1 giờ bị xoá, 1–16 giờ là "bị gián đoạn", từ 16 giờ là hoàn thành.
- Theme limited lặp hằng năm; hết dịp mà chưa mua thì tự đổi về theme trước đó / mặc định kèm thông báo.

---

## Đã xong

- Cơ chế điểm: retain giữ phần dư, `saveStreakContext` lưu đủ cột, penalty mở lại mốc,
  `total_shield_used`/`wasted`, `full_habit_at`, nhập lùi phiên, `habit_delta` âm, log dùng shield.
- Code chết trong `user.ts` (`increaseStreak`, `gainShield`, `clearStreak`) đã xoá.
- Thông báo đạt mục tiêu + nhắc hằng ngày, chỉnh trong Settings.
- Onboarding 4 trang + lời nhắc sức khoẻ; disclaimer sức khoẻ trong Settings.
- Pixel: chuyển sang `FlatList`, 4 bố cục, cuộn tới tuần hiện tại.
- Achievement: mốc mở rộng, huy hiệu theo tầng, trưng bày tối đa 3 huy hiệu (cả trong ảnh xuất).
- Lưu ảnh vào thư viện, widget Android, sao lưu/khôi phục Google Drive.
- i18n 10 ngôn ngữ.
- Theme limited Christmas, icon pack Giáng sinh, effect theo slot (nút, thanh tab, tuyết rơi thưa, chạm).
