import { FontAwesome5 } from "@expo/vector-icons";
import { View } from "react-native";
import { useAppStore } from "@/stores/appStore";
import Circular24hTimeline, { CircularTimelineSegment } from "./Circular24hTimeline";
import { DailyLog, FastSession } from "@/interfaces/db.type";
import { DissectedDay } from "@/utils/home/timespliter";
import { ThemedText } from "../themed-text";
import { DailyFastSessionCard } from "./DailySessionFast";
import { useT } from "@/providers/Language";

type Props = {
  circularSegments: CircularTimelineSegment[];
  totalDuration: number;
  isLoadingFasts: boolean;
  fastIds: string[];
  log: (DailyLog | DissectedDay)[];
  fastObj: Record<string, FastSession>;
  /** Ngày nghỉ được khiên giữ chuỗi */
  restDay?: boolean;
};

/** Thẻ ngày nghỉ: ô có icon khiên trong lịch, không có phiên nhịn nào. */
const RestDayCard = () => {
  const t = useT();
  const theme = useAppStore((state) => state.theme);

  return (
    <View className="items-center rounded-2xl border border-text-base/10 bg-background2 px-5 py-7">
      <View
        className="mb-3 h-14 w-14 items-center justify-center rounded-full"
        style={{ backgroundColor: theme.primary + "1F" }}
      >
        <FontAwesome5 name="shield-alt" size={24} color={theme.primary} />
      </View>
      <ThemedText size="lg" weight="bold" color="title">
        {t("pixelDetail.restTitle")}
      </ThemedText>
      <ThemedText
        size="sm"
        color="text"
        opacity="medium"
        className="mt-1.5 text-center"
        style={{ lineHeight: 20 }}
      >
        {t("pixelDetail.restBody")}
      </ThemedText>
    </View>
  );
};

export default function PixelDailyFast({
  circularSegments,
  totalDuration,
  isLoadingFasts,
  fastIds,
  log,
  fastObj,
  restDay = false,
}: Props) {
  const t = useT();
  return (
    <View className="gap-y-5">
      {restDay && <RestDayCard />}

      {/* Ngày nghỉ không có phiên nào: bỏ vòng 24h trống */}
      {!(restDay && log.length === 0) && (
      <View className="items-center justify-center rounded-2xl border border-text-base/10 bg-background2 p-5">
        <Circular24hTimeline
          segments={circularSegments}
          totalDuration={totalDuration}
          size={220}
          strokeWidth={14}
          isLoading={isLoadingFasts}
          animated
        />
      </View>
      )}

      {fastIds.length > 0 && (
        <View>
          <View className="mb-2.5 flex-row items-center justify-between px-1">
            <ThemedText
              size="xs"
              weight="semibold"
              color="text"
              style={{ letterSpacing: 1 }}
            >
              {t("pixelDetail.relatedFasts")}
            </ThemedText>

            <ThemedText size="xs" color="text" opacity="medium">
              {t("pixelDetail.sessionCount", { count: fastIds.length })}
            </ThemedText>
          </View>

          <View className="gap-y-2">
            {log.map((item, index) => (
              <DailyFastSessionCard
                key={item.fast_id}
                index={index}
                fast={fastObj[item.fast_id] ?? null}
                dailyLog={item}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}