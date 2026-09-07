import { getTarget } from "@/constants/data";
import { useDBService } from "@/hooks/useDBService";
import { FastSession } from "@/interfaces/db.type";
import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import { Feather } from "@expo/vector-icons";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { FastDetail } from "../fast_detail";

type HeaderProps = {
  data: FastSession[];
};

type ItemProps = {
  item: FastSession;
  onPress: () => void;
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
  const [selectedHistory, setSelectedHistory] = useState<FastSession | null>(
    null,
  );

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

  const {addModal} = useModalStore();
    useEffect(() => {
      if (selectedHistory)
        addModal({
          type: "custom",
          render: <FastDetail fast={selectedHistory} />,
        });
    }, [selectedHistory]);

  return <BottomSheetFlatList
  data={history}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="px-2">
            <FastHistoryItem
              item={item}
              onDelete={deleteFast}
              onPress={() => setSelectedHistory(item)}
            />
          </View>
        )}
        contentContainerStyle={{
          gap: 2,
        }}

            ListHeaderComponent={<FastHistoryHeader data={history} />}
            ListEmptyComponent={<View><Text className="text-zinc-400 text-center">Không có dữ liệu</Text></View>}
          />

  return (
    <>
      <FastHistoryHeader data={history} />

      <BottomSheetFlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="px-2">
            <FastHistoryItem
              item={item}
              onDelete={deleteFast}
              onPress={() => setSelectedHistory(item)}
            />
          </View>
        )}
        contentContainerStyle={{
          gap: 2,
        }}
      />
    </>
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

  if (stats.total === 0) {
    return (
      <View className="px-1 pt-1 pb-3">
        <Text className="text-white text-base font-bold">Fasting history</Text>

        <Text className="text-zinc-500 text-xs mt-1">
          Chưa có phiên nhịn nào.
        </Text>
      </View>
    );
  }

  return (
    <View className="px-1 pt-1 pb-3">
      {/* Title */}
      <View className="flex-row items-end justify-between mb-3">
        <View>
          <Text className="text-white text-lg font-bold">Fasting history</Text>

          <Text className="text-zinc-500 text-xs mt-0.5">
            Tổng quan các phiên nhịn
          </Text>
        </View>

        <View
          className="flex-row items-center px-2 py-1 rounded-full"
          style={{
            backgroundColor: `${theme.success}15`,
          }}
        >
          <Text
            className="text-2xl font-semibold"
            style={{
              color: theme.primary,
            }}
          >
            {stats.total} Fasts
          </Text>
        </View>
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
          color="#60A5FA"
        />

        <StatCard
          value={`${stats.successRate}%`}
          label="Target"
          color={theme.success}
        />
      </View>

      <View className="mt-3 px-2 items-end">
        <Text className="text-xs font-medium text-text-base/50">
          Recent fasts
        </Text>
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
      className="flex-1 rounded-xl px-3 py-2.5 items-center justify-center"
      style={{
        backgroundColor: `${color}08`,
        borderWidth: 1,
        borderColor: `${color}15`,
      }}
    >
      <Text className="text-lg font-bold" style={{ color }}>
        {value}
      </Text>

      <Text className="text-zinc-600 text-xs mt-0.5">{label}</Text>
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/* Item                                                                       */
/* -------------------------------------------------------------------------- */

export const FastHistoryItem = ({ item, onPress, onDelete }: ItemProps) => {
  const { theme } = useAppStore();

  const durationHours = Number(item.duration ?? 0) / S_PER_HOUR;
  const target = getTarget(item.target_duration || durationHours);
  const isActive = item.status === "active";
  const isFailed = item.status === "failed";
  const reached =
    item.target_duration > 0 && durationHours >= item.target_duration;

  // Tính phần trăm tiến độ (giới hạn tối đa 100% cho thanh progress UI)
  const rawProgress =
    item.target_duration > 0
      ? (durationHours / item.target_duration) * 100
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

  return (
    <TouchableOpacity
      onLongPress={handleLongPress}
      activeOpacity={0.7}
      onPress={onPress}
      className="mb-2.5 rounded-xl bg-zinc-800 border border-white/10 overflow-hidden relative"
    >
      <View className="p-3.5 flex-row items-center justify-between">
        {/* Left Section: Emoji Icon & Titles */}
        <View className="flex-row items-center flex-1 mr-3">
          {/* Target Emoji Badge */}
          <View className="w-9 h-9 rounded-full items-center justify-center mr-3 bg-zinc-800/80 border border-white/5">
            <Text className="text-sm">{target?.emoji || "⚡"}</Text>
          </View>

          <View className="flex-1">
            {/* Status & Badge */}
            <View className="flex-row items-center gap-2">
              <Text
                className="text-xs font-semibold text-zinc-200"
                numberOfLines={1}
              >
                {statusLabel}
              </Text>

              {/* Dot chỉ thị trạng thái */}
              <View
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: statusColor }}
              />
            </View>

            {/* Time range label */}
            <Text
              className="text-[10px] text-zinc-500 mt-0.5"
              numberOfLines={1}
            >
              {dateRangeLabel}
            </Text>
          </View>
        </View>

        {/* Right Section: Duration & Percentage */}
        <View className="items-end">
          <Text className="text-sm font-bold text-zinc-100">
            {isFailed
              ? "--:--"
              : isActive
                ? "Fasting"
                : item.duration > 0
                  ? formatTime(item.duration)
                  : "0h"}
          </Text>

          {item.target_duration > 0 && !isFailed && (
            <Text className="text-[10px] font-medium text-zinc-400 mt-0.5">
              {Math.round(rawProgress)}%
            </Text>
          )}
        </View>
      </View>

      {/* Subtle Bottom Progress Bar */}
      {item.target_duration > 0 && (
        <View className="w-full h-[3px] bg-zinc-800/60">
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
