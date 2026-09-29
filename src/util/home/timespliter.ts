import { fixed } from "../numberLimit";

export interface DissectedDay {
  log_date: string; // Định dạng 'YYYY-MM-DD' theo múi giờ local
  hours_in_day: number; // Số giờ nhịn thuộc về ngày đó (Ví dụ: 4.5, 24, 12)
  elapsed_hours: number; // số giờ đã nhịn kể từ đầu phiên
  hours_in_fast: number;
  fast_id: string;
}

export const splitSessionIntoDays = (
  startTimeMs: number,
  endTimeMs: number,
  fast_id: string,
): DissectedDay[] => {
  const result: DissectedDay[] = [];

  if (endTimeMs <= startTimeMs) {
    return result;
  }

  const hoursInFast = (endTimeMs - startTimeMs) / 3_600_000;

  let currentPtr = new Date(startTimeMs);
  const endLimit = new Date(endTimeMs);

  while (currentPtr < endLimit) {
    const year = currentPtr.getFullYear();
    const month = currentPtr.getMonth();
    const day = currentPtr.getDate();

    const dateStr = [
      year,
      String(month + 1).padStart(2, "0"),
      String(day).padStart(2, "0"),
    ].join("-");

    // 00:00 của ngày kế tiếp
    const nextDay = new Date(
      year,
      month,
      day + 1,
      0,
      0,
      0,
      0,
    );

    const chunkEnd = endLimit < nextDay ? endLimit : nextDay;

    const hoursInDay =
      (chunkEnd.getTime() - currentPtr.getTime()) / 3_600_000;

    const elapsedHours =
      (chunkEnd.getTime() - startTimeMs) / 3_600_000;

    result.push({
      fast_id,
      log_date: dateStr,
      hours_in_day: fixed(hoursInDay),
      elapsed_hours: fixed(elapsedHours),
      hours_in_fast: fixed(hoursInFast),
    });

    currentPtr = nextDay;
  }

  return result;
};
