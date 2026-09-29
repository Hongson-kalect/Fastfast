import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

// Import các định nghĩa pack đã tạo ở bước trước
import { useDBService } from "@/hooks/useDBService";
import { useBottomSheet } from "@/provider/BottomSheet";
import { useAppStore } from "@/stores/appStore";
import {
  EMOTION_PACKS,
  EmotionItem,
  EmotionPack,
} from "../../constants/emotions";
import {
  TARGET_PACKS,
  TargetItem,
  TargetPack,
} from "../../constants/fasting_targets";

type TabType = "emotions" | "targets";

interface PackPickerBottomSheetProps {
  selectedEmotionPackId: string;
  onSelectEmotionPack: (packId: string) => void;
  selectedTargetPackId: string;
  onSelectTargetPack: (packId: string) => void;
  isDark?: boolean;
}

export const PackPickerBottomSheet = () => {
  const [activeTab, setActiveTab] = useState<TabType>("emotions");
  const { settings, updateSetting } = useAppStore();
  const dbSerive = useDBService();
  const [selectedIcon, selectedTarget] = useMemo(() => {
    return [
      settings?.emotion_pack || "default",
      settings?.target_pack || "default",
    ];
  }, [settings]);

  const { hide } = useBottomSheet();

  const onSelectIcon = async (packId: string) => {
    await dbSerive.setting("emotion_pack", packId);
    updateSetting({ emotion_pack: packId });
    hide();
  };

  const onSelectTarget = async (packId: string) => {
    await dbSerive.setting("target_pack", packId);
    updateSetting({ target_pack: packId });
    hide();
  };

  const isDark = settings?.is_dark_mode ?? true;

  return (
    <View className="p-4">
      {/* Backdrop */}

      {/* Title & Close Button */}
      <View className="flex-row justify-between items-center mb-4">
        <Text
          className={`text-xl font-bold ${
            isDark ? "text-white" : "text-zinc-900"
          }`}
        >
          Chọn Icon Pack
        </Text>
        <TouchableOpacity
          className={`p-1.5 rounded-full ${
            isDark ? "bg-zinc-800" : "bg-zinc-100"
          }`}
        >
          <Ionicons
            name="close"
            size={20}
            color={isDark ? "#A1A1AA" : "#52525B"}
          />
        </TouchableOpacity>
      </View>

      {/* Segmented Tab Switcher */}
      <View
        className={`flex-row p-1 rounded-2xl mb-5 ${
          isDark ? "bg-zinc-800" : "bg-zinc-100"
        }`}
      >
        <TouchableOpacity
          className={`flex-1 py-2.5 items-center rounded-xl ${
            activeTab === "emotions"
              ? isDark
                ? "bg-zinc-700 shadow"
                : "bg-white shadow-sm"
              : ""
          }`}
          onPress={() => setActiveTab("emotions")}
        >
          <Text
            className={`font-semibold text-sm ${
              activeTab === "emotions"
                ? isDark
                  ? "text-white"
                  : "text-zinc-900"
                : isDark
                  ? "text-zinc-400"
                  : "text-zinc-500"
            }`}
          >
            Cảm xúc (Mood)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 py-2.5 items-center rounded-xl ${
            activeTab === "targets"
              ? isDark
                ? "bg-zinc-700 shadow"
                : "bg-white shadow-sm"
              : ""
          }`}
          onPress={() => setActiveTab("targets")}
        >
          <Text
            className={`font-semibold text-sm ${
              activeTab === "targets"
                ? isDark
                  ? "text-white"
                  : "text-zinc-900"
                : isDark
                  ? "text-zinc-400"
                  : "text-zinc-500"
            }`}
          >
            Mục tiêu (Target)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content Scroll Area */}
      <View>
        {activeTab === "emotions" ? (
          // TAB 1: EMOTION PACKS
          <View className="gap-y-4">
            {Object.entries(EMOTION_PACKS).map(([id, pack]) => (
              <EmotionPackCard
                key={id}
                pack={pack}
                isSelected={id === selectedIcon}
                onSelect={() => onSelectIcon(id)}
                isDark={isDark}
              />
            ))}
          </View>
        ) : (
          // TAB 2: TARGET PACKS
          <View className="gap-y-4">
            {Object.entries(TARGET_PACKS).map(([id, pack]) => (
              <TargetPackCard
                key={id}
                pack={pack}
                isSelected={id === selectedTarget}
                onSelect={() => onSelectTarget(id)}
                isDark={isDark}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

// ==========================================
// CARD: EMOTION PACK ITEM
// ==========================================

interface EmotionPackCardProps {
  pack: EmotionPack;
  isSelected: boolean;
  onSelect: () => void;
  isDark: boolean;
}

const EmotionPackCard: React.FC<EmotionPackCardProps> = ({
  pack,
  isSelected,
  onSelect,
  isDark,
}) => {
  return (
    <TouchableOpacity
      onPress={onSelect}
      activeOpacity={0.7}
      className={`p-4 rounded-2xl border-2 ${
        isSelected
          ? "border-emerald-500 bg-emerald-500/5"
          : isDark
            ? "border-zinc-800 bg-zinc-800/50"
            : "border-zinc-200 bg-zinc-50"
      }`}
    >
      {/* Title & Selection Indicator */}
      <View className="flex-row justify-between items-center mb-1">
        <Text
          className={`font-bold text-base ${
            isDark ? "text-white" : "text-zinc-900"
          }`}
        >
          {pack.name}
        </Text>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={22} color="#10B981" />
        )}
      </View>

      <Text
        className={`text-xs mb-3 ${isDark ? "text-zinc-400" : "text-zinc-500"}`}
      >
        {pack.description}
      </Text>

      {/* Preview Icons Row */}
      <View className="flex-row justify-between items-center pt-1">
        {pack.emotions.map((item: EmotionItem) => {
          const bg = isDark ? item.color.dark : item.color.light;
          return (
            <View key={item.id} className="items-center gap-1">
              <View
                style={{ backgroundColor: bg }}
                className="w-10 h-10 rounded-xl items-center justify-center"
              >
                {typeof item.icon === "string" ? (
                  <Text className="text-base">{item.icon}</Text>
                ) : (
                  item.icon
                )}
              </View>
              <Text
                className={`text-[10px] font-medium ${
                  isDark ? "text-zinc-400" : "text-zinc-500"
                }`}
              >
                Lvl {item.level}
              </Text>
            </View>
          );
        })}
      </View>
    </TouchableOpacity>
  );
};

// ==========================================
// CARD: TARGET PACK ITEM
// ==========================================

interface TargetPackCardProps {
  pack: TargetPack;
  isSelected: boolean;
  onSelect: () => void;
  isDark: boolean;
}

const TargetPackCard: React.FC<TargetPackCardProps> = ({
  pack,
  isSelected,
  onSelect,
  isDark,
}) => {
  return (
    <TouchableOpacity
      onPress={onSelect}
      activeOpacity={0.7}
      className={`p-4 rounded-2xl border-2 ${
        isSelected
          ? "border-emerald-500 bg-emerald-500/5"
          : isDark
            ? "border-zinc-800 bg-zinc-800/50"
            : "border-zinc-200 bg-zinc-50"
      }`}
    >
      {/* Title & Selection Indicator */}
      <View className="flex-row justify-between items-center mb-1">
        <Text
          className={`font-bold text-base ${
            isDark ? "text-white" : "text-zinc-900"
          }`}
        >
          {pack.name}
        </Text>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={22} color="#10B981" />
        )}
      </View>

      <Text
        className={`text-xs mb-3 ${isDark ? "text-zinc-400" : "text-zinc-500"}`}
      >
        {pack.description}
      </Text>

      {/* Preview 7 Targets Horizontal Grid */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
        className="pt-1"
      >
        {pack.targets.map((item: TargetItem) => {
          const bg = isDark ? item.color.dark : item.color.light;
          return (
            <View key={item.id} className="items-center gap-1">
              <View
                style={{ backgroundColor: bg }}
                className="w-9 h-9 rounded-xl items-center justify-center"
              >
                {typeof item.icon === "string" ? (
                  <Text className="text-sm">{item.icon}</Text>
                ) : (
                  item.icon
                )}
              </View>
              <Text
                className={`text-[10px] font-semibold ${
                  isDark ? "text-zinc-400" : "text-zinc-500"
                }`}
              >
                {item.targetHours}h
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </TouchableOpacity>
  );
};
