/**
 * Báo khi mood của một ngày đổi. Module không import gì để lớp DB phát sự kiện
 * mà không phụ thuộc vào widget (widget tự đăng ký lắng nghe khi app chạy).
 */
type MoodListener = (date: string, level: number | null) => void;

const listeners = new Set<MoodListener>();

export const onMoodChange = (listener: MoodListener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const emitMoodChange = (date: string, level: number | null) => {
  listeners.forEach((listener) => listener(date, level));
};
