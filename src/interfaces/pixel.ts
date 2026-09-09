import { DissectedDay } from "@/util/home/timespliter";
import { DailyLog, DailyNote, HabitLog } from "./db.type";

export type DailyPixelData = {
  logs: (DailyLog|DissectedDay)[];
  note?: DailyNote;
  shieldLog?: HabitLog;
  totalHours: number;
};

export type YearPixelDataMap = Record<string, DailyPixelData>; // Key: "YYYY-MM-DD"

export type PixelStats = {
  fastDays: number;
  fastHour: number;
  logDays: number;
};

export type ViewMode = "fasting" | "mood";

export type DayItem = {
  dateString: string;
  dayOfMonth: number;
  isCurrentYear: boolean;
  data?: DayItemType;
}



// ─── THUẬT TOÁN SINH LƯỚI PIXEL ĐÃ NÂNG CẤP NHÃN BIÊN ───
export type DayItemType = {
  dateString: string;
  moodIndex: number;
  fastingHours: number;
  fastingRange: number;
  isCurrentYear: boolean;
};

export type DayItemObj = {
  [key: string]: DayItemType;
};


export type WeekItem= {
  weekIndex: number; // 0, 1, 2... tương ứng với hàng
  weekNumberInYear: number; // Số tuần thực tế trong năm (1, 2, 3...)
  month: string; // Nhãn hiển thị bên trái (W1 hoặc JAN - 1)
  weekOfYear: string; // Nhãn hiển thị bên trái (W1 hoặc JAN - 1)
  isMonthHeader: boolean; // Dùng để xác định xem có cần in đậm label không
  days: DayItem[];
}
 