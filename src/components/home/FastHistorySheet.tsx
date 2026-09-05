import { getTarget } from "@/constants/data";
import { FastSession } from "@/interfaces/db.type";
import { useBottomSheet } from "@/provider/BottomSheet";
import { useAppStore } from "@/stores/appStore";
import { useMemo } from "react";
import { Text, TouchableOpacity, View } from "react-native";

type HeaderProps = {
  data: FastSession[];
};

type ItemProps = {
  item: FastSession;
  onPress: () => void;
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
      completed.length > 0
        ? Math.round((targetReached / completed.length) * 100)
        : 0;

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

        {stats.active > 0 && (
          <View
            className="flex-row items-center px-2 py-1 rounded-full"
            style={{
              backgroundColor: `${theme.success}15`,
            }}
          >
            <View
              className="w-1.5 h-1.5 rounded-full mr-1.5"
              style={{
                backgroundColor: theme.success,
              }}
            />

            <Text
              className="text-[9px] font-semibold"
              style={{
                color: theme.success,
              }}
            >
              fasting
            </Text>
          </View>
        )}
      </View>

      {/* Stats */}
      <View className="flex-row gap-2">
        <StatCard
          value={String(stats.total)}
          label="Sessions"
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

      {/* Total duration */}
      <View
        className="mt-2 px-2 py-2.5 rounded-xl flex-row items-center justify-between"
        style={{
          backgroundColor: `${theme.primary}08`,
          borderWidth: 1,
          borderColor: `${theme.primary}15`,
        }}
      >
        <Text className="text-zinc-500 text-xs">Total fasting time</Text>

        <Text
          className="text-sm font-bold"
          style={{
            color: theme.primary,
          }}
        >
          {formatTime(stats.totalDuration)}
        </Text>
      </View>

      <View className="mt-3 px-2 items-end">
        <Text className="text-xs font-medium text-text-base/50">
          Current fasting
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

export const FastHistoryItem = ({ item, onPress }: ItemProps) => {
  const { theme } = useAppStore();
  const { present } = useBottomSheet();

  const durationHours = Number(item.duration ?? 0) / S_PER_HOUR;
  const target = getTarget(item.target_duration || durationHours);

  const reached =
    item.target_duration > 0 && durationHours >= item.target_duration;

  const isActive = item.status === "active";

  //   const statusColor = isActive
  //     ? theme.success
  //     : reached
  //       ? theme.primary
  //       : theme.error;

  const [statusLabel, statusColor] = !item.target_duration
    ? ["Hoàn thành phiên nhịn", theme.success]
    : item.status === "failed"
      ? ["Bị hủy", theme.error]
      : isActive
        ? [
            "Đang nhịn " +
              (item.target_duration ? item.target_duration + "h" : ""),
            theme.primary,
          ]
        : reached
          ? ["Đã đạt mục tiêu " + item.target_duration + "h", theme.success]
          : ["Chưa đạt mục tiêu " + item.target_duration + "h", theme.warning];

  const date = new Date(item.start_time);

  const dateLabel = date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      className="mb-2 rounded-xl border px-3.5 py-2.5 overflow-hidden"
      style={{
        borderWidth: 0.5,
        // backgroundColor: target?.colors.accent + "22",
        borderColor: `${statusColor}88`,
      }}
    >
      <View className="absolute inset-0">
        <View
          style={{
            height: "100%",
            borderRadius: 12,
            backgroundColor: `${statusColor}22`,
            width: `${!item.target_duration ? "100" : Math.round((durationHours / item.target_duration) * 100)}%`,
          }}
        ></View>
      </View>
      <View className="flex-row items-center">
        {/* Icon */}
        <View
          className="w-8 h-8 rounded-full items-center justify-center mr-3"
          style={{
            backgroundColor: `${target?.colors.accent}88`,
          }}
        >
          <Text className="text-xs">{target ? target.emoji : ""}</Text>
        </View>

        {/* Main */}
        <View className="flex-1">
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center">
              <Text
                className="text-xs font-medium"
                style={{
                  color: statusColor,
                }}
              >
                {statusLabel}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Text
                style={{
                  color: statusColor,
                }}
                className="text-white font-bold"
                numberOfLines={1}
              >
                {item?.status === "failed"
                  ? null
                  : item?.status === "active"
                    ? "Fasting"
                    : item.duration > 0
                      ? formatTime(item.duration)
                      : ""}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between mt-1">
            <View className="flex-row items-center">
              <Text className="text-zinc-500 text-[9px]">
                {dateLabel} - {dateLabel}{" "}
              </Text>
            </View>
            {item.target_duration > 0 ? (
              <Text
                className="text-[9px] opacity-60"
                style={{
                  color: reached ? theme.success : theme.warning,
                }}
              >
                {Math.round((durationHours / item.target_duration) * 100)}%
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default FastHistoryHeader;
