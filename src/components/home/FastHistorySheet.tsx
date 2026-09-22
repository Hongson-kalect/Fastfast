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

    const active = sessions.filter((item) => item.status === "active");

    const durations = completed
      .map((item) => Number(item.duration ?? 0))
      .filter((duration) => duration > 0);

    const totalDuration = durations.reduce(
      (sum, duration) => sum + duration,
      0,
    );

    const averageDuration =
      durations.length > 0 ? totalDuration / durations.length : 0;

    let haveTarget = 0;
    let targetReached = 0;
    completed.forEach((item) => {
      if (item.target_duration) {
        haveTarget++;
        if (item.duration / S_PER_HOUR >= item.target_duration) {
          targetReached++;
        }
      }
    });

    const successRate =
      completed.length > 0 ? Math.round((targetReached / haveTarget) * 100) : 0;

    return {
      total: sessions.length,
      completed: completed.length,
      active: active.length,
      totalDuration: totalDuration,
      averageDuration: averageDuration,
      successRate,
    };
  }, [data]);

  return (
    <View className="px-4 pb-4 pt-1">
      {/* Title */}
      <View className="mb-3 flex-row items-end justify-between">
        <View>
          <View className="flex-row items-center gap-2">
            <FontAwesome5 name="history" size={20} color={theme.primary} />

            <ThemedText size="xl" weight="bold" color="text">
              Fasts history
            </ThemedText>
          </View>

          <ThemedText
            size="xs"
            color="text"
            opacity="medium"
            style={{ marginTop: 2 }}
          >
            Tổng quan các phiên nhịn
          </ThemedText>
        </View>

        <View
          className="flex-row items-center rounded-full py-1 px-4"
          style={{
            backgroundColor: `${theme.success}15`,
          }}
        >
          <ThemedText size="xxl" weight="semibold" color="primary">
            {stats.total} Fasts
          </ThemedText>
        </View>
      </View>

      {/* Stats */}
      <View className="flex-row items-center justify-between gap-2 mt-2">
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

      <View className="mt-5 items-end px-2">
        <ThemedText size="xs" weight="medium" color="text" opacity="low">
          Recent fasts
        </ThemedText>
      </View>
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/* Stat Card                                                                  */
/* -------------------------------------------------------------------------- */

type StatCardProps = {
  value: string;
  label: string;
  color: string;
};

const StatCard = ({ value, label, color }: StatCardProps) => {
  return (
    <View
      className="flex-1 rounded-xl py-2.5 items-center justify-center"
      style={{
        backgroundColor: `${color}11`,
        borderWidth: 1,
        borderColor: `${color}22`,
      }}
    >
      <Text className="text-base font-semibold" style={{ color }}>
        {value}
      </Text>

      <Text className="text-zinc-600 text-xs mt-1">{label}</Text>
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/* Item                                                                       */
/* -------------------------------------------------------------------------- */

export const FastHistoryItem = ({ item, onDelete }: ItemProps) => {
  const { theme } = useAppStore();

  const durationHours = Number(item.duration ?? 0) / S_PER_HOUR;
  const target = getTarget(item.target_duration || durationHours);
  const isActive = item.status === "active";
  const isFailed = item.status === "failed";
  const reached =
    item.target_duration > 0 && durationHours >= item.target_duration;

  if (isActive)
    console.log(
      Date.now(),
      item.start_time,
      item.target_duration,
      (Date.now() - item.start_time) / item.target_duration / 36000,
    );

  // Tính phần trăm tiến độ (giới hạn tối đa 100% cho thanh progress UI)
  const rawProgress =
    item.target_duration > 0
      ? isActive
        ? (Date.now() - item.start_time) / item.target_duration / 36000
        : (durationHours / item.target_duration) * 100
      : 100;
  const progressPercent = Math.min(Math.round(rawProgress), 100);

  // Status Meta Config
  const getStatusMeta = () => {
    if (!item.target_duration) {
      return { label: "Tự do", color: theme.success };
    }
    if (isFailed) {
      return { label: "Bị hủy", color: theme.error };
    }
    if (isActive) {
      return {
        label: `Đang nhịn (${item.target_duration}h)`,
        color: theme.primary,
      };
    }
    if (reached) {
      return {
        label: `Mục tiêu ${item.target_duration}h`,
        color: theme.success,
      };
    }
    return {
      label: `Chưa đạt (${item.target_duration}h)`,
      color: theme.warning,
    };
  };

  const { label: statusLabel, color: statusColor } = getStatusMeta();

  // Date Formatting
  const startDate = new Date(item.start_time);
  const endDate = item.end_time ? new Date(item.end_time) : null;
  const { addModal } = useModalStore();
  const handleLongPress = () => {
    addModal({
      type: "menu",
      menuOptions: [
        {
          label: "Delete",
          onPress: () => {
            onDelete(item.id);
            addModal(null);
          },
          icon: <Feather name="trash-2" size={20} color={"white"} />,
          rightContent: (
            <Feather name="chevron-right" size={20} color={"white"} />
          ),
          backgroundColor: theme.error,
        },
      ],
      title: "Fast actions",
    });
  };

  const formatDate = (d: Date) =>
    d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });

  const formatTimeStr = (d: Date) =>
    d.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

  const dateRangeLabel = endDate
    ? `${formatTimeStr(startDate)} ${formatDate(startDate)} - ${formatTimeStr(endDate)} ${formatDate(endDate)}`
    : `${formatTimeStr(startDate)} ${formatDate(startDate)}`;

  const showDetail = () => {
    addModal({
      type: "custom",
      render: <FastDetail fast={item} />,
    });
  };

  return (
    <TouchableOpacity
      onLongPress={handleLongPress}
      activeOpacity={0.7}
      onPress={showDetail}
      className="relative mb-2.5 overflow-hidden rounded-xl border border-text-base/10 bg-background2"
    >
      <View className="flex-row items-center justify-between p-3.5">
        {/* Left Section: Emoji Icon & Titles */}
        <View className="mr-3 flex-1 flex-row items-center">
          {/* Target Emoji Badge */}
          <View className="mr-3 h-9 w-9 items-center justify-center rounded-full border border-text-base/5 bg-background2/80">
            <Text className="text-sm">{target?.emoji || "⚡"}</Text>
          </View>

          <View className="flex-1">
            {/* Status & Badge */}
            <View className="flex-row items-center gap-2">
              <ThemedText
                size="xs"
                weight="semibold"
                color="text"
                numberOfLines={1}
              >
                {statusLabel}
              </ThemedText>

              {/* Dot chỉ thị trạng thái */}
              <View
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: statusColor }}
              />
            </View>

            {/* Time range label */}
            <ThemedText
              size="xxs"
              color="text"
              opacity="medium"
              numberOfLines={1}
              style={{ marginTop: 2 }}
            >
              {dateRangeLabel}
            </ThemedText>
          </View>
        </View>

        {/* Right Section: Duration & Percentage */}
        <View className="items-end">
          <ThemedText size="sm" weight="semibold" color="text">
            {isFailed
              ? "--:--"
              : isActive
                ? "Fasting"
                : item.duration > 0
                  ? formatTime(item.duration)
                  : "0h"}
          </ThemedText>

          {item.target_duration > 0 && !isFailed && (
            <ThemedText
              size="xxs"
              weight="medium"
              color="text"
              opacity="medium"
              style={{ marginTop: 2 }}
            >
              {Math.round(rawProgress)}%
            </ThemedText>
          )}
        </View>
      </View>

      {/* Subtle Bottom Progress Bar */}
      {item.target_duration > 0 && (
        <View className="h-[3px] w-full bg-background/60">
          <View
            style={{
              height: "100%",
              width: `${progressPercent}%`,
              backgroundColor: isFailed ? theme.error : statusColor,
            }}
          />
        </View>
      )}
    </TouchableOpacity>
  );
};

export default FastHistorySheet;
