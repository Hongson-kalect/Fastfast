import { MoodLevel } from "@/interfaces/db.type";

export const processData_old = [
  {
    key: "glucoseControl",
    title: "Glucose Control",
    icon: "droplet",
    color: "#10B981",

    process: [
      {
        hours: 1,
        title: "Normal",
        level: 0,
      },
      {
        hours: 4,
        title: "Dropping",
        level: 1,
      },
      {
        hours: 8,
        title: "Stable",
        level: 2,
      },
      {
        hours: 12,
        title: "Good",
        level: 3,
      },
      {
        hours: 16,
        title: "Optimal",
        level: 4,
      },
    ],
  },

  {
    key: "fatBurning",
    title: "Fat Burning",
    icon: "fire",
    color: "#FB923C",

    process: [
      {
        hours: 12,
        title: "Init",
        level: 0,
      },
      {
        hours: 14,
        title: "Active",
        level: 1,
      },
      {
        hours: 16,
        title: "Good",
        level: 2,
      },
      {
        hours: 18,
        title: "High",
        level: 3,
      },
      {
        hours: 20,
        title: "Peak",
        level: 4,
      },
    ],
  },

  {
    key: "ketosis",
    title: "Ketosis",
    icon: "bolt",
    color: "#C084FC",

    process: [
      {
        hours: 18,
        title: "Enter",
        level: 0,
      },
      {
        hours: 20,
        title: "Mild",
        level: 1,
      },
      {
        hours: 22,
        title: "Good",
        level: 2,
      },
      {
        hours: 24,
        title: "Deep",
        level: 3,
      },
      {
        hours: 26,
        title: "Maximum",
        level: 4,
      },
    ],
  },

  {
    key: "autophagy",
    title: "Autophagy",
    icon: "repeat",
    color: "#38BDF8",

    process: [
      {
        hours: 20,
        title: "Trigger",
        level: 0,
      },
      {
        hours: 24,
        title: "Cleanse",
        level: 1,
      },
      {
        hours: 28,
        title: "Good",
        level: 2,
      },
      {
        hours: 32,
        title: "Detoxing",
        level: 3,
      },
      {
        hours: 46,
        title: "Peak",
        level: 4,
      },
    ],
  },

  {
    key: "cellRenewal",
    title: "Cell Renewal",
    icon: "recycle",
    color: "#2DD4BF",

    process: [
      {
        hours: 48,
        title: "Start",
        level: 0,
      },
      {
        hours: 54,
        title: "Surge",
        level: 1,
      },
      {
        hours: 60,
        title: "Good",
        level: 2,
      },
      {
        hours: 66,
        title: "Intense",
        level: 3,
      },
      {
        hours: 72,
        title: "Peak",
        level: 4,
      },
    ],
  },

  {
    key: "immuneSupport",
    title: "Immune Support",
    icon: "shield-virus",
    color: "#F43F5E",

    process: [
      {
        hours: 72,
        title: "Reboot",
        level: 0,
      },
      {
        hours: 80,
        title: "Rebuild",
        level: 1,
      },
      {
        hours: 85,
        title: "Strengthen",
        level: 2,
      },
      {
        hours: 90,
        title: "Strengthen",
        level: 3,
      },
      {
        hours: 96,
        title: "Maximum",
        level: 4,
      },
    ],
  },
];

export type ProcessDataType = {
  key: keyof typeof processLevelTitles;
  title: string;
  icon: string;
  color: string;
  process: {
    hours: number;
    level: 0 | 1 | 2 | 3 | 4 | 5;
  }[];
};

