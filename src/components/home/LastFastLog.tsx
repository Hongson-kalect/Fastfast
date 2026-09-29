import { FASTING_TARGETS } from "@/constants/data";
import { FastSession } from "@/interfaces/db.type";
import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import { getRelativeTime } from "@/util/timer";
import { format } from "date-fns";
import { Pressable, View } from "react-native";
import { FastDetail } from "../fast_detail";
import { ThemedText } from "../themed-text";

interface Props {
  session: FastSession;
}

export const getSessionSummary = (session: FastSession) => {
  const targetSeconds = (session.target_duration || 0) * 3600;
  const actualSeconds = session.duration || 0;
  const theme = useAppStore.getState().theme;

  const percent =
    targetSeconds > 0
      ? Math.min(Math.round((actualSeconds / targetSeconds) * 100), 999)
      : 0;

  let statusText = "Interrupted";
  let statusColor = theme.error;
  let isSuccess = false;

  if (session.status === "completed" || percent >= 100) {
    statusText = "Completed";
    statusColor = theme.success;
    isSuccess = true;
  } else if (actualSeconds >= 16 * 3600) {
    statusText = "Ended early";
    statusColor = theme.warning;
  }

  const hours = Math.floor(actualSeconds / 3600);
  const minutes = Math.floor((actualSeconds % 3600) / 60);

  const formattedDuration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  return {
    percent,
    statusText,
    statusColor,
    formattedDuration,
    isSuccess,
  };
};

export const RecentFastCard = ({ session }: Props) => {
  const { theme } = useAppStore();

  const summary = getSessionSummary(session);

  const target = FASTING_TARGETS.find(
    (item) => item.hours === session.target_duration,
  );

  const accent = target?.colors.accent ?? theme.primary;
  const badgeBg = target?.colors.badgeBg ?? `${theme.primary}15`;
  const badgeText = target?.colors.badgeText ?? theme.primary;

  const startTime = session.start_time;
  const endTime = session.end_time ?? session.start_time;

  const progress = Math.min(summary.percent, 100);

  const { addModal } = useModalStore();
  const handlePress = () => {
    addModal({
      type: "custom",
      render: <FastDetail fast={session} />,
    });
  };

  return (
    <Pressable
      onPress={handlePress}
      className="my-2 w-full overflow-hidden rounded-3xl px-4 py-6"
      style={{
        backgroundColor: theme.background2,
      }}
    >
      {/* Target */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <ThemedText size="lg">{target?.emoji ?? "⏱️"}</ThemedText>

          <View className="ml-2">
            <View className="flex-row items-center">
              <ThemedText size="sm" weight="bold" style={{ color: accent }}>
                {target?.label ?? "Free fasting"}
              </ThemedText>

              {target?.level && (
                <View
                  className="ml-2 rounded-full px-2 py-0.5"
                  style={{
                    backgroundColor: badgeBg,
                  }}
                >
                  <ThemedText
                    size="xs"
                    weight="bold"
                    style={{
                      color: badgeText,
                    }}
                  >
                    {target.level}
                  </ThemedText>
                </View>
              )}
            </View>

            {session.target_duration && (
              <ThemedText
                size="xs"
                className="mt-0.5"
                style={{
                  color: theme.text + "66",
                }}
              >
                Target {session.target_duration}h
              </ThemedText>
            )}
          </View>
        </View>

        <ThemedText
          size="xs"
          style={{
            color: theme.text + "66",
          }}
        >
          {getRelativeTime(new Date(endTime))}
          {/* {format(startTime, "dd/MM")} */}
        </ThemedText>
      </View>

      {/* Duration */}
      <View className="mt-4 flex-row items-end justify-between">
        <View>
          <ThemedText
            size="xxl"
            weight="bold"
            style={{
              color: theme.title,
            }}
          >
            {summary.formattedDuration}
          </ThemedText>

          <ThemedText
            size="xs"
            className="mt-1"
            style={{
              color: theme.text + "88",
            }}
          >
            {format(startTime, "HH:mm")} → {format(endTime, "HH:mm")}
          </ThemedText>
        </View>

        {/* Status */}
        <View
          className="rounded-full px-2.5 py-1"
          style={{
            backgroundColor: `${summary.statusColor}15`,
          }}
        >
          <ThemedText
            size="xs"
            weight="bold"
            style={{
              color: summary.statusColor,
            }}
          >
            {summary.statusText}
          </ThemedText>
        </View>
      </View>

      {/* Progress */}
      <View className="mt-4">
        <View className="mb-2 flex-row justify-between">
          <ThemedText
            size="xs"
            style={{
              color: theme.text + "66",
            }}
          >
            Target progress
          </ThemedText>

          <ThemedText
            size="xs"
            weight="bold"
            style={{
              color: accent,
            }}
          >
            {summary.percent}%
          </ThemedText>
        </View>

        <View
          className="h-1.5 overflow-hidden rounded-full"
          style={{
            backgroundColor: `${accent}18`,
          }}
        >
          <View
            className="h-full rounded-full"
            style={{
              width: `${progress}%`,
              backgroundColor: accent,
            }}
          />
        </View>
      </View>
    </Pressable>
  );
};
