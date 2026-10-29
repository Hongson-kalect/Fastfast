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
  const compute = () => {
    if (!startTime) return 0;
    const end = endTime ?? Date.now();
    // Giờ bắt đầu ở tương lai (chỉnh giờ máy, đổi múi giờ) không được thành đếm ngược
    return Math.max(0, Math.floor((end - startTime) / 1000));
  };

  const [counter, setCounter] = useState(compute);
  // Đổi phiên thì tính lại ngay trong lần render đó: nếu chờ useEffect, frame đầu
  // sau khi bấm Bắt đầu vẫn hiện thời lượng của phiên trước
  const [source, setSource] = useState({ startTime, endTime });
  if (source.startTime !== startTime || source.endTime !== endTime) {
    setSource({ startTime, endTime });
    setCounter(compute());
  }

  useEffect(() => {
    const tick = () => setCounter(compute());

    if (!startTime || endTime) return;

    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startTime, endTime]);

  return counter;
};
