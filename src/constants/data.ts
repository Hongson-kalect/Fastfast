export const processData_old = [
  {
    key: "glucoseControl",
    title: "Glucose Control",
    icon: "droplet",
    color: "#10B981",

    process: [
      {
        hours: 0,
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
      { hours: 0, level: 0 },
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
export const EMOTIONS = [
  { emoji: "🥵", label: "Exhausted" },
  { emoji: "😐", label: "Neutral" },
  { emoji: "😊", label: "Good" },
  { emoji: "💎", label: "Focused" },
  { emoji: "🤩", label: "Peak" },
];

// Định nghĩa các góc bung (độ) để tính toán tọa độ
export const RADIAL_ANGLES = [200, 235, 270, 305, 340];
export const RADIUS = 90; // Khoảng cách bay xa (px)
