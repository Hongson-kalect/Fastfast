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
  icon: {
    light: string | React.ReactNode;
    dark: string | React.ReactNode;
  };
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
        icon: {
          light: "😫",
          dark: "😫",
        },
        color: {
          light: "#FEE2E2", // Đỏ nhạt dịu mắt
          dark: "#450A0A", // Đỏ trầm tối sâu
        },
      },
      {
        id: "mood_1",
        level: 1,
        label: "Neutral",
        icon: {
          light: "😮‍💨",
          dark: "😮‍💨",
        },
        color: {
          light: "#FEF3C7", // Vàng cam nhạt
          dark: "#451A03", // Nâu cam tối
        },
      },
      {
        id: "mood_2",
        level: 2,
        label: "Good",
        icon: {
          light: "🙂",
          dark: "🙂",
        },
        color: {
          light: "#F3F4F6", // Xám nhạt trung tính
          dark: "#1F2937", // Xám đậm hiện đại
        },
      },
      {
        id: "mood_3",
        level: 3,
        label: "Focused",
        icon: {
          light: "😃",
          dark: "😃",
        },
        color: {
          light: "#D1FAE5", // Xanh ngọc nhạt
          dark: "#064E3B", // Xanh ngọc sẫm
        },
      },
      {
        id: "mood_4",
        level: 4,
        label: "Peak",
        icon: {
          light: "🥰",
          dark: "🥰",
        },
        color: {
          light: "#EDE9FE", // Tím nhạt tinh tế
          dark: "#2E1065", // Tím đậm hoàng gia
        },
      },
    ],
  },

  // 2. IONICONS MINIMAL
  ionicons_faces: {
    id: "ionicons_faces",
    name: "Ionicons Minimal",
    description: "Giao diện tối giản hiện đại với Ionicons",
    emotions: [
      {
        id: "mood_0",
        level: 0,
        label: "Exhausted",
        icon: {
          light: <Ionicons name="sad-outline" size={20} color="#DC2626" />, // Đỏ đậm sắc nét
          dark: <Ionicons name="sad-outline" size={20} color="#F87171" />, // Đỏ sáng nổi bật trên nền tối
        },
        color: { light: "#FEE2E2", dark: "#450A0A" },
      },
      {
        id: "mood_1",
        level: 1,
        label: "Neutral",
        icon: {
          light: <Ionicons name="ellipse-outline" size={20} color="#D97706" />, // Cam vàng đậm
          dark: <Ionicons name="ellipse-outline" size={20} color="#FBBF24" />, // Vàng sáng
        },
        color: { light: "#FEF3C7", dark: "#451A03" },
      },
      {
        id: "mood_2",
        level: 2,
        label: "Good",
        icon: {
          light: <Ionicons name="happy-outline" size={20} color="#2563EB" />, // Xanh dương rõ nét
          dark: <Ionicons name="happy-outline" size={20} color="#60A5FA" />, // Xanh dương sáng
        },
        color: { light: "#DBEAFE", dark: "#1E3A8A" },
      },
      {
        id: "mood_3",
        level: 3,
        label: "Focused",
        icon: {
          light: <Ionicons name="flame-outline" size={20} color="#059669" />, // Xanh lá đậm
          dark: <Ionicons name="flame-outline" size={20} color="#34D399" />, // Xanh lá sáng
        },
        color: { light: "#D1FAE5", dark: "#064E3B" },
      },
      {
        id: "mood_4",
        level: 4,
        label: "Peak",
        icon: {
          light: <Ionicons name="sparkles-outline" size={20} color="#7C3AED" />, // Tím đậm
          dark: <Ionicons name="sparkles-outline" size={20} color="#A78BFA" />, // Tím sáng
        },
        color: { light: "#EDE9FE", dark: "#2E1065" },
      },
    ],
  },

  // 3. MATERIAL COMMUNITY EMOTICONS
  material_emoticons: {
    id: "material_emoticons",
    name: "Material Moods",
    description: "Bộ mặt cảm xúc tinh tế từ Material Community",
    emotions: [
      {
        id: "mood_0",
        level: 0,
        label: "Exhausted",
        icon: {
          light: (
            <MaterialCommunityIcons
              name="emoticon-dead-outline"
              size={22}
              color="#DC2626"
            />
          ),
          dark: (
            <MaterialCommunityIcons
              name="emoticon-dead-outline"
              size={22}
              color="#F87171"
            />
          ),
        },
        color: { light: "#FEE2E2", dark: "#450A0A" },
      },
      {
        id: "mood_1",
        level: 1,
        label: "Neutral",
        icon: {
          light: (
            <MaterialCommunityIcons
              name="emoticon-neutral-outline"
              size={22}
              color="#D97706"
            />
          ),
          dark: (
            <MaterialCommunityIcons
              name="emoticon-neutral-outline"
              size={22}
              color="#FBBF24"
            />
          ),
        },
        color: { light: "#FEF3C7", dark: "#451A03" },
      },
      {
        id: "mood_2",
        level: 2,
        label: "Good",
        icon: {
          light: (
            <MaterialCommunityIcons
              name="emoticon-happy-outline"
              size={22}
              color="#2563EB"
            />
          ),
          dark: (
            <MaterialCommunityIcons
              name="emoticon-happy-outline"
              size={22}
              color="#60A5FA"
            />
          ),
        },
        color: { light: "#DBEAFE", dark: "#1E3A8A" },
      },
      {
        id: "mood_3",
        level: 3,
        label: "Focused",
        icon: {
          light: (
            <MaterialCommunityIcons
              name="emoticon-cool-outline"
              size={22}
              color="#059669"
            />
          ),
          dark: (
            <MaterialCommunityIcons
              name="emoticon-cool-outline"
              size={22}
              color="#34D399"
            />
          ),
        },
        color: { light: "#D1FAE5", dark: "#064E3B" },
      },
      {
        id: "mood_4",
        level: 4,
        label: "Peak",
        icon: {
          light: (
            <MaterialCommunityIcons
              name="emoticon-excited-outline"
              size={22}
              color="#7C3AED"
            />
          ),
          dark: (
            <MaterialCommunityIcons
              name="emoticon-excited-outline"
              size={22}
              color="#A78BFA"
            />
          ),
        },
        color: { light: "#EDE9FE", dark: "#2E1065" },
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
        icon: {
          light: <Feather name="cloud-lightning" size={20} color="#4B5563" />, // Xám chì rõ nét
          dark: <Feather name="cloud-lightning" size={20} color="#9CA3AF" />, // Xám sáng trên nền tối
        },
        color: { light: "#F3F4F6", dark: "#1F2937" },
      },
      {
        id: "mood_1",
        level: 1,
        label: "Neutral",
        icon: {
          light: <Feather name="cloud-rain" size={20} color="#2563EB" />, // Xanh mưa đậm
          dark: <Feather name="cloud-rain" size={20} color="#60A5FA" />, // Xanh mưa sáng
        },
        color: { light: "#DBEAFE", dark: "#1E3A8A" },
      },
      {
        id: "mood_2",
        level: 2,
        label: "Good",
        icon: {
          light: <Feather name="cloud" size={20} color="#0284C7" />, // Xanh mây
          dark: <Feather name="cloud" size={20} color="#38BDF8" />,
        },
        color: { light: "#E0F2FE", dark: "#0C4A6E" },
      },
      {
        id: "mood_3",
        level: 3,
        label: "Focused",
        icon: {
          light: <Feather name="sun" size={20} color="#D97706" />, // Vàng nắng ấm
          dark: <Feather name="sun" size={20} color="#FBBF24" />, // Vàng rực trên nền tối
        },
        color: { light: "#FEF3C7", dark: "#451A03" },
      },
      {
        id: "mood_4",
        level: 4,
        label: "Peak",
        icon: {
          light: <FontAwesome5 name="rainbow" size={18} color="#DB2777" />, // Cầu vồng hồng tươi
          dark: <FontAwesome5 name="rainbow" size={18} color="#F472B6" />,
        },
        color: { light: "#FCE7F3", dark: "#500724" },
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
        icon: {
          light: (
            <MaterialCommunityIcons
              name="battery-alert-variant-outline"
              size={22}
              color="#DC2626"
            />
          ),
          dark: (
            <MaterialCommunityIcons
              name="battery-alert-variant-outline"
              size={22}
              color="#F87171"
            />
          ),
        },
        color: { light: "#FEE2E2", dark: "#450A0A" },
      },
      {
        id: "mood_1",
        level: 1,
        label: "Neutral",
        icon: {
          light: (
            <MaterialCommunityIcons
              name="battery-medium"
              size={22}
              color="#D97706"
            />
          ),
          dark: (
            <MaterialCommunityIcons
              name="battery-medium"
              size={22}
              color="#FBBF24"
            />
          ),
        },
        color: { light: "#FEF3C7", dark: "#451A03" },
      },
      {
        id: "mood_2",
        level: 2,
        label: "Good",
        icon: {
          light: (
            <MaterialCommunityIcons
              name="battery-high"
              size={22}
              color="#2563EB"
            />
          ),
          dark: (
            <MaterialCommunityIcons
              name="battery-high"
              size={22}
              color="#60A5FA"
            />
          ),
        },
        color: { light: "#DBEAFE", dark: "#1E3A8A" },
      },
      {
        id: "mood_3",
        level: 3,
        label: "Focused",
        icon: {
          light: <Ionicons name="flash-outline" size={20} color="#059669" />,
          dark: <Ionicons name="flash-outline" size={20} color="#34D399" />,
        },
        color: { light: "#D1FAE5", dark: "#064E3B" },
      },
      {
        id: "mood_4",
        level: 4,
        label: "Peak",
        icon: {
          light: (
            <MaterialCommunityIcons
              name="crown-outline"
              size={22}
              color="#CA8A04"
            />
          ),
          dark: (
            <MaterialCommunityIcons
              name="crown-outline"
              size={22}
              color="#FACC15"
            />
          ),
        },
        color: { light: "#FEF08A", dark: "#422006" },
      },
    ],
  },

  // 6. PIXEL ENERGY (Emoji & Pixel Art Vibes)
  pixel_vibe: {
    id: "pixel_vibe",
    name: "Pixel Energy",
    description: "Cảm xúc phong cách Pixel & Emoji tượng hình",
    emotions: [
      {
        id: "mood_0",
        level: 0,
        label: "Exhausted",
        icon: {
          light: "💀",
          dark: "💀",
        },
        color: {
          light: "#F3F4F6", // Xám nhạt pastel (sửa lại từ xám xịt #4A4A4A)
          dark: "#1F2937", // Xám đen trầm
        },
      },
      {
        id: "mood_1",
        level: 1,
        label: "Neutral",
        icon: {
          light: "🌧️",
          dark: "🌧️",
        },
        color: {
          light: "#E0F2FE", // Xanh mây nhạt
          dark: "#0C4A6E", // Xanh mây đêm
        },
      },
      {
        id: "mood_2",
        level: 2,
        label: "Good",
        icon: {
          light: "🌱",
          dark: "🌱",
        },
        color: {
          light: "#D1FAE5", // Xanh mầm cây nhạt
          dark: "#064E3B", // Xanh lục sẫm
        },
      },
      {
        id: "mood_3",
        level: 3,
        label: "Focused",
        icon: {
          light: "🔥",
          dark: "🔥",
        },
        color: {
          light: "#FFEDD5", // Cam lửa pastel
          dark: "#431407", // Cam lửa trầm
        },
      },
      {
        id: "mood_4",
        level: 4,
        label: "Peak",
        icon: {
          light: "👑",
          dark: "👑",
        },
        color: {
          light: "#FEF08A", // Vàng hoàng gia pastel
          dark: "#422006", // Vàng đồng sẫm
        },
      },
    ],
  },
};

// Pack mặc định ban đầu
export const DEFAULT_PACK_ID = "default_emoji";
export const EMOTIONS = EMOTION_PACKS["default"].emotions;
