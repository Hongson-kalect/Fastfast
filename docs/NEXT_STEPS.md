# FastFast — Việc cần làm tiếp theo

Tổng hợp từ các buổi thảo luận về cơ chế điểm, giữ chân người dùng và phát hành.
Trạng thái: `[ ]` chưa làm · `[~]` đang làm · `[x]` xong.

---

## 1. Sửa lỗi trong cơ chế điểm (ưu tiên cao)

- [ ] **Retain tràn vòng bị mất phần dư** — `calculateFastReward` (`src/database/schema/fast_sessions.ts`)
  đặt `newRetain = 1` khi đủ `RETAIN_LIMIT`. Phải là `newRetain - RETAIN_LIMIT` để giữ phần dư
  và không "tặng" 1 điểm.
- [ ] **`total_shield_clamable` không được lưu** — chỉ cộng trong RAM ở `applyShieldReward`
  (`src/utils/streak.ts`), `saveStreakContext` không ghi cột này. Hoặc lưu xuống DB, hoặc bỏ cột.
- [ ] **`full_habit_at` không bao giờ được gán** — gán ngày khi `newHabitScore` lần đầu chạm 100.
- [ ] **`total_shield_wasted` không được cập nhật** — khi shield nhận được vượt `SHIELD_LIMIT`,
  cộng phần thừa vào cột này và báo cho user ("Khiên đã đầy, +1 bị bỏ qua").

### Giữ nguyên (đã thống nhất)
- Mốc shield mở lại khi habit tụt: 100% mở lại khi < 70, 70% khi < 35, 35% khi về 0.
- Retain bị xoá sạch khi có ngày nghỉ bị phạt — retain đo việc *duy trì liên tục*.
- Điểm habit tăng tuyến tính theo số giờ nhịn (nhịn càng lâu lợi ích càng nhiều).
- Shield từ phiên dài (≥ 48h) = ngày nghỉ hồi phục sau phiên dài.
- Habit về 0 sau ~2 tuần nghỉ.

---

## 2. Mở khoá dần các chỉ số (thân thiện với người mới)

Mục tiêu: 12 ngày đầu user chỉ cần hiểu **streak + habit**. Shield và retain xuất hiện
đúng lúc user nhận được chúng lần đầu.

### Lưu trạng thái
Key `feature_unlocks` trong bảng `app_settings` (key-value, không cần migration):

```json
{
  "habit":  { "unlockedAt": 1761400000, "seen": true },
  "shield": { "unlockedAt": 1762300000, "seen": false },
  "retain": null
}
```

### Điều kiện mở khoá (ghi trong `handleCompletedFast`, sau khi tính `reward`)
| Tính năng | Điều kiện |
|---|---|
| `habit` | Phiên `completed` đầu tiên |
| `shield` | Lần đầu `totalShieldGain > 0` — **bất kể nguồn** (phiên dài, mốc, retain). VD nhịn 48h ngay lần đầu → mở shield dù habit mới ~9% |
| `retain` | Lần đầu `newHabitScore >= 100` |

- Mở khoá là **vĩnh viễn**, habit tụt cũng không ẩn lại.
- UI: `unlocked` → hiển thị; `unlocked && !seen` → bật modal giới thiệu, đóng modal thì `seen = true`.
- **Backfill cho user cũ** (chạy 1 lần khi key chưa tồn tại), suy ra từ `habit_logs`:
  `habit` = có log; `shield` = tồn tại `shield_delta > 0`; `retain` = `MAX(habit_snap) >= 100`.
  Các mục suy ra được đánh dấu `seen: true` để không bắn modal hàng loạt.

### Hiển thị & tên gọi
- Home: 1 con số chính (streak) + 0–3 icon khiên nhỏ cạnh streak + vòng/mực nước habit (`Waterball`).
  Retain là lớp sáng/vòng thứ hai, chỉ hiện khi đã mở khoá.
- Tên: Habit → "Độ bền thói quen", Shield → "Khiên" (phụ đề "= 1 ngày nghỉ"),
  Retain → "Duy trì", shield từ phiên dài → "Ngày hồi phục".
- Retain bị xoá: hiển thị như thành tích kết thúc ("Chuỗi duy trì: 8 lần"), không hiện "−24 điểm".
- ResultModal sau phiên ≥ 48h: ghi rõ "Bạn nhận 1 ngày hồi phục".
- Settings: trang "Cách tính điểm" có ví dụ cụ thể.

---

## 3. Chào đón người quay lại

- [ ] Lấy đỉnh habit cũ bằng `MAX(habit_snap)` trên `habit_logs` (chưa cần cột mới).
- [ ] Khi habit hiện tại thấp hơn nhiều so với đỉnh cũ: nhân **×1.5** `habitDelta`
  cho tới khi lấy lại ~50% đỉnh cũ.
- [ ] Modal khi quay lại: "Chào mừng trở lại! Cơ thể bạn vẫn nhớ — thói quen sẽ hồi phục nhanh hơn."
  Không dùng câu kiểu "Bạn đã mất hết".

---

## 4. Thông báo (chưa làm — ảnh hưởng giữ chân lớn nhất)

Cần `expo-notifications` (đọc docs SDK 56 trước khi code).
- [ ] Nhắc khi đạt mục tiêu nhịn (lên lịch lúc bắt đầu phiên, huỷ khi kết thúc sớm).
- [ ] Nhắc cuối ngày nếu chưa nhịn: "Hôm nay nghỉ sẽ dùng 1 khiên (còn 2)" / "Streak 12 ngày sắp mất".
- [ ] Cho phép tắt/chọn giờ trong Settings (key `notification_time` đã dự kiến trong `app_settings`).

---

## 5. Onboarding lần đầu

