# FastFast — Việc cần làm tiếp theo

Tổng hợp từ các buổi thảo luận về cơ chế điểm, giữ chân người dùng và phát hành.
Trạng thái: `[ ]` chưa làm · `[~]` đang làm · `[x]` xong.

---

## 1. Sửa lỗi trong cơ chế điểm (ưu tiên cao)

- [x] **Retain tràn vòng bị mất phần dư** — giờ giữ phần dư, mỗi vòng đủ +1 shield.
- [x] **`saveStreakContext` thiếu cột** — trước đây chỉ lưu streak/ngày, nên `active_days`,
  `total_shield_*`, `full_habit_at` và **các cờ mốc shield (`low/mid/full_shield_clamable`)
  không bao giờ xuống DB**. Hậu quả: mỗi lần mở lại app, các mốc 35/70/100% lại nhận được
  shield. Đã lưu đủ.
- [x] **Penalty không áp dụng việc mở lại mốc** — `calculatePenaltyEffect` tính `lowClaimable…`
  nhưng không gán vào profile. Đã thêm `applyPenaltyClaimables` cho cả 2 luồng penalty.
- [x] **`total_shield_used` bị trừ thay vì cộng** trong `reconcileStreak` (`shieldDelta` âm). Đã dùng `Math.abs`.
- [x] **`full_habit_at`** được gán khi habit lần đầu chạm 100.
- [x] **`total_shield_wasted`** cộng phần shield vượt `SHIELD_LIMIT` (`wastedShield` trong reward).
- [ ] UI báo "Khiên đã đầy, +1 bị bỏ qua" dựa trên `wastedShield`.
- [ ] Xoá code chết trong `src/database/schema/user.ts`: `increaseStreak`, `gainShield`, `clearStreak` (không còn ai gọi).

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
Trạng thái: [x] đã áp dụng mục 1–5; mục 6 còn mở.

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

## 7. Achievement

- [x] Mở rộng mốc theo độ khó tăng dần (giữ nguyên id cũ để không mất tiến độ), thêm `retain_circles`.
- [x] Mốc vẫn được kiểm tra khi giá trị không đổi (mốc mới thấp hơn kỷ lục cũ sẽ mở ở phiên tiếp theo).
- [ ] `fastFailedCount` / `fastInvalidCount` không bao giờ được phát ra — chỉ `handleCompletedFast` trả `achievement`.
- Quyết định: **không tặng thưởng vật chất** (shield phải kiếm bằng habit; theme/icon pack để bán).
  Phần thưởng là ghi nhận:
  - [ ] Hình huy hiệu cho từng mốc (`AchievementItem.image`), tầng đồng/bạc/vàng/kim cương.
  - [ ] Profile: chọn tối đa 3 huy hiệu để trưng bày (key `achievement_showcase` trong `app_settings`).
  - [ ] Hiệu ứng ăn mừng khi claim; mốc hiếm có hiệu ứng riêng.
  - [ ] Hiện tỉ lệ/độ hiếm (VD "Top mốc khó") và ngày đạt được.
  - [ ] Ảnh chia sẻ huy hiệu / gắn huy hiệu trưng bày vào ảnh xuất Year in Pixels.
  - [ ] (Tuỳ chọn) khung avatar/viền profile độc quyền cho mốc lớn — không bán, không ảnh hưởng điểm.
- [ ] Mốc habit (10/30/50/70/100) lệch với mốc shield (35/70/100) — cân nhắc đồng bộ.
- [ ] Achievement cần input mới: khiên cứu streak (`shieldUsed`, phát từ luồng penalty),
  người quay lại (`comeback`), ghi cảm xúc/cân nặng (`noteCount`, `weightLogCount`), năm pixel đầy đủ.
- [ ] Phân tầng hiển thị (đồng/bạc/vàng/kim cương) theo vị trí mốc, và i18n tên/tiêu đề.