export const processData: ProcessDataType[] = [
  {
    key: "glucoseControl",
    title: "Glucose Control",
    icon: "droplet",
    color: "#10B981",

    process: [
      { hours: 1, level: 0 },
      { hours: 4, level: 1 },
      { hours: 8, level: 2 },
      { hours: 12, level: 3 },
      { hours: 16, level: 4 },
      { hours: 24, level: 5 },
    ],
  },

  {
    key: "fatBurning",
    title: "Fat Burning",
    icon: "fire",
    color: "#FB923C",

    process: [
      { hours: 10, level: 0 }, // Trước 10 tiếng: Trạng thái Khóa/Chờ (Locked)
      { hours: 12, level: 1 },
      { hours: 16, level: 2 },
      { hours: 20, level: 3 },
      { hours: 24, level: 4 },
      { hours: 36, level: 5 },
    ],
  },

  {
    key: "growthHormone",
    title: "Growth Hormone",
    icon: "chart-line",
    color: "#3B82F6",

    process: [
      { hours: 12, level: 0 }, // Trước 12 tiếng: Locked
      { hours: 16, level: 1 },
      { hours: 24, level: 2 },
      { hours: 36, level: 3 },
      { hours: 44, level: 4 },
      { hours: 48, level: 5 },
    ],
  },

  {
    key: "ketosis",
    title: "Ketosis",
    icon: "bolt",
    color: "#8B5CF6",

    process: [
      { hours: 14, level: 0 }, // Trước 14 tiếng: Locked
      { hours: 18, level: 1 },
      { hours: 24, level: 2 },
      { hours: 36, level: 3 },
      { hours: 48, level: 4 },
      { hours: 56, level: 5 },
    ],
  },

  {
    key: "autophagy",
    title: "Autophagy",
    icon: "repeat",
    color: "#EC4899",

    process: [
      { hours: 20, level: 0 }, // Trước 20 tiếng: Locked
      { hours: 24, level: 1 },
      { hours: 32, level: 2 },
      { hours: 40, level: 3 },
      { hours: 48, level: 4 },
      { hours: 60, level: 5 },
    ],
  },

  {
    key: "cellRenewal",
    title: "Cell Renewal",
    icon: "recycle",
    color: "#14B8A6",

    process: [
      { hours: 24, level: 0 }, // Trước 24 tiếng: Locked
      { hours: 36, level: 1 },
      { hours: 48, level: 2 },
      { hours: 56, level: 3 },
      { hours: 64, level: 4 },
      { hours: 72, level: 5 },
    ],
  },

  {
    key: "immuneRenewal",
    title: "Immune Renewal",
    icon: "shield",
    color: "#6366F1",

    process: [
      { hours: 36, level: 0 }, // Trước 36 tiếng: Locked
      { hours: 48, level: 1 },
      { hours: 56, level: 2 },
      { hours: 64, level: 3 },
      { hours: 68, level: 4 },
      { hours: 72, level: 5 },
    ],
  },
];

export const processLevelTitles = {
  default: {
    0: "Start",
    1: "Standard",
    2: "Good",
    3: "High",
    4: "Peak",
    5: "Max",
  },
  glucoseControl: {
    0: "Drop",
    1: "Drop",
    2: "Stable",
    3: "Good",
    4: "Optimal",
    5: "Peak",
  },

  fatBurning: {
    0: "Init",
    1: "Start",
    2: "Warm",
    3: "Burn",
    4: "High",
    5: "Peak",
  },

  ketosis: {
    0: "Init",
    1: "Trace",
    2: "Light",
    3: "Active",
    4: "Deep",
    5: "Max",
  },

  growthHormone: {
    0: "Better",
    1: "Rise",
    2: "Boost",
    3: "High",
    4: "Peak",
    5: "Max",
  },

  autophagy: {
    0: "Better",
    1: "Rise",
    2: "Boost",
    3: "High",
    4: "Deep",
    5: "Max",
  },

  cellRenewal: {
    0: "Better",
    1: "Prime",
    2: "Warm",
    3: "Ready",
    4: "Boost",
    5: "Max",
  },

  immuneRenewal: {
    0: "Init",
    1: "Start",
    2: "Good",
    3: "Strogger",
    4: "Boost",
    5: "Max",
  },
} as const;

export function getProcessLevelTitle(
  key: keyof typeof processLevelTitles = "default",
  level: 0 | 1 | 2 | 3 | 4 | 5,
): string {
  return processLevelTitles[key]?.[level];
}

// data/emotions.ts
export const EMOTIONS: { level: MoodLevel; emoji: string; label: string }[] = [
  { level: 1, emoji: "😫", label: "Exhausted" },
  { level: 2, emoji: "😮‍💨", label: "Neutral" },
  { level: 3, emoji: "🙂", label: "Good" },
  { level: 4, emoji: "😃", label: "Focused" },
  { level: 5, emoji: "🥰", label: "Peak" },
];

