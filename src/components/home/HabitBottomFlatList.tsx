import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ListRenderItemInfo, Text, TouchableOpacity, View } from "react-native";
import { FastSession, HabitLog } from "@/interfaces/db.type";
import { HabitDetailModal } from "./HabitDetailModal";
import LiquidCircle from "./Waterball";
import { RETAIN_LIMIT } from "@/database/shema/habit_logs";
import { FASTING_TARGETS } from "@/constants/data";
import useModalStore from "@/stores/modalStore";
import { useAppStore } from "@/stores/appStore";
import { useDBService } from "@/hooks/useDBService";
import { HabitLogComponent } from "./HabitBottomSheet";

interface HabitBottomFlatListProps {
  habitPercent?: number; // Ví dụ: 45% (0 -> 100)
  shieldCount?: number;
  onClose?: () => void;
}
const HabitBottomFlatList: React.FC<HabitBottomFlatListProps> = () => {
  const { addModal } = useModalStore();
  const { theme, userProfile, habit } = useAppStore();
  const dbService = useDBService();

  const [habitLogs, setHabitLogs] = useState<
    (HabitLog & FastSession)[]
  >([]);

  const [showAllHistory, setShowAllHistory] = useState(false);

  const [habitPercent, shieldCount, habitRetain] = useMemo(() => {
    return [
      habit?.habit_snap || 0,
      habit?.shield_snap || 0,
      habit?.habit_retain || 0,
    ];
  }, [habit]);

  const isMilestone35Reached =
    !!userProfile?.low_shield_clamable;

  const isMilestone70Reached =
    !!userProfile?.mid_shield_clamable;

  const isMilestone100Reached =
    !!userProfile?.full_shield_clamable;

  const getMotivationalText = useCallback((percent: number) => {
    if (percent >= 100) {
      return "👑 Bậc thầy kỷ luật! Bạn đã duy trì phong độ hoàn hảo.";
    }

    if (percent >= 70) {
      return "🔥 Thói quen cực kỳ vững chắc, tiếp tục phát huy nhé!";
    }

    if (percent >= 35) {
      return "🌱 Bạn đang hình thành thói quen rất tốt!";
    }

    return "💡 Mới bắt đầu hành trình, hãy kiên trì thêm vài phiên nữa!";
  }, []);

  /**
   * ================================
   * LOAD LOGS
   * ================================
   */

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const res = await dbService?.getHabitLogs();

      if (mounted) {
        setHabitLogs(res ?? []);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [dbService]);

  /**
   * ================================
   * OPEN DETAIL
   * ================================
   */

  const handleSelectHabit = useCallback(
    (
      log: HabitLog & FastSession,
      target?: (typeof FASTING_TARGETS)[0],
    ) => {
      addModal(
        <HabitDetailModal
          log={log}
          targetInfo={target}
        />,
      );
    },
    [addModal],
  );

  /**
   * ================================
   * HEADER
   * ================================
   */

  const renderHeader = useCallback(() => {
    return (
      <>
        {/* =================================
            HEADER
            ================================= */}

        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-row items-center gap-2">
            <Ionicons
              name="sparkles"
              size={20}
              color={theme.primary}
            />

            <Text className="text-xl font-bold text-white">
              Habit Index
            </Text>
          </View>

          <View className="flex-row items-center gap-4 rounded-lg px-3 py-1 bg-gray-700">
            <Text className="text-white text-xs font-bold opacity-60">
              Shield:
            </Text>

            <View className="flex-row items-center gap-1">
              <Text className="text-white font-bold text-lg">
                {shieldCount}
              </Text>

              <FontAwesome5
                name="shield-alt"
                size={16}
                color={theme.primary}
              />
            </View>
          </View>
        </View>

        {/* =================================
            HERO
            ================================= */}

        <TouchableOpacity
          onPress={() => {
            addModal(
              <HabitDetailModal />,
            );
          }}
          className="items-center my-3"
        >
          <LiquidCircle
            percent={habitPercent}
            size={120}
            color={theme.primary}
            retainPercent={
              (habitRetain / RETAIN_LIMIT) * 100
            }
            retainColor="#3B82F6"
          />

          <Text className="text-xs text-zinc-300 font-medium text-center mt-6 px-6">
            {getMotivationalText(habitPercent)}
          </Text>
        </TouchableOpacity>

        {/* =================================
            PROGRESS
            ================================= */}

        <View className="bg-zinc-900/80 p-4 rounded-2xl border border-white/5 my-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xs font-semibold text-zinc-400">
              Tiến trình
            </Text>
          </View>

          <View className="relative h-3 bg-zinc-700 rounded-full w-full overflow-hidden">
            <View
              className="h-full bg-primary rounded-full"
              style={{
                width: `${Math.min(habitPercent, 100)}%`,
              }}
            />
          </View>

          <View className="relative h-12 w-full flex-row justify-between px-1">
            {/* 0% */}

            <View className="items-center -ml-2 opacity-0">
              <View className="w-0.5 h-2 bg-zinc-600 mb-1" />

              <Text className="text-[10px] text-zinc-500">
                0%
              </Text>
            </View>

            {/* 35% */}

            <View className="absolute left-[35%] -translate-x-1/2 items-center">
              <View className="w-0.5 h-2 bg-zinc-600 mb-1" />

              <View
                className={`p-1 rounded-full ${
                  isMilestone35Reached
                    ? "bg-blue-500/20 border border-blue-500/50"
                    : "bg-zinc-800 opacity-40"
                }`}
              >
                <FontAwesome5
                  name="shield-alt"
                  size={10}
                  color={
                    isMilestone35Reached
                      ? "#60A5FA"
                      : "#71717A"
                  }
                />
              </View>

              <Text className="text-[10px] text-zinc-400 mt-0.5">
                35%
              </Text>
            </View>

            {/* 70% */}

            <View className="absolute left-[70%] -translate-x-1/2 items-center">
              <View className="w-0.5 h-2 bg-zinc-600 mb-1" />

              <View
                className={`p-1 rounded-full ${
                  isMilestone70Reached
                    ? "bg-blue-500/20 border border-blue-500/50"
                    : "bg-zinc-800 opacity-40"
                }`}
              >
                <FontAwesome5
                  name="shield-alt"
                  size={10}
                  color={
                    isMilestone70Reached
                      ? "#60A5FA"
                      : "#71717A"
                  }
                />
              </View>

              <Text className="text-[10px] text-zinc-400 mt-0.5">
                70%
              </Text>
            </View>

            {/* 100% */}

            <View className="items-center -mr-2">
              <View className="w-0.5 h-2 bg-zinc-600 mb-1" />

              <View
                className={`p-1 rounded-full ${
                  isMilestone100Reached
                    ? "bg-amber-500/20 border border-amber-500/50"
                    : "bg-zinc-800 opacity-40"
                }`}
              >
                <FontAwesome5
                  name="crown"
                  size={10}
                  color={
                    isMilestone100Reached
                      ? "#FBBF24"
                      : "#71717A"
                  }
                />
              </View>

              <Text className="text-[10px] text-zinc-400 mt-0.5">
                100%
              </Text>
            </View>
          </View>
        </View>

        {/* =================================
            HISTORY HEADER
            ================================= */}

        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-sm font-bold text-zinc-300">
            Lịch sử phiên gần đây
          </Text>

          <Text className="text-xs text-zinc-500">
            {habitLogs.length} phiên
          </Text>
        </View>
      </>
    );
  }, [
    theme.primary,
    shieldCount,
    habitPercent,
    habitRetain,
    isMilestone35Reached,
    isMilestone70Reached,
    isMilestone100Reached,
    getMotivationalText,
    habitLogs.length,
    addModal,
  ]);

  /**
   * ================================
   * ITEM
   * ================================
   */

  const renderItem = useCallback(
    ({
      item,
    }: ListRenderItemInfo<HabitLog & FastSession>) => {
      return (
        <HabitLogComponent
          log={item}
          onPress={handleSelectHabit}
        />
      );
    },
    [handleSelectHabit],
  );

  /**
   * ================================
   * EMPTY
   * ================================
   */

  const renderEmpty = useCallback(() => {
    return (
      <View className="mt-8 gap-3 items-center">
        <Text className="italic text-text-base/40">
          Chưa có lịch sử phiên gần đây
        </Text>
      </View>
    );
  }, []);

  /**
   * ================================
   * LIST
   * ================================
   */

  return (
    <View className="flex-1 bg-[#121318]">
      <BottomSheetFlatList
        data={habitLogs}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 80,
        }}
        showsVerticalScrollIndicator={false}
        bounces={false}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        removeClippedSubviews
        initialNumToRender={8}
        maxToRenderPerBatch={6}
        windowSize={5}
      />
    </View>
  );
};

export default HabitBottomFlatList;
