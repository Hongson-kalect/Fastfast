import { FASTING_TARGETS } from "@/constants/data";
import { RETAIN_LIMIT } from "@/database/shema/habit_logs";
import { useDBService } from "@/hooks/useDBService";
import { FastSession, HabitLog } from "@/interfaces/db.type";
import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ListRenderItemInfo, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../themed-text";
import { HabitLogComponent } from "./HabitBottomSheet";
import { HabitDetailModal } from "./HabitDetailModal";
import LiquidCircle from "./Waterball";

interface HabitBottomFlatListProps {
  habitPercent?: number; // Ví dụ: 45% (0 -> 100)
  shieldCount?: number;
  onClose?: () => void;
}
const HabitBottomFlatList: React.FC<HabitBottomFlatListProps> = () => {
  const { addModal } = useModalStore();
  const { theme, userProfile, habit } = useAppStore();
  const dbService = useDBService();

  const [habitLogs, setHabitLogs] = useState<(HabitLog & FastSession)[]>([]);

  const [showAllHistory, setShowAllHistory] = useState(false);

  const [habitPercent, shieldCount, habitRetain] = useMemo(() => {
    return [
      habit?.habit_snap || 0,
      habit?.shield_snap || 0,
      habit?.habit_retain || 0,
    ];
  }, [habit]);

  const isMilestone35Reached = !!userProfile?.low_shield_clamable;

  const isMilestone70Reached = !!userProfile?.mid_shield_clamable;

  const isMilestone100Reached = !!userProfile?.full_shield_clamable;

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
    (log: HabitLog & FastSession, target?: (typeof FASTING_TARGETS)[0]) => {
      addModal(<HabitDetailModal log={log} targetInfo={target} />);
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

        <View className="mb-4 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Ionicons name="sparkles" size={20} color={theme.primary} />

            <ThemedText size="xl" weight="bold">
              Habit Index
            </ThemedText>
          </View>

          <View className="flex-row items-center gap-4 rounded-lg bg-background2 px-3 py-1">
            <ThemedText size="xs" weight="bold" color="text" opacity="medium">
              Shield:
            </ThemedText>

            <View className="flex-row items-center gap-1">
              <ThemedText size="lg" weight="bold">
                {shieldCount}
              </ThemedText>

              <FontAwesome5 name="shield-alt" size={16} color={theme.primary} />
            </View>
          </View>
        </View>

        {/* =================================
    HERO
    ================================= */}

        <TouchableOpacity
          onPress={() => {
            addModal(<HabitDetailModal />);
          }}
          className="my-3 items-center"
        >
          <LiquidCircle
            percent={habitPercent}
            size={120}
            color={theme.primary}
            retainPercent={(habitRetain / RETAIN_LIMIT) * 100}
            retainColor={theme.primary}
          />

          <ThemedText
            size="xs"
            weight="medium"
            color="text"
            opacity="medium"
            style={{
              marginTop: 24,
              paddingHorizontal: 24,
              textAlign: "center",
            }}
          >
            {getMotivationalText(habitPercent)}
          </ThemedText>
        </TouchableOpacity>

        {/* =================================
    PROGRESS
    ================================= */}

        <View className="my-4 rounded-2xl border border-text-base/5 bg-background2/80 p-4">
          <View className="mb-4 flex-row items-center justify-between">
            <ThemedText
              size="xs"
              weight="semibold"
              color="text"
              opacity="medium"
            >
              Tiến trình
            </ThemedText>
          </View>

          <View className="relative h-3 w-full overflow-hidden rounded-full bg-text-base/20">
            <View
              className="h-full rounded-full bg-primary"
              style={{
                width: `${Math.min(habitPercent, 100)}%`,
              }}
            />
          </View>

          <View className="relative h-12 w-full flex-row justify-between px-1">
            {/* 0% */}
            <View className="-ml-2 items-center opacity-0">
              <View className="mb-1 h-2 w-0.5 bg-text-base/30" />

              <ThemedText size="xxs" color="text" opacity="medium">
                0%
              </ThemedText>
            </View>

            {/* 35% */}
            <View className="absolute left-[35%] -translate-x-1/2 items-center">
              <View className="mb-1 h-2 w-0.5 bg-text-base/30" />

              <View
                className={
                  isMilestone35Reached
                    ? "rounded-full border border-primary/50 bg-primary/20 p-1"
                    : "rounded-full bg-background2 p-1 opacity-40"
                }
              >
                <FontAwesome5
                  name="shield-alt"
                  size={10}
                  color={isMilestone35Reached ? theme.primary : theme.text}
                  style={{
                    opacity: isMilestone35Reached ? 1 : 0.5,
                  }}
                />
              </View>

              <ThemedText
                size="xxs"
                color="text"
                opacity="medium"
                style={{ marginTop: 2 }}
              >
                35%
              </ThemedText>
            </View>

            {/* 70% */}
            <View className="absolute left-[70%] -translate-x-1/2 items-center">
              <View className="mb-1 h-2 w-0.5 bg-text-base/30" />

              <View
                className={
                  isMilestone70Reached
                    ? "rounded-full border border-primary/50 bg-primary/20 p-1"
                    : "rounded-full bg-background2 p-1 opacity-40"
                }
              >
                <FontAwesome5
                  name="shield-alt"
                  size={10}
                  color={isMilestone70Reached ? theme.primary : theme.text}
                  style={{
                    opacity: isMilestone70Reached ? 1 : 0.5,
                  }}
                />
              </View>

              <ThemedText
                size="xxs"
                color="text"
                opacity="medium"
                style={{ marginTop: 2 }}
              >
                70%
              </ThemedText>
            </View>

            {/* 100% */}
            <View className="-mr-2 items-center">
              <View className="mb-1 h-2 w-0.5 bg-text-base/30" />

              <View
                className={
                  isMilestone100Reached
                    ? "rounded-full border border-amber-500/50 bg-amber-500/20 p-1"
                    : "rounded-full bg-background2 p-1 opacity-40"
                }
              >
                <FontAwesome5
                  name="crown"
                  size={10}
                  color={isMilestone100Reached ? "#FBBF24" : theme.text}
                  style={{
                    opacity: isMilestone100Reached ? 1 : 0.5,
                  }}
                />
              </View>

              <ThemedText
                size="xxs"
                color="text"
                opacity="medium"
                style={{ marginTop: 2 }}
              >
                100%
              </ThemedText>
            </View>
          </View>
        </View>

        {/* =================================
    HISTORY HEADER
    ================================= */}

        <View className="mb-3 flex-row items-center justify-between">
          <ThemedText size="sm" weight="bold" color="text" opacity="medium">
            Lịch sử phiên gần đâyyyy
          </ThemedText>

          <ThemedText size="xs" color="text" opacity="medium">
            {habitLogs.length} phiên
          </ThemedText>
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
    ({ item }: ListRenderItemInfo<HabitLog & FastSession>) => {
      return <HabitLogComponent log={item} />;
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
        <ThemedText color="text" opacity="low" style={{ fontStyle: "italic" }}>
          Chưa có lịch sử phiên gần đây
        </ThemedText>
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