- [x] 4 trang giới thiệu + lời nhắc sức khoẻ, hiển thị một lần (`src/app/onboarding.tsx`).
  Gate bằng `Stack.Protected` trong `src/app/_layout.tsx`, cờ `onboarding_done` trong `app_settings`.
  User cũ (đã có phiên nhịn) bỏ qua tự động.
- [ ] Bước chọn mục tiêu nhịn mặc định (16:8, 18:6, OMAD…) — nối với `TargetSheet` khi luồng chọn
  target ổn định.
- [ ] Bổ sung ảnh minh hoạ/animation thật cho từng trang (hiện dùng icon).

---

## 6. Trang Pixel — lỗi khi đổi chiều dọc/ngang

`src/app/(tabs)/pixel.tsx` dùng **một** `SectionList` và đổi prop `horizontal` theo
`pixel_view_orientation`. Các vấn đề:

| # | Vấn đề | Hậu quả |
|---|---|---|
| A | Đổi `horizontal` trên cùng một instance list. VirtualizedList không hỗ trợ đổi trục sau khi mount (giữ offset, cache layout cũ) | Đổi chiều xong list nhảy vị trí, render thiếu/khoảng trắng |
| B | `stickySectionHeadersEnabled` dùng `stickyHeaderIndices`, **không hỗ trợ khi `horizontal`** | Ở chế độ ngang cột Mon…Sun trôi đi theo scroll |
| C | `getItemLayout` dùng `ITEM_HEIGHT = 40` cố định, trong khi item thật dài `pixelSize + gap`; ngoài ra index của `SectionList.getItemLayout` **tính cả section header** | `scrollToLocation` tới tuần hiện tại lệch, lệch càng xa càng nhiều; khác nhau theo kích thước màn hình |
| D | `handleScroll` chỉ đọc `contentOffset.y` và so với `height` | Ở chế độ ngang nút cuộn không bao giờ hiện; icon vẫn là mũi tên lên/xuống |
| E | Auto-scroll tới tuần hiện tại chỉ chạy khi mount (setTimeout 500ms) | Đổi chiều xong không cuộn lại tuần hiện tại |
| F | `contentContainerStyle.gap: 2` và `contentContainerClassName="gap-1"` cùng lúc | Khoảng cách không rõ cái nào thắng, và không nằm trong `getItemLayout` |
| G | `currentWeekY = getWeek(new Date()) - 4` dùng tuần bắt đầu Chủ nhật (date-fns mặc định), grid bắt đầu Thứ 2, và không phụ thuộc năm đang xem | Lệch 1 tuần quanh Chủ nhật; xem năm khác vẫn cuộn tới "tuần hiện tại" |

### Đề xuất hoàn thiện
1. **Thay `SectionList` bằng `FlatList`, đưa nhãn thứ ra ngoài list** (không cần sticky):
   - Dọc: `[hàng Week | Mon…Sun]` cố định phía trên, `FlatList` dọc bên dưới.
   - Ngang: `View flex-row` gồm `[cột Week/Mon…Sun cố định] [FlatList horizontal]`.
2. **`key={orientation}`** trên `FlatList` để remount sạch khi đổi chiều.
3. **Kích thước item chính xác**:
   ```ts
   const DAY_GAP = 4;
   const ITEM_LENGTH = pixelSize + DAY_GAP; // chiều cao (dọc) hoặc chiều rộng (ngang)
   getItemLayout={(_, index) => ({ length: ITEM_LENGTH, offset: ITEM_LENGTH * index, index })}
   ```
   Khoảng cách đặt bằng `marginBottom`/`marginRight: DAY_GAP` trong item, bỏ `gap` ở content container.
   Lưu ý ở chế độ ngang item còn có nhãn tuần `h-12` phía trên — không ảnh hưởng vì trục cuộn là ngang.
4. **Tuần hiện tại lấy từ chính grid**:
   ```ts
   const currentWeekIndex = gridData.findIndex((w) => w.days.some((d) => d.dateString === todayStr));
   ```
   Dùng `initialScrollIndex={Math.max(0, currentWeekIndex - 3)}` (chỉ khi xem năm hiện tại) thay cho setTimeout.
5. **Scroll handler theo trục**: `offset = horizontal ? x : y`, `viewport = horizontal ? width : height`;
   icon đổi thành `arrow-left` / `arrow-right` ở chế độ ngang. Nút "về tuần hiện tại" dùng `scrollToIndex`.
6. Kiểm tra `pixelSize` ở chế độ ngang: `7 * ITEM_LENGTH + 48` (nhãn tuần) phải ≤ chiều cao vùng hiển thị;
   nếu không, tính `pixelSize` theo chiều cao thay vì chiều rộng.

---

## 7. Phát hành

- [ ] IAP thật cho premium/theme (hiện `togglePremium` chỉ đổi cờ trong DB).
- [ ] `saveToGallery` lưu thật (cần Development Build cho `expo-media-library`) + watermark.
- [ ] Sao lưu/khôi phục (export/import file hoặc Google Drive).
- [ ] Widget Android hiển thị bộ đếm.
- [ ] Đồng bộ cân nặng Health Connect.
- [ ] Cảnh báo an toàn khi đặt mục tiêu > 48h; disclaimer y tế (đã có trong onboarding, thêm vào Settings).
- [ ] `checkAndUpdateActiveTarget` chưa được gọi — mục tiêu cân nặng không tự cập nhật.
- [ ] Index `idx_theme_single_active ON theme(is_deleted)` là UNIQUE — có vẻ sai (bảng chưa dùng).
- [ ] i18n: `i18n` khởi tạo cứng `lng: "en"`; phần lớn text còn hard-code. Chuyển dần sang `useT`.
