# FastFast — Định hướng thiết kế UI

## 1. Người dùng & hành vi

**Ai dùng**: 18–35 tuổi, Việt Nam/Đông Nam Á, muốn giảm cân hoặc "sống khoẻ" nhưng không thích app sức khoẻ
khô khan. Quen với app dễ thương có gamification (Duolingo, Finch, Daylio).

**Dùng thế nào**
| Thời điểm | Hành động | Thời lượng | Cần gì |
|---|---|---|---|
| Tối, sau bữa cuối | Bấm **Bắt đầu** | 3–5 giây | Một nút to, rõ, bấm bằng ngón cái |
| Trong ngày (3–6 lần) | Liếc xem còn bao lâu, đang ở giai đoạn nào | 2–10 giây | Thời gian + giai đoạn đọc được ngay |
| Lúc đạt mục tiêu | Bấm **Kết thúc**, xem thưởng | 10–30 giây | Cảm giác ăn mừng, thấy tiến bộ |
| Cuối tuần | Xem Journey, Dashboard, thành tích | 1–3 phút | Thứ đẹp để khoe, cảm giác sưu tầm |

**Hệ quả thiết kế**
- Home = **một màn hình, một hành động chính**. Đồng hồ là nhân vật chính, nút Bắt đầu/Kết thúc ở vùng ngón cái.
- Thông tin "đang ở đâu" (giai đoạn cơ thể, % mục tiêu) phải đọc được trong 1 giây → màu theo giai đoạn.
- Phần thưởng (streak, khiên, thành tích) phải **nhìn thấy được** trên Home, không giấu trong Dashboard.
- Dùng nhiều vào buổi tối → dark mode là mặc định, tương phản dịu, không dùng trắng tinh trên nền đen.

## 2. Tính cách thương hiệu

**"Ember"** — ấm, có năng lượng, thân thiện. Nhịn ăn = đốt cháy, ngọn lửa streak, ánh sáng của một ngày mới.
Không y khoa, không lạnh lùng.

- Bo góc lớn, mềm (card 24–28, nút dạng viên thuốc).
- Gradient cam → hồng làm điểm nhấn hành động; màu giai đoạn cơ thể làm màu thông tin.
- Nền xanh than ấm thay cho xám trung tính.
- Chữ: **Mulish** (đã có trong assets, hỗ trợ tiếng Việt), số dùng tabular để đồng hồ không nhảy.

## 3. Design tokens

| Token | Giá trị |
|---|---|
| Radius | `sm 12` · `md 18` · `lg 24` · `xl 32` · `pill 999` |
| Khoảng cách | bội số 4: `4 8 12 16 20 24 32` · lề màn hình 20 |
| Màu nhấn | `primary` (ember) → `tertiary` (rose) gradient |
| Màu giai đoạn | Glucose xanh lá · Fat burning cam · Growth hormone xanh dương · Ketosis tím · Autophagy hồng |
| Bóng | Chỉ cho phần tử nổi (tab bar, nút chính): màu primary, độ mờ thấp |

## 4. Bố cục từng màn

- **Tab bar**: thanh nổi bo tròn ở đáy, icon + nhãn nhỏ, tab đang chọn có nền nhấn.
- **Home**: lời chào + streak/khiên dạng pill → card hero chứa vòng tròn (gradient theo giai đoạn hiện tại,
  vệt sáng dịu cùng tông) → hàng hành động [ảnh] [**Bắt đầu / Kết thúc**] [ghi chú] → giai đoạn cơ thể.
- **Dashboard**: card streak lớn có gradient ở đầu → lưới số liệu → biểu đồ → phân bố.
- **Journey**: giữ lưới pixel, chip thống kê đồng tông, bo góc.
- **Achievement**: màu theo tầng (đồng/bạc/vàng/kim cương) theo vị trí mốc đã đạt.
- **Settings**: nhóm card bo tròn, icon trong ô màu nhạt.
