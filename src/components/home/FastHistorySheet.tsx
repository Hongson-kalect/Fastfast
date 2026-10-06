import { getTarget } from "@/constants/data";
import { useDBService } from "@/hooks/useDBService";
import { FastSession } from "@/interfaces/db.type";
import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import { Feather, FontAwesome5 } from "@expo/vector-icons";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { FastDetail } from "../fast_detail";
import { ThemedText } from "../themed-text";

type HeaderProps = {
  data: FastSession[];
};

type ItemProps = {
  item: FastSession;
  onDelete: (id: string) => void;
};

const S_PER_HOUR = 3600;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / S_PER_HOUR);
  const minutes = Math.floor((seconds % S_PER_HOUR) / 60);

  if (hours > 0) {
    if (minutes < 1) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

function FastHistorySheet() {
  const dbService = useDBService();

  const [history, setHistory] = useState<FastSession[]>([]);

  const loadHistory = useCallback(async () => {
    const res = await dbService.getFastSessions();
    setHistory(res);
  }, [dbService]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const deleteFast = async (id: string) => {
    await dbService.deleteSession(id);
    await loadHistory();
  };

  return (
    <BottomSheetFlatList
      data={history}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View className="px-3">
          <FastHistoryItem item={item} onDelete={deleteFast} />
        </View>
      )}
      contentContainerStyle={{
        gap: 2,
      }}
      ListHeaderComponent={<FastHistoryHeader data={history} />}
      ListEmptyComponent={
        <View className="items-center justify-center px-3">
          <Text className="text-zinc-400 text-center">Không có dữ liệu</Text>
        </View>
      }
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Header                                                                     */
/* -------------------------------------------------------------------------- */
export const FastHistoryHeader = ({ data }: HeaderProps) => {
  const { theme } = useAppStore();

  const stats = useMemo(() => {
    const sessions = data.filter((item) => !item.is_deleted);
    const completed = sessions.filter((item) => item.status === "completed");

    const durations = completed
      .map((item) => Number(item.duration ?? 0))
      .filter((duration) => duration > 0);

    const totalDuration = durations.reduce(
      (sum, duration) => sum + duration,
      0,
    );

    const averageDuration =
      durations.length > 0 ? totalDuration / durations.length : 0;

    const targetSessions = completed.filter((item) => item.target_duration > 0);

    const targetReached = targetSessions.filter(
      (item) => Number(item.duration ?? 0) / S_PER_HOUR >= item.target_duration,
    ).length;

    const successRate =
      targetSessions.length > 0
        ? Math.round((targetReached / targetSessions.length) * 100)
        : 0;

    return {
      total: sessions.length,
      completed: completed.length,
      totalDuration,
      averageDuration,
      successRate,
    };
  }, [data]);

  return (
    <View className="px-4 pb-4 pt-2">
      {/* Header */}
      <View className="mb-4">
        <View className="flex-row items-center gap-2">
          <FontAwesome5 name="history" size={18} color={theme.primary} />

          <ThemedText size="xl" weight="bold" color="title">
            Fasts history
          </ThemedText>
        </View>

        <ThemedText
          size="xs"
          color="text"
          opacity="medium"
          style={{ marginTop: 4 }}
        >
          {stats.total} phiên nhịn · {stats.completed} hoàn thành
        </ThemedText>
      </View>

      {/* Stats */}
      <View className="flex-row gap-2">
        <StatCard
          value={formatTime(stats.totalDuration)}
          label="Total"
          color={theme.primary}
        />

        <StatCard
          value={formatTime(stats.averageDuration)}
          label="Average"
          color={theme.info}
        />

        <StatCard
          value={`${stats.successRate}%`}
          label="Target"
          color={theme.success}
        />
      </View>

      {/* Section label */}
      <View className="mt-5 px-1">
        <ThemedText size="xs" weight="medium" color="text" opacity="low">
          Recent fasts
        </ThemedText>
      </View>
    </View>
  );
};

type StatCardProps = {
  value: string;
  label: string;
  color: string;
};

const StatCard = ({ value, label, color }: StatCardProps) => {
  return (
    <View
      className="flex-1 items-center justify-center rounded-xl py-2.5"
      style={{
        backgroundColor: `${color}11`,
        borderWidth: 1,
        borderColor: `${color}22`,
      }}
    >
      <ThemedText size="sm" weight="bold" style={{ color }}>
        {value}
      </ThemedText>

      <ThemedText
        size="xxs"
        weight="medium"
        color="text"
        opacity="low"
        className="mt-1"
      >
        {label}
      </ThemedText>
    </View>
  );
};
/* -------------------------------------------------------------------------- */
/* Item                                                                       */
/* -------------------------------------------------------------------------- */
export const FastHistoryItem = ({ item, onDelete }: ItemProps) => {
  const { theme } = useAppStore();
  const { addModal, closeCurrentModal } = useModalStore();

  const durationHours = Number(item.duration ?? 0) / S_PER_HOUR;
  const targetHours = Number(item.target_duration ?? 0);

  const target = getTarget(targetHours || durationHours);

  const isActive = item.status === "active";
  const isFailed = item.status === "failed";
  const hasTarget = targetHours > 0;

  const activeDurationHours = isActive
    ? Math.max(0, Date.now() - item.start_time) / S_PER_HOUR
    : durationHours;

  const progressPercent = hasTarget
    ? Math.min(Math.round((activeDurationHours / targetHours) * 100), 100)
    : 100;

  const reached = hasTarget && durationHours >= targetHours;

  const status = (() => {
    if (isFailed) {
      return {
        label: "Bị hủy",
        color: theme.error,
      };
    }

    if (isActive) {
      return {
        label: `Đang nhịn · ${targetHours}h`,
        color: theme.primary,
      };
    }

    if (!hasTarget) {
      return {
        label: "Tự do",
        color: theme.success,
      };
    }

    if (reached) {
      return {
        label: `Đạt mục tiêu · ${targetHours}h`,
        color: theme.success,
      };
    }

    return {
      label: `Chưa đạt · ${targetHours}h`,
      color: theme.warning,
    };
  })();

  const startDate = new Date(item.start_time);
  const endDate = item.end_time ? new Date(item.end_time) : null;

  const formatDate = (date: Date) =>
    date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    });

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

  const dateRangeLabel = endDate
    ? `${formatTime(startDate)} ${formatDate(startDate)} → ${formatTime(endDate)} ${formatDate(endDate)}`
    : `${formatTime(startDate)} ${formatDate(startDate)}`;

  const handleLongPress = () => {
    addModal({
      type: "menu",
      title: "Fast actions",
      menuOptions: [
        {
          label: "Delete",
          onPress: () => {
            onDelete(item.id);
            closeCurrentModal();
          },
          icon: <Feather name="trash-2" size={20} color={theme.background} />,
          rightContent: (
            <Feather name="chevron-right" size={20} color={theme.background} />
          ),
          backgroundColor: theme.error,
        },
      ],
    });
  };

  const showDetail = () => {
    addModal({
      type: "custom",
      render: <FastDetail fast={item} />,
    });
  };

  const durationLabel = isFailed
    ? "--:--"
    : isActive
      ? "Fasting"
      : Number(item.duration ?? 0) > 0
        ? formatTime(new Date(item.duration))
        : "0h";

  return (
    <TouchableOpacity
      onLongPress={handleLongPress}
      onPress={showDetail}
      activeOpacity={0.75}
      className="mb-3 overflow-hidden rounded-2xl bg-background2"
    >
      <View className="px-4 py-3.5">
        {/* Main row */}
        <View className="flex-row items-center">
          {/* Target */}
          <View
            className="mr-3.5 h-11 w-11 items-center justify-center rounded-xl"
            style={{
              backgroundColor: `${status.color}12`,
            }}
          >
            <ThemedText size="lg">{target?.emoji || "⚡"}</ThemedText>
          </View>

          {/* Info */}
          <View className="min-w-0 flex-1">
            <View className="flex-row items-center gap-1.5">
              <View
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  backgroundColor: status.color,
                }}
              />

              <ThemedText
                size="sm"
                weight="semibold"
                color="title"
                numberOfLines={1}
                className="flex-1"
              >
                {status.label}
              </ThemedText>
            </View>

            <ThemedText
              size="xxs"
              color="text"
              opacity="medium"
              numberOfLines={1}
              className="mt-1"
            >
              {dateRangeLabel}
            </ThemedText>
          </View>

          {/* Duration */}
          <View className="ml-3 items-end">
            <ThemedText
              size="md"
              weight="bold"
              color={isFailed ? "error" : "title"}
            >
              {durationLabel}
            </ThemedText>

            {hasTarget && !isFailed && (
              <ThemedText
                size="xxs"
                weight="semibold"
                color={progressPercent >= 100 ? "success" : "text"}
                opacity={progressPercent >= 100 ? "full" : "low"}
                className="mt-0.5"
              >
                {progressPercent}%
              </ThemedText>
            )}
          </View>
        </View>
      </View>

      {/* Progress */}
      {hasTarget && (
        <View className="h-1.5 bg-text-base/5">
          <View
            className="h-full rounded-r-full"
            style={{
              width: `${Math.min(progressPercent, 100)}%`,
              backgroundColor: status.color,
            }}
          />
        </View>
      )}
    </TouchableOpacity>
  );
};

export default FastHistorySheet;
