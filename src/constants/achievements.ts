export type AchievementItem = {
  id: string;
  target: number | null;
  title: string;
  description: string;
  image: string;
};
export type Achievement = {
  id: string;
  input: AchievementInput;
  target: number | null;
  title: string;
  description: string;
  image: string;
  items: AchievementItem[];
};

export type AchievementInput =
  | "completedFast"
  | "fastHours"
  | "habit"
  | "shield"
  | "shieldFromFast"
  | "shieldFromMilestone"
  | "retain"
  | "streak";

export const achievements = [
  {
    id: "first_fast",
    type: "milestone",
    name: "First Fast",
    description: "Complete your first fast.",
    items: [
      {
        id: "first_fast_1",
        target: null,
        title: "First Fast",
        description: "Complete your first fast.",
        image: "achievement_first_fast",
      },
    ],
  },

  {
    id: "fast_hours",
    type: "progress",
    name: "Fasting Hours",
    description: "Accumulate fasting hours.",
    items: [
      {
        id: "fast_hours_10",
        target: 10,
        title: "10 Hours",
        image: "achievement_fast_10",
      },
      {
        id: "fast_hours_50",
        target: 50,
        title: "50 Hours",
        image: "achievement_fast_50",
      },
      {
        id: "fast_hours_100",
        target: 100,
        title: "100 Hours",
        image: "achievement_fast_100",
      },
      {
        id: "fast_hours_500",
        target: 500,
        title: "500 Hours",
        image: "achievement_fast_500",
      },
      {
        id: "fast_hours_1000",
        target: 1000,
        title: "1000 Hours",
        image: "achievement_fast_1000",
      },
    ],
  },

  {
    id: "completed_fasts",
    type: "progress",
    name: "Fasting Journey",
    description: "Complete fasting sessions.",
    items: [
      {
        id: "completed_fasts_1",
        target: 1,
        title: "First Step",
        image: "achievement_fast_count_1",
      },
      {
        id: "completed_fasts_10",
        target: 10,
        title: "Getting Started",
        image: "achievement_fast_count_10",
      },
      {
        id: "completed_fasts_50",
        target: 50,
        title: "Dedicated",
        image: "achievement_fast_count_50",
      },
      {
        id: "completed_fasts_100",
        target: 100,
        title: "Committed",
        image: "achievement_fast_count_100",
      },
    ],
  },

  {
    id: "longest_fast",
    type: "progress",
    name: "Long Fast",
    description: "Reach longer fasting durations.",
    items: [
      {
        id: "longest_fast_16",
        target: 16,
        title: "16 Hours",
        image: "achievement_long_fast_16",
      },
      {
        id: "longest_fast_24",
        target: 24,
        title: "24 Hours",
        image: "achievement_long_fast_24",
      },
      {
        id: "longest_fast_36",
        target: 36,
        title: "36 Hours",
        image: "achievement_long_fast_36",
      },
      {
        id: "longest_fast_48",
        target: 48,
        title: "48 Hours",
        image: "achievement_long_fast_48",
      },
      {
        id: "longest_fast_72",
        target: 72,
        title: "72 Hours",
        image: "achievement_long_fast_72",
      },
    ],
  },

  {
    id: "streak",
    type: "progress",
    name: "Consistency",
    description: "Maintain your fasting habit.",
    items: [
      {
        id: "streak_3",
        target: 3,
        title: "3 Days",
        image: "achievement_streak_3",
      },
      {
        id: "streak_7",
        target: 7,
        title: "7 Days",
        image: "achievement_streak_7",
      },
      {
        id: "streak_30",
        target: 30,
        title: "30 Days",
        image: "achievement_streak_30",
      },
      {
        id: "streak_100",
        target: 100,
        title: "100 Days",
        image: "achievement_streak_100",
      },
    ],
  },

  {
    id: "shield",
    type: "progress",
    name: "Shield Keeper",
    description: "Earn fasting shields.",
    items: [
      {
        id: "shield_1",
        target: 1,
        title: "First Shield",
        image: "achievement_shield_1",
      },
      {
        id: "shield_5",
        target: 5,
        title: "Shield Keeper",
        image: "achievement_shield_5",
      },
      {
        id: "shield_10",
        target: 10,
        title: "Shield Master",
        image: "achievement_shield_10",
      },
    ],
  },

  {
    id: "habit",
    type: "progress",
    name: "Fasting Habit",
    description: "Build your fasting habit.",
    items: [
      {
        id: "habit_25",
        target: 25,
        title: "25 Habit",
        image: "achievement_habit_25",
      },
      {
        id: "habit_50",
        target: 50,
        title: "50 Habit",
        image: "achievement_habit_50",
      },
      {
        id: "habit_100",
        target: 100,
        title: "Habit Master",
        image: "achievement_habit_100",
      },
    ],
  },

  {
    id: "pixel_year",
    type: "milestone",
    name: "Pixel Year",
    description: "Build your first Pixel Year.",
    items: [
      {
        id: "pixel_year_1",
        target: null,
        title: "First Pixel Year",
        image: "achievement_pixel_year",
      },
    ],
  },

  {
    id: "first_rest",
    type: "milestone",
    name: "Take a Rest",
    description: "Use a Shield to protect your habit.",
    items: [
      {
        id: "first_rest_1",
        target: null,
        title: "First Rest",
        image: "achievement_first_rest",
      },
    ],
  },
] as const;
