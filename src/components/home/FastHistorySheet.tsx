import { getTarget } from "@/constants/data";
import { useDBService } from "@/hooks/useDBService";
import { FastSession } from "@/interfaces/db.type";
import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import { hourFormat } from "@/util/timer";
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

  const durationSeconds = Number(item.duration ?? 0);
  const durationHours = durationSeconds / S_PER_HOUR;
  const targetHours = Number(item.target_duration ?? 0);

  const target = getTarget(targetHours || durationHours);

  const isActive = item.status === "active";
  const isFailed = item.status === "failed";
  const hasTarget = targetHours > 0;

  const activeDurationSeconds = isActive
    ? Math.max(0, Math.floor((Date.now() - item.start_time) / 1000))
    : durationSeconds;

  const displayDuration = isActive
    ? hourFormat(activeDurationSeconds)
    : isFailed && durationSeconds <= 0
      ? "--:--"
      : hourFormat(durationSeconds);

  const progressHours = activeDurationSeconds / S_PER_HOUR;

  const progressPercent = hasTarget
    ? Math.min(Math.round((progressHours / targetHours) * 100), 100)
    : 100;

  const reached = hasTarget && durationHours >= targetHours;

  const status = (() => {
    if (isFailed) {
      return {
        label: "Bị hủy",
        color: theme.error,
        icon: "x-circle" as const,
      };
    }

    if (isActive) {
      return {
        label: "Đang nhịn",
        color: theme.primary,
        icon: "clock" as const,
      };
    }

    if (!hasTarget) {
      return {
        label: "Tự do",
        color: theme.success,
        icon: "zap" as const,
      };
    }

    if (reached) {
      return {
        label: "Đạt mục tiêu",
        color: theme.success,
        icon: "check-circle" as const,
      };
    }

    return {
      label: "Chưa đạt",
      color: theme.warning,
      icon: "alert-circle" as const,
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

  return (
    <TouchableOpacity
      onLongPress={handleLongPress}
      onPress={showDetail}
      activeOpacity={0.75}
      className="mb-3 overflow-hidden rounded-2xl bg-background2"
    >
      <View className="px-3 py-2">
        {/* Main content */}
        <View className="flex-row items-center gap-3">
          {/* Target icon */}
          <View
            className="h-14 w-14 items-center justify-center rounded-2xl"
            style={{
              backgroundColor: `${target?.colors.accent || theme.primary}20`,
            }}
          >
            <ThemedText size="lg">{target?.emoji || "⚡"}</ThemedText>
          </View>

          {/* Duration + status */}
          <View className="min-w-0 flex-1 justify-between">
            <View className="flex-row justify-between">
              <ThemedText
                size="xl"
                weight="bold"
                color={isFailed ? "error" : "title"}
                numberOfLines={1}
              >
                {displayDuration}
              </ThemedText>

              <View
                className="flex-row items-center gap-1.5 px-2 py-1 rounded-full"
                style={{ backgroundColor: `${status.color}12` }}
              >
                <Feather name={status.icon} size={10} color={status.color} />

                <ThemedText
                  size="xxs"
                  weight="medium"
                  colorHex={status.color}
                  numberOfLines={1}
                >
                  {status.label}
                </ThemedText>
              </View>
            </View>

            <View className="flex-row justify-between">
              <View className="flex-row items-center gap-1.5">
                {target ? (
                  <View
                    className="rounded-full px-2 py-0.5"
                    style={{
                      backgroundColor: target.colors.accent + "20",
                    }}
                  >
                    <ThemedText
                      size="xs"
                      weight="medium"
                      colorHex={target.colors.accent}
                    >
                      {target?.label}
                    </ThemedText>
                  </View>
                ) : (
                  <View
                    className="rounded-lg px-2 py-0.5"
                    style={{
                      backgroundColor: `${theme.success}12`,
                    }}
                  >
                    <ThemedText
                      size="xs"
                      weight="semibold"
                      colorHex={theme.success}
                    >
                      Tự do
                    </ThemedText>
                  </View>
                )}
              </View>

              {hasTarget && !isFailed && (
                <ThemedText
                  size="xs"
                  weight="semibold"
                  color={progressPercent >= 100 ? "success" : "text"}
                  opacity={progressPercent >= 100 ? "full" : "low"}
                >
                  {Math.round((progressHours / targetHours) * 100)}%
                </ThemedText>
              )}
            </View>
          </View>
        </View>

        {/* Progress bar */}
        {hasTarget && (
          <View className="h-1.5 bg-text-base/5 rounded-full overflow-hidden mt-2">
            <View
              className="h-full rounded-r-full"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: status.color,
              }}
            />
          </View>
        )}

        {/* Date range */}
        <View className="mt-2 flex-row items-center gap-1.5">
          <Feather
            name="clock"
            size={10}
            color={theme.text}
            style={{ opacity: 0.5 }}
          />

          <ThemedText size="xxs" color="text" opacity="half" numberOfLines={1}>
            {dateRangeLabel}
          </ThemedText>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default FastHistorySheet;
