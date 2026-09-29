import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";

export type FastingTargetHours = 16 | 18 | 20 | 23 | 36 | 48 | 72;

export interface TargetItem {
  id: string;
  targetHours: FastingTargetHours;
  label: string;
  description: string;
  /** Hỗ trợ string (emoji) hoặc JSX Expo Vector Icons */
  icon: string | React.ReactNode;
  color: {
    light: string;
    dark: string;
  };
}

export interface TargetPack {
  id: string;
  name: string;
  description: string;
  targets: TargetItem[];
}

// ==========================================
// TARGET PACKS DEFINITION
// ==========================================

export const TARGET_PACKS: { [key: string]: TargetPack } = {
  // 1. CLASSIC EMOJI PACK
  default: {
    id: "default_emoji_targets",
    name: "Classic Emoji Target",
    description: "Mốc mục tiêu biểu thị bằng Emoji truyền thống",
    targets: [
      {
        id: "target_16",
        targetHours: 16,
        label: "16 Hours",
        description: "Standard 16:8 Fasting",
        icon: "🌱",
        color: { light: "#E8F5E9", dark: "#1B3E20" },
      },
      {
        id: "target_18",
        targetHours: 18,
        label: "18 Hours",
        description: "18:6 Fasting",
        icon: "⚡",
        color: { light: "#E0F2FE", dark: "#0F3854" },
      },
      {
        id: "target_20",
        targetHours: 20,
        label: "20 Hours",
        description: "Warrior Fast",
        icon: "⚔️",
        color: { light: "#FEF3C7", dark: "#54380C" },
      },
      {
        id: "target_23",
        targetHours: 23,
        label: "23 Hours",
        description: "OMAD (One Meal A Day)",
        icon: "🍽️",
        color: { light: "#FFEDD5", dark: "#5C2B0E" },
      },
      {
        id: "target_36",
        targetHours: 36,
        label: "36 Hours",
        description: "Monk Fast / Extended",
        icon: "🧘",
        color: { light: "#FCE7F3", dark: "#521838" },
      },
      {
        id: "target_48",
        targetHours: 48,
        label: "48 Hours",
        description: "2-Day Reset",
        icon: "🔥",
        color: { light: "#FEE2E2", dark: "#5C1D1D" },
      },
      {
        id: "target_72",
        targetHours: 72,
        label: "72 Hours",
        description: "Deep Autophagy / Master",
        icon: "👑",
        color: { light: "#EDE9FE", dark: "#381E66" },
      },
    ],
  },

  // 2. IONICONS MODERN PACK
  ionicons_targets: {
    id: "ionicons_targets",
    name: "Ionicons Modern",
    description: "Bộ icon tối giản, mượt mà từ Ionicons",
    targets: [
      {
        id: "target_16",
        targetHours: 16,
        label: "16 Hours",
        description: "Standard 16:8 Fasting",
        icon: <Ionicons name="leaf-outline" size={20} color="#10B981" />,
        color: { light: "#D1FAE5", dark: "#064E3B" },
      },
      {
        id: "target_18",
        targetHours: 18,
        label: "18 Hours",
        description: "18:6 Fasting",
        icon: <Ionicons name="timer-outline" size={20} color="#0284C7" />,
        color: { light: "#E0F2FE", dark: "#0C4A6E" },
      },
      {
        id: "target_20",
        targetHours: 20,
        label: "20 Hours",
        description: "Warrior Fast",
        icon: (
          <Ionicons name="shield-checkmark-outline" size={20} color="#D97706" />
        ),
        color: { light: "#FEF3C7", dark: "#78350F" },
      },
      {
        id: "target_23",
        targetHours: 23,
        label: "23 Hours",
        description: "OMAD",
        icon: <Ionicons name="restaurant-outline" size={20} color="#EA580C" />,
        color: { light: "#FFEDD5", dark: "#7C2D12" },
      },
      {
        id: "target_36",
        targetHours: 36,
        label: "36 Hours",
        description: "36-Hour Reset",
        icon: <Ionicons name="fitness-outline" size={20} color="#E11D48" />,
        color: { light: "#FFE4E6", dark: "#881337" },
      },
      {
        id: "target_48",
        targetHours: 48,
        label: "48 Hours",
        description: "Prolonged Fast",
        icon: <Ionicons name="flame-outline" size={20} color="#DC2626" />,
        color: { light: "#FEE2E2", dark: "#7F1D1D" },
      },
      {
        id: "target_72",
        targetHours: 72,
        label: "72 Hours",
        description: "72-Hour Challenge",
        icon: <Ionicons name="trophy-outline" size={20} color="#7C3AED" />,
        color: { light: "#EDE9FE", dark: "#4C1D95" },
      },
    ],
  },

  // 3. MATERIAL COMMUNITY ENERGY & PROGRESS PACK
  material_energy_targets: {
    id: "material_energy_targets",
    name: "Material Power",
    description: "Thể hiện độ thử thách qua năng lượng và ngọn lửa",
    targets: [
      {
        id: "target_16",
        targetHours: 16,
        label: "16 Hours",
        description: "Standard Fasting",
        icon: (
          <MaterialCommunityIcons
            name="clock-start"
            size={22}
            color="#059669"
          />
        ),
        color: { light: "#A7F3D0", dark: "#065F46" },
      },
      {
        id: "target_18",
        targetHours: 18,
        label: "18 Hours",
        description: "Advanced Fasting",
        icon: (
          <MaterialCommunityIcons
            name="lightning-bolt-outline"
            size={22}
            color="#0284C7"
          />
        ),
        color: { light: "#BAE6FD", dark: "#075985" },
      },
      {
        id: "target_20",
        targetHours: 20,
        label: "20 Hours",
        description: "Warrior Fast",
        icon: <MaterialCommunityIcons name="sword" size={22} color="#D97706" />,
        color: { light: "#FDE68A", dark: "#92400E" },
      },
      {
        id: "target_23",
        targetHours: 23,
        label: "23 Hours",
        description: "OMAD Protocol",
        icon: (
          <MaterialCommunityIcons
            name="food-off-outline"
            size={22}
            color="#D946EF"
          />
        ),
        color: { light: "#F5D0FE", dark: "#701A75" },
      },
      {
        id: "target_36",
        targetHours: 36,
        label: "36 Hours",
        description: "Monk Fast",
        icon: (
          <MaterialCommunityIcons
            name="heart-pulse"
            size={22}
            color="#E11D48"
          />
        ),
        color: { light: "#FECDD3", dark: "#9F1239" },
      },
      {
        id: "target_48",
        targetHours: 48,
        label: "48 Hours",
        description: "Autophagy Peak",
        icon: <MaterialCommunityIcons name="fire" size={22} color="#EF4444" />,
        color: { light: "#FCA5A5", dark: "#991B1B" },
      },
      {
        id: "target_72",
        targetHours: 72,
        label: "72 Hours",
        description: "Immune System Reset",
        icon: (
          <MaterialCommunityIcons
            name="crown-circle-outline"
            size={22}
            color="#9333EA"
          />
        ),
        color: { light: "#E9D5FF", dark: "#6B21A8" },
      },
    ],
  },

  // 4. FEATHER MINIMALIST PACK
  feather_minimal_targets: {
    id: "feather_minimal_targets",
    name: "Feather Clean",
    description: "Thiết kế nét mảnh tinh xảo từ Feather Icons",
    targets: [
      {
        id: "target_16",
        targetHours: 16,
        label: "16 Hours",
        description: "16 Hours Target",
        icon: <Feather name="check-circle" size={20} color="#10B981" />,
        color: { light: "#ECFDF5", dark: "#064E3B" },
      },
      {
        id: "target_18",
        targetHours: 18,
        label: "18 Hours",
        description: "18 Hours Target",
        icon: <Feather name="clock" size={20} color="#06B6D4" />,
        color: { light: "#CFFAFE", dark: "#164E63" },
      },
      {
        id: "target_20",
        targetHours: 20,
        label: "20 Hours",
        description: "20 Hours Target",
        icon: <Feather name="target" size={20} color="#F59E0B" />,
        color: { light: "#FEF3C7", dark: "#78350F" },
      },
      {
        id: "target_23",
        targetHours: 23,
        label: "23 Hours",
        description: "23 Hours Target",
        icon: <Feather name="coffee" size={20} color="#F97316" />,
        color: { light: "#FFEDD5", dark: "#7C2D12" },
      },
      {
        id: "target_36",
        targetHours: 36,
        label: "36 Hours",
        description: "36 Hours Target",
        icon: <Feather name="activity" size={20} color="#F43F5E" />,
        color: { light: "#FFE4E6", dark: "#881337" },
      },
      {
        id: "target_48",
        targetHours: 48,
        label: "48 Hours",
        description: "48 Hours Target",
        icon: <Feather name="zap" size={20} color="#EF4444" />,
        color: { light: "#FEE2E2", dark: "#7F1D1D" },
      },
      {
        id: "target_72",
        targetHours: 72,
        label: "72 Hours",
        description: "72 Hours Target",
        icon: <Feather name="award" size={20} color="#8B5CF6" />,
        color: { light: "#EDE9FE", dark: "#4C1D95" },
      },
    ],
  },
};

// Target Pack mặc định
export const DEFAULT_TARGET_PACK_ID = "default_emoji_targets";
export const TARGETS = TARGET_PACKS["default"].targets;
