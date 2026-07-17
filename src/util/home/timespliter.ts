interface DissectedDay {
  log_date: string; // Định dạng 'YYYY-MM-DD' theo múi giờ local
  hours_in_day: number; // Số giờ nhịn thuộc về ngày đó (Ví dụ: 4.5, 24, 12)
  elapsed_hours: number; // số giờ đã nhịn kể từ đầu phiên
}

export const splitSessionIntoDays = (
  startTimeMs: number,
  endTimeMs: number,
): DissectedDay[] => {
  const result: DissectedDay[] = [];

  // Tận dụng chính đối tượng Date của hệ thống để tự động map theo cấu hình Múi giờ (Local Timezone) của thiết bị
  let currentPtr = new Date(startTimeMs);
  const endLimit = new Date(endTimeMs);
  let timeleap = 0;

  while (currentPtr < endLimit) {
    // 1. Lấy chuỗi ngày YYYY-MM-DD của con trỏ hiện tại
    const year = currentPtr.getFullYear();
    const month = String(currentPtr.getMonth() + 1).padStart(2, "0");
    const day = String(currentPtr.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    // 2. Tính mốc mốc thời gian cuối cùng của ngày hiện tại (23:59:59.999)
    const endOfDay = new Date(
      year,
      currentPtr.getMonth(),
      currentPtr.getDate(),
      23,
      59,
      59,
      999,
    );

    // 3. Xác định điểm kết thúc của khúc nhịn ăn trong ngày này
    // Nếu điểm endLimit vượt quá ngày hôm nay -> Cắt ở cuối ngày. Nếu nằm trong ngày hôm nay -> Lấy endLimit.
    const chunkEnd = endLimit < endOfDay ? endLimit : endOfDay;

    // 4. Tính số giờ nhịn thực tế của khúc này (mili-giây -> giờ)
    const diffMs = chunkEnd.getTime() - currentPtr.getTime();
    const hoursInDay = Math.max(0, diffMs / (1000 * 60 * 60));
    timeleap += hoursInDay;

    // Đẩy kết quả của ngày này vào mảng
    result.push({
      log_date: dateStr,
      hours_in_day: parseFloat(hoursInDay.toFixed(2)), // Làm tròn 2 chữ số thập phân cho đẹp DB
      elapsed_hours: parseFloat(timeleap.toFixed(2)),
    });

    // 5. Nhảy con trỏ sang đúng 00:00:00 của ngày hôm sau để tiếp tục vòng lặp
    currentPtr = new Date(
      year,
      currentPtr.getMonth(),
      currentPtr.getDate() + 1,
      0,
      0,
      0,
      0,
    );
  }

  return result;
};
