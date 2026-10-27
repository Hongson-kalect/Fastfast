import { useAppStore } from "@/stores/appStore";
import { useEffect, useState } from "react";

/**
 * Số giây của phiên nhịn hiện tại, tự cập nhật mỗi giây khi đang nhịn.
 * Gọi trong component cần hiển thị để chỉ component đó render lại theo nhịp giây,
 * không kéo cả màn hình theo.
 */
export const useFastCounter = () => {
  const startTime = useAppStore(
    (state) => state.currentFastSession?.start_time ?? null,
  );
  const endTime = useAppStore(
    (state) => state.currentFastSession?.end_time ?? null,
  );
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    const tick = () => {
      if (!startTime) return setCounter(0);
      const end = endTime ?? Date.now();
      // Giờ bắt đầu ở tương lai (chỉnh giờ máy, đổi múi giờ) không được thành đếm ngược
      setCounter(Math.max(0, Math.floor((end - startTime) / 1000)));
    };

    tick();
    if (!startTime || endTime) return;

    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startTime, endTime]);

  return counter;
};
