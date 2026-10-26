import { processData } from "@/constants/data";

/** Giai đoạn cơ thể mới nhất đã mở khoá ở thời điểm `counter` (giây), null nếu chưa có. */
export const getCurrentPhase = (counter: number) => {
  const hours = counter / 3600;
  let current: (typeof processData)[number] | null = null;

  for (const phase of processData) {
    if (hours >= phase.process[0].hours) current = phase;
  }

  return current;
};