export interface FastingTargetItem {
  id: string;
  hours: number;
  label: string;
  title: string;
  level: "Novice" | "Veteran" | "Expert" | "Master";
  description: string;
  advice: string; // Ngắn gọn (1 dòng) cho Item card
  adviceLong: string; // Chi tiết cho Modal
  colors: {
    accent: string; // Màu chữ số giờ / Icon chính
    border: string; // Màu viền khi được active
    badgeBg: string; // Màu nền Badge độ khó
    badgeText: string; // Màu chữ Badge độ khó
  };
}

export const FASTING_TARGETS: FastingTargetItem[] = [
  {
    id: "16h",
    hours: 16,
    label: "Intermittent",
    title: "Phổ biến & Dễ bắt đầu",
    level: "Novice",
    description:
      "Hỗ trợ chuyển hóa năng lượng từ mỡ thừa và cải thiện độ nhạy Insulin.",
    advice: "Tiêu chuẩn! Ăn trong khung giờ 12h - 20h.",
    adviceLong:
      "Đây là mốc chuẩn vàng dễ duy trì nhất. Bạn chỉ cần bỏ qua bữa sáng và gom toàn bộ lượng calo cần thiết vào khung giờ ăn từ 12h trưa đến 8h tối. Đảm bảo uống đủ 2L nước trong thời gian nhịn.",
    colors: {
      accent: "#3b82f6", // blue-500
      border: "#3b82f6",
      badgeBg: "rgba(59, 130, 246, 0.12)",
      badgeText: "#60a5fa", // blue-400
    },
  },
  {
    id: "18h",
    hours: 18,
    label: "Fat Burner",
    title: "Đốt mỡ tăng cường",
    level: "Novice",
    description:
      "Kéo dài thời gian Ketosis và bắt đầu chớm bước vào quá trình Tự thực (Autophagy).",
    advice: "Bản nâng cao nhẹ của mốc 16/8.",
    adviceLong:
      "Nhịn thêm 2 tiếng so with mốc 16/8 giúp tối ưu hóa việc đốt mỡ và chớm kích hoạt Autophagy. Trong 18 tiếng này, có thể uống cà phê đen hoặc trà xanh không đường để hỗ trợ vượt qua cơn đói.",
    colors: {
      accent: "#6366f1", // indigo-500
      border: "#6366f1",
      badgeBg: "rgba(99, 102, 241, 0.12)",
      badgeText: "#818cf8", // indigo-400
    },
  },
  {
    id: "20h",
    hours: 20,
    label: "Warrior",
    title: "Chế độ Chiến binh",
    level: "Veteran",
    description:
      "Tối ưu hóa khả năng đốt mỡ và hỗ trợ duy trì khối lượng cơ bắp.",
    advice: "Khung ăn 4 tiếng. Chú ý nạp đủ Protein.",
    adviceLong:
      "Khung giờ ăn rất hẹp (chỉ 4 tiếng). Cần tập trung nạp đủ lượng Protein (thịt, cá, trứng) và chất xơ để giữ cơ bắp. Tránh ăn dồn dập quá nhanh gây quá tải hệ tiêu hóa.",
    colors: {
      accent: "#a855f7", // purple-500
      border: "#a855f7",
      badgeBg: "rgba(168, 85, 247, 0.12)",
      badgeText: "#c084fc", // purple-400
    },
  },
  {
    id: "23h",
    hours: 23,
    label: "OMAD",
    title: "Một bữa mỗi ngày",
    level: "Veteran",
    description:
      "Thúc đẩy quá trình Tự thực (Autophagy) và cho hệ tiêu hóa nghỉ ngơi sâu.",
    advice: "(23h) Bữa ăn duy nhất cần giàu dinh dưỡng toàn phần.",
    adviceLong:
      "Nhịn trọn vẹn gần 24 tiếng (ví dụ: ăn tối hôm nay đến tối hôm sau mới ăn lại). Bữa ăn duy nhất này phải là dinh dưỡng toàn phần (Whole foods), giàu chất béo tốt và đạm. Cần lắng nghe cơ thể nếu áp dụng liên tục.",
    colors: {
      accent: "#f59e0b", // amber-500
      border: "#f59e0b",
      badgeBg: "rgba(245, 158, 11, 0.12)",
      badgeText: "#fbbf24", // amber-400
    },
  },
  {
    id: "36h",
    hours: 36,
    label: "Monk",
    title: "Thử thách nhịn xuyên ngày",
    level: "Expert",
    description:
      "Tạo khoảng trống phục hồi lớn cho đường ruột và tối ưu hóa phản ứng viêm.",
    advice: "(36h) Nên chọn ngày ít vận động nặng.",
    adviceLong:
      "Nhịn trọn vẹn 1 ngày đêm (ví dụ: tối T2 ăn xong thì bỏ qua ngày T3, đến sáng T4 mới ăn lại). Hãy chọn ngày làm việc nhẹ nhàng, bổ sung thêm điện giải (muối khoáng) để giữ sự tỉnh táo.",
    colors: {
      accent: "#f97316", // orange-500
      border: "#f97316",
      badgeBg: "rgba(249, 115, 22, 0.12)",
      badgeText: "#fb923c", // orange-400
    },
  },
  {
    id: "48h",
    hours: 48,
    label: "Extended",
    title: "Nhịn sâu nâng cao",
    level: "Expert",
    description:
      "Cạn kiệt hoàn toàn Glycogen dự trữ, thúc đẩy cơ thể tái cấu trúc năng lượng.",
    advice: "(48h) Bắt buộc bổ sung điện giải đầy đủ.",
    adviceLong:
      "Mức độ nhịn dài hạn này đòi hỏi phải bổ sung Điện giải (Muối, Kali, Magie) hàng ngày để giữ huyết áp ổn định. Nếu xuất hiện triệu chứng choáng váng, chóng mặt kéo dài thì cần ngắt nhịn (Break fast) ngay.",
    colors: {
      accent: "#f43f5e", // rose-500
      border: "#f43f5e",
      badgeBg: "rgba(244, 63, 94, 0.12)",
      badgeText: "#fb7185", // rose-400
    },
  },
  {
    id: "72h",
    hours: 72,
    label: "Prolonged",
    title: "Thử thách cực hạn",
    level: "Master",
    description:
      "Đạt mức Autophagy sâu. Cần chuẩn bị kỹ lưỡng và thực hiện cẩn trọng.",
    advice: "(72h) Chỉ dành cho người chơi rất kinh nghiệm.",
    adviceLong:
      "Chỉ nên thực hiện hiếm hoi khi cơ thể đã rất quen với Fasting. Khi xả nhịn (Break fast) tuyệt đối không ăn bữa lớn ngay, chỉ bắt đầu bằng nước hầm xương hoặc đồ ăn nhẹ để bảo vệ dạ dày.",
    colors: {
      accent: "#dc2626", // red-600
      border: "#dc2626",
      badgeBg: "rgba(220, 38, 38, 0.12)",
      badgeText: "#f87171", // red-400
    },
  },
];
// Định nghĩa các góc bung (độ) để tính toán tọa độ
export const RADIAL_ANGLES = [200, 235, 270, 305, 340];
export const RADIUS = 90; // Khoảng cách bay xa (px)

export type ChartRangeKey = "7d" | "30d" | "12w" | "24w" | "12m" | "24m";

export interface ChartRangeConfig {
  key: ChartRangeKey;
  label: string;
  unit: "day" | "week" | "month";
  value: number;
}

export const CHART_RANGES: ChartRangeConfig[] = [
  { key: "7d", label: "7 ngày qua", unit: "day", value: 7 },
  { key: "30d", label: "30 ngày qua", unit: "day", value: 30 },
  { key: "12w", label: "12 tuần qua", unit: "week", value: 12 },
  { key: "24w", label: "24 tuần qua", unit: "week", value: 24 },
  { key: "12m", label: "12 tháng qua", unit: "month", value: 12 },
  { key: "24m", label: "24 tháng qua", unit: "month", value: 24 },
];

export type ChartValue = {
  days?: number;
  showType?: "days" | "week" | "month";
};
export type ChartType = "week" | "month" | "3month" | "6month" | "year" | "all";

export const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
