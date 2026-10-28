import { View } from "react-native";
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
};

export default function PixelDailyFast({
  circularSegments,
  totalDuration,
  isLoadingFasts,
  fastIds,
  log,
  fastObj,
}: Props) {
  const t = useT();
  return (
    <View className="gap-y-5">
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
              {fastIds.length} phiên
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