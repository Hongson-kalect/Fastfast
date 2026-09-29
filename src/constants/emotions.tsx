import {
  Feather,
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import React from "react";

export type MoodLevel = 0 | 1 | 2 | 3 | 4;

export interface EmotionItem {
  id: string;
  level: MoodLevel;
  label: string;
  // Hỗ trợ cả string (emoji/pixel art char) lẫn JSX Component
  icon: string | React.ReactNode;
  color: {
    light: string;
    dark: string;
  };
}

export interface EmotionPack {
  id: string;
  name: string;
  emotions: EmotionItem[];
  description?: string;
}

// ==========================================
// PACKS DEFINITION
// ==========================================

export const EMOTION_PACKS: { [key: string]: EmotionPack } = {
  default: {
    id: "default",
    name: "Classic Emoji",
    emotions: [
      {
        id: "mood_0",
        level: 0,
        label: "Exhausted",
        icon: "😫",
        color: {
          light: "#FADBD8",
          dark: "#6E2020",
        },
      },
      {
        id: "mood_1",
        level: 1,
        label: "Neutral",
        icon: "😮‍💨",
        color: {
          light: "#FDEBD0",
          dark: "#874D14",
        },
      },
      {
        id: "mood_2",
        level: 2,
        label: "Good",
        icon: "🙂",
        color: {
          light: "#E5E7EB",
          dark: "#3A3F47",
        },
      },
      {
        id: "mood_3",
        level: 3,
        label: "Focused",
        icon: "😃",
        color: {
          light: "#D4EFDF",
          dark: "#1A5C70",
        },
      },
      {
        id: "mood_4",
        level: 4,
        label: "Peak",
        icon: "🥰",
        color: {
          light: "#A9DFBF",
          dark: "#2E6930",
        },
      },
    ],
  },
  // 2. IONICONS OUTLINE / FILLED PACK
  ionicons_faces: {
    id: "ionicons_faces",
    name: "Ionicons Minimal",
    description: "Giao diện tối giản hiện đại với Ionicons",
    emotions: [
      {
        id: "mood_0",
        level: 0,
        label: "Exhausted",
        icon: <Ionicons name="sad-outline" size={20} color="#EF4444" />,
        color: { light: "#FEE2E2", dark: "#7F1D1D" },
      },
      {
        id: "mood_1",
        level: 1,
        label: "Neutral",
        icon: <Ionicons name="ellipse-outline" size={20} color="#F59E0B" />,
        color: { light: "#FEF3C7", dark: "#78350F" },
      },
      {
        id: "mood_2",
        level: 2,
        label: "Good",
        icon: <Ionicons name="happy-outline" size={20} color="#3B82F6" />,
        color: { light: "#DBEAFE", dark: "#1E3A8A" },
      },
      {
        id: "mood_3",
        level: 3,
        label: "Focused",
        icon: <Ionicons name="flame-outline" size={20} color="#10B981" />,
        color: { light: "#D1FAE5", dark: "#064E3B" },
      },
      {
        id: "mood_4",
        level: 4,
        label: "Peak",
        icon: <Ionicons name="sparkles-outline" size={20} color="#8B5CF6" />,
        color: { light: "#EDE9FE", dark: "#4C1D95" },
      },
    ],
  },

  // 3. MATERIAL COMMUNITY EMOTICONS (Mặt cười đa dạng)
  material_emoticons: {
    id: "material_emoticons",
    name: "Material Moods",
    description: "Bộ mặt cảm xúc tinh tế từ Material Community",
    emotions: [
      {
        id: "mood_0",
        level: 0,
        label: "Exhausted",
        icon: (
          <MaterialCommunityIcons
            name="emoticon-dead-outline"
            size={22}
            color="#DC2626"
          />
        ),
        color: { light: "#FCA5A5", dark: "#5B1111" },
      },
      {
        id: "mood_1",
        level: 1,
        label: "Neutral",
        icon: (
          <MaterialCommunityIcons
            name="emoticon-neutral-outline"
            size={22}
            color="#D97706"
          />
        ),
        color: { light: "#FCD34D", dark: "#5B3006" },
      },
      {
        id: "mood_2",
        level: 2,
        label: "Good",
        icon: (
          <MaterialCommunityIcons
            name="emoticon-happy-outline"
            size={22}
            color="#2563EB"
          />
        ),
        color: { light: "#93C5FD", dark: "#172554" },
      },
      {
        id: "mood_3",
        level: 3,
        label: "Focused",
        icon: (
          <MaterialCommunityIcons
            name="emoticon-cool-outline"
            size={22}
            color="#059669"
          />
        ),
        color: { light: "#6EE7B7", dark: "#022C22" },
      },
      {
        id: "mood_4",
        level: 4,
        label: "Peak",
        icon: (
          <MaterialCommunityIcons
            name="emoticon-excited-outline"
            size={22}
            color="#7C3AED"
          />
        ),
        color: { light: "#C4B5FD", dark: "#2E1065" },
      },
    ],
  },

  // 4. NATURE & WEATHER PACK (Chủ đề thời tiết & thiên nhiên)
  weather_vibes: {
    id: "weather_vibes",
    name: "Weather & Nature",
    description: "Thể hiện tâm trạng theo biểu tượng thời tiết",
    emotions: [
      {
        id: "mood_0",
        level: 0,
        label: "Exhausted",
        icon: <Feather name="cloud-lightning" size={20} color="#6B7280" />,
        color: { light: "#E5E7EB", dark: "#1F2937" },
      },
      {
        id: "mood_1",
        level: 1,
        label: "Neutral",
        icon: <Feather name="cloud-rain" size={20} color="#60A5FA" />,
        color: { light: "#BFDBFE", dark: "#1E293B" },
      },
      {
        id: "mood_2",
        level: 2,
        label: "Good",
        icon: <Feather name="cloud" size={20} color="#93C5FD" />,
        color: { light: "#E0F2FE", dark: "#0F172A" },
      },
      {
        id: "mood_3",
        level: 3,
        label: "Focused",
        icon: <Feather name="sun" size={20} color="#F59E0B" />,
        color: { light: "#FEF08A", dark: "#451A03" },
      },
      {
        id: "mood_4",
        level: 4,
        label: "Peak",
        icon: <FontAwesome5 name="rainbow" size={18} color="#EC4899" />,
        color: { light: "#FBCFE8", dark: "#500724" },
      },
    ],
  },

  // 5. GAMING & ENERGY PACK (Chủ đề Game / Năng lượng)
  gaming_energy: {
    id: "gaming_energy",
    name: "Gaming Power",
    description: "Cảm xúc dạng thanh năng lượng & game",
    emotions: [
      {
        id: "mood_0",
        level: 0,
        label: "Exhausted",
        icon: (
          <MaterialCommunityIcons
            name="battery-alert-variant-outline"
            size={22}
            color="#EF4444"
          />
        ),
        color: { light: "#FEE2E2", dark: "#450A0A" },
      },
      {
        id: "mood_1",
        level: 1,
        label: "Neutral",
        icon: (
          <MaterialCommunityIcons
            name="battery-medium"
            size={22}
            color="#F59E0B"
          />
        ),
        color: { light: "#FEF3C7", dark: "#451A03" },
      },
      {
        id: "mood_2",
        level: 2,
        label: "Good",
        icon: (
          <MaterialCommunityIcons
            name="battery-high"
            size={22}
            color="#3B82F6"
          />
        ),
        color: { light: "#DBEAFE", dark: "#172554" },
      },
      {
        id: "mood_3",
        level: 3,
        label: "Focused",
        icon: <Ionicons name="flash-outline" size={20} color="#10B981" />,
        color: { light: "#D1FAE5", dark: "#022C22" },
      },
      {
        id: "mood_4",
        level: 4,
        label: "Peak",
        icon: (
          <MaterialCommunityIcons
            name="crown-outline"
            size={22}
            color="#EAB308"
          />
        ),
        color: { light: "#FEF08A", dark: "#713F12" },
      },
    ],
  },
  pixel_vibe: {
    id: "pixel_vibe",
    name: "Pixel Energy",
    emotions: [
      {
        id: "mood_0",
        level: 0,
        label: "Exhausted",
        icon: "💀",
        color: {
          light: "#4A4A4A",
          dark: "#1F1F1F",
        },
      },
      {
        id: "mood_1",
        level: 1,
        label: "Neutral",
        icon: "🌧️",
        color: {
          light: "#A0AEC0",
          dark: "#2D3748",
        },
      },
      {
        id: "mood_2",
        level: 2,
        label: "Good",
        icon: "🌱",
        color: {
          light: "#6EE7B7",
          dark: "#065F46",
        },
      },
      {
        id: "mood_3",
        level: 3,
        label: "Focused",
        icon: "🔥",
        color: {
          light: "#FDBA74",
          dark: "#9A3412",
        },
      },
      {
        id: "mood_4",
        level: 4,
        label: "Peak",
        icon: "👑",
        color: {
          light: "#FDE047",
          dark: "#854D0E",
        },
      },
    ],
  },
};

// Pack mặc định ban đầu
export const DEFAULT_PACK_ID = "default_emoji";
export const EMOTIONS = EMOTION_PACKS["default"].emotions;