## 8. Kết quả giả lập 02/09 → 25/10/2026 (43 phiên, máy ảo)

### Bug logic
- [ ] **Nhập lùi phiên (long press) bị phạt ngay**: `reconcileStreak` và `calculatePenaltyEffect` tính khoảng nghỉ
  theo *hôm nay*, không theo ngày của phiên. Phiên 20→21/10 nhập lúc 26/10: +3.3 habit rồi bị phạt về 0,
  streak/max_streak không tăng. Cũng cho phép bắt đầu > `MAX_FAST_HOURS` trước (timer hiện 144h).
- [ ] **`addHabitLogs` kẹp `habit_delta` vào [0,100]** → log phạt luôn lưu 0 thay vì số âm.
- [ ] **Log dùng shield lưu `shield_delta = totalShieldGain` (0)** thay vì `-shieldUsed` → `getPixelShielLog`
  (lọc `shield_delta < 0`) không bao giờ thấy → Journey không hiện icon khiên ngày 22/09, 07–10/10.
- [ ] **Shield phiên dài quá gắt**: `floor(hours/24) - 1` → phiên "48h" thiếu vài giây (47.99h) không được shield.
- [ ] **Streak không nhất quán**: phiên đầu tiên +1, phiên đầu sau khi mất streak +2 (do `streak_date` = hôm qua).
- [ ] ResultModal hiện `+3.9%` khi habit 98.1 → 100 (thực tăng 1.9).
- [ ] FullHabitModal ("Đã hiểu") không thấy hiện khi chạm 100% ngày 16/10 — cần kiểm tra lại thủ công.
- [ ] `MIN_FAST_DURATION = 16h` tuyệt đối: 15h59 là thất bại; phiên thất bại không có phản hồi nào sau khi xác nhận.

### Đúng như thiết kế
- Nghỉ 06/09 không shield: habit −6, streak về 0. Nghỉ 22/09 có shield: shield −1, streak giữ.
- Mốc 35% (18/09), 70% (30/09), 100% (16/10) mỗi mốc +1 shield, cờ mốc lưu đúng sau khi app khởi động lại.
- Vắng 07–10/10 với 1 shield: phạt −8.6, retain về 0, mốc không mở lại (habit vẫn ≥ 70).
- Retain đủ vòng 23/10: +1 shield, giữ phần dư 2.3.

### UX
- [ ] Home không hiện streak; badge góc phải là habit % nhưng không có ký hiệu %.
- [ ] Achievement phải bấm "Nhận" từng mốc (sau 2 tháng có ~35 mốc chờ) → cần "Nhận tất cả"; "1 / 8 unlocked" dễ hiểu nhầm.
- [ ] Lịch sử Habit: phiên ở 100% hiện "Rest 0 days" và "—", không thấy retain tăng.
- [ ] Trộn ngôn ngữ: "Finish / This session will marked as FAILED", "Fast Completed!", "Set your current weight"…

## 9. Phát hành

- [ ] IAP thật cho premium/theme (hiện `togglePremium` chỉ đổi cờ trong DB).
- [ ] `saveToGallery` lưu thật (cần Development Build cho `expo-media-library`) + watermark.
- [ ] Sao lưu/khôi phục (export/import file hoặc Google Drive).
- [ ] Widget Android hiển thị bộ đếm.
- [ ] Đồng bộ cân nặng Health Connect.
- [ ] Cảnh báo an toàn khi đặt mục tiêu > 48h; disclaimer y tế (đã có trong onboarding, thêm vào Settings).
- [ ] `checkAndUpdateActiveTarget` chưa được gọi — mục tiêu cân nặng không tự cập nhật.
- [ ] Index `idx_theme_single_active ON theme(is_deleted)` là UNIQUE — có vẻ sai (bảng chưa dùng).
- [ ] i18n: `i18n` khởi tạo cứng `lng: "en"`; phần lớn text còn hard-code. Chuyển dần sang `useT`.
