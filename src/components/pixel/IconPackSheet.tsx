import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useMemo, useState } from "react";
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
import { ThemedText } from "../themed-text";

type TabType = "emotions" | "targets";

export const PackPickerBottomSheet = () => {
  const [activeTab, setActiveTab] = useState<TabType>("emotions");

  const { settings, updateSetting } = useAppStore();
  const dbService = useDBService();
  const { hide } = useBottomSheet();

  const selectedEmotionPackId =
    settings?.emotion_pack || "default";

  const selectedTargetPackId =
    settings?.target_pack || "default";

  const onSelectEmotionPack = useCallback(
    async (packId: string) => {
      await dbService.setting("emotion_pack", packId);
      updateSetting({ emotion_pack: packId });
      hide();
    },
    [dbService, updateSetting, hide],
  );

  const onSelectTargetPack = useCallback(
    async (packId: string) => {
      await dbService.setting("target_pack", packId);
      updateSetting({ target_pack: packId });
      hide();
    },
    [dbService, updateSetting, hide],
  );

  return (
    <View className="p-4">
      {/* Header */}
      <View className="mb-4 flex-row items-center justify-between">
        <ThemedText size="xl" weight="bold" color="title">
          Chọn Icon Pack
        </ThemedText>

        <TouchableOpacity
          onPress={hide}
          activeOpacity={0.7}
          className="h-8 w-8 items-center justify-center rounded-full bg-text-base/5"
        >
          <Ionicons
            name="close"
            size={20}
            color={useAppStore.getState().theme.text}
          />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View className="mb-5 flex-row rounded-2xl bg-text-base/5 p-1">
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab("emotions")}
          className={`flex-1 items-center rounded-xl py-2.5 ${
            activeTab === "emotions"
              ? "bg-background2"
              : ""
          }`}
        >
          <ThemedText
            size="sm"
            weight="semibold"
            color={
              activeTab === "emotions"
                ? "title"
                : "text"
            }
            opacity={activeTab === "emotions" ? undefined : "medium"}
          >
            Cảm xúc (Mood)
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab("targets")}
          className={`flex-1 items-center rounded-xl py-2.5 ${
            activeTab === "targets"
              ? "bg-background2"
              : ""
          }`}
        >
          <ThemedText
            size="sm"
            weight="semibold"
            color={
              activeTab === "targets"
                ? "title"
                : "text"
            }
            opacity={activeTab === "targets" ? undefined : "medium"}
          >
            Mục tiêu (Target)
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === "emotions" ? (
        <View className="gap-y-4">
          {Object.entries(EMOTION_PACKS).map(([id, pack]) => (
            <EmotionPackCard
              key={id}
              pack={pack}
              isSelected={id === selectedEmotionPackId}
              onSelect={() => onSelectEmotionPack(id)}
            />
          ))}
        </View>
      ) : (
        <View className="gap-y-4">
          {Object.entries(TARGET_PACKS).map(([id, pack]) => (
            <TargetPackCard
              key={id}
              pack={pack}
              isSelected={id === selectedTargetPackId}
              onSelect={() => onSelectTargetPack(id)}
            />
          ))}
        </View>
      )}
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
}

const EmotionPackCard = ({
  pack,
  isSelected,
  onSelect,
}: EmotionPackCardProps) => {
  const { theme} = useAppStore();
  const isDark = useAppStore((state) => state.settings?.is_dark_mode??true)


  return (
    <TouchableOpacity
      onPress={onSelect}
      activeOpacity={0.7}
      className={`rounded-2xl border-2 p-4 ${
        isSelected
          ? "border-primary bg-primary/5"
          : "border-text-base/10 bg-background2/50"
      }`}
    >
      {/* Title & Selection Indicator */}
      <View className="mb-1 flex-row items-center justify-between">
        <ThemedText size="md" weight="bold" color="title">
          {pack.name}
        </ThemedText>

        {isSelected && (
          <Ionicons
            name="checkmark-circle"
            size={22}
            color={theme.primary}
          />
        )}
      </View>

      <ThemedText
        size="xs"
        color="text"
        opacity="medium"
        className="mb-3"
      >
        {pack.description}
      </ThemedText>

      {/* Preview Icons */}
      <View className="flex-row items-center justify-between pt-1">
        {pack.emotions.map((item: EmotionItem) => {
          const backgroundColor = isDark
              ? item.color.light
              : item.color.dark

          return (
            <View
              key={item.id}
              className="items-center gap-1"
            >
              <View
                style={{ backgroundColor }}
                className="h-10 w-10 items-center justify-center rounded-xl"
              >
                {item.icon}
              </View>

              <ThemedText
                size="tiny"
                weight="medium"
                color="text"
                opacity="medium"
              >
                Lvl {item.level}
              </ThemedText>
            </View>
          );
        })}
      </View>
    </TouchableOpacity>
  );
};

interface TargetPackCardProps {
  pack: TargetPack;
  isSelected: boolean;
  onSelect: () => void;
}

const TargetPackCard = ({
  pack,
  isSelected,
  onSelect,
}: TargetPackCardProps) => {
  const theme = useAppStore((state) => state.theme);
  const isDark = useAppStore(
    (state) => state.settings?.is_dark_mode ?? true,
  );

  return (
    <TouchableOpacity
      onPress={onSelect}
      activeOpacity={0.7}
      className={`rounded-2xl border-2 p-4 ${
        isSelected
          ? "border-primary bg-primary/5"
          : "border-text-base/10 bg-background2/50"
      }`}
    >
      {/* Title */}
      <View className="mb-1 flex-row items-center justify-between">
        <ThemedText size="md" weight="bold" color="title">
          {pack.name}
        </ThemedText>

        {isSelected && (
          <Ionicons
            name="checkmark-circle"
            size={22}
            color={theme.primary}
          />
        )}
      </View>

      <ThemedText
        size="xs"
        color="text"
        opacity="medium"
        className="mb-3"
      >
        {pack.description}
      </ThemedText>

      {/* Preview Targets */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
        className="pt-1"
      >
        {pack.targets.map((item: TargetItem) => {
          const backgroundColor = isDark
            ? item.color.dark
            : item.color.light;

          return (
            <View
              key={item.id}
              className="items-center gap-1"
            >
              <View
                style={{ backgroundColor }}
                className="h-9 w-9 items-center justify-center rounded-xl"
              >
                {item.icon}
              </View>

              <ThemedText
                size="tiny"
                weight="semibold"
                color="text"
                opacity="medium"
              >
                {item.targetHours}h
              </ThemedText>
            </View>
          );
        })}
      </ScrollView>
    </TouchableOpacity>
  );
};