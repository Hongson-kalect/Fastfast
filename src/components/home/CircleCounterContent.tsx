import { RADIUS } from "@/constants/design";
import { FASTING_TARGETS } from "@/constants/data";
import { ThemeType } from "@/constants/themes";
import { AppSettings, FastSession } from "@/interfaces/db.type";
import { getRelativeDate, getRelativeTime } from "@/utils/timer";
import { Feather } from "@expo/vector-icons";
import { Pressable, View } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOutUp,
  LinearTransition,
} from "react-native-reanimated";
import { ThemedText } from "../themed-text";
import Counter from "./Counter";

type Props = {
  isCounting: boolean;
  counter: number;
  currentFast: FastSession | null;
  currentTarget: (typeof FASTING_TARGETS)[number] | null;
  settings: AppSettings | null;
  theme: ThemeType;
  finishEstimate: Date | null;
  openFastingSheet: () => void;
  openTargetSheet: () => void;
  showHistory: () => void;
  phaseTitle?: string;
  ringColor: string;
  diameter: number;
};

/** Chip mục tiêu: chạm để đổi mục tiêu. */
const TargetChip = ({
  label,
  color,
  onPress,
}: {
  label: string;
  color: string;
  onPress: () => void;
}) => (
  <Pressable
    onPress={onPress}
    hitSlop={10}
    className="flex-row items-center gap-1.5 px-3 py-1.5"
    style={{ borderRadius: RADIUS.pill, backgroundColor: color + "22" }}
  >
    <Feather name="target" size={13} color={color} />
    <ThemedText size="xs" weight="bold" colorHex={color}>
      {label}
    </ThemedText>
    <Feather name="chevron-down" size={13} color={color} />
  </Pressable>
);

export const CircleCounterContent = ({
  isCounting,
  counter,
  currentFast,
  currentTarget,
  settings,
  theme,
  finishEstimate,
  openFastingSheet,
  openTargetSheet,
  showHistory,
  phaseTitle,
  ringColor,
  diameter,
}: Props) => {
  const active = isCounting && !!currentFast;
  const targetHours = Number(settings?.target || 0);
  const targetLabel = currentTarget
    ? `${currentTarget.label} · ${targetHours}h`
    : "Chọn mục tiêu";
  const reached = active && targetHours > 0 && counter >= targetHours * 3_600;

  let subtitle: string;
  if (active) {
    if (reached) subtitle = "🎉 Đã đạt mục tiêu";
    else if (finishEstimate) subtitle = `Xong lúc ${getRelativeDate(finishEstimate)}`;
    else subtitle = "Chế độ tự do";
  } else {
    subtitle = finishEstimate
      ? `Nếu bắt đầu bây giờ: ${getRelativeDate(finishEstimate)}`
      : "Chế độ tự do";
  }

  return (
    <View
      className="absolute items-center justify-center overflow-hidden"
      style={{ width: diameter, height: diameter, borderRadius: diameter / 2 }}
    >
      <View className="h-full w-full items-center justify-between px-4 pb-9 pt-9">
        {/* Top: mục tiêu */}
        <Animated.View
          key={`top-${active}-${currentTarget?.id ?? "none"}`}
          entering={FadeInDown.duration(250)}
          exiting={FadeOutUp.duration(150)}
          className="items-center gap-1.5"
        >
          <TargetChip
            label={targetLabel}
            color={currentTarget?.colors.accent ?? theme.primary}
            onPress={openTargetSheet}
          />
        </Animated.View>

        {/* Center: đồng hồ */}
        <Pressable
          onPress={active ? openFastingSheet : openTargetSheet}
          hitSlop={10}
          className="my-auto items-center justify-center"
        >
          <ThemedText
            size="xs"
            weight="bold"
            colorHex={active ? ringColor : theme.text}
            opacity={active ? "full" : "half"}
            style={{ letterSpacing: 1.5, textTransform: "uppercase" }}
          >
            {active ? (phaseTitle ?? "Đang nhịn") : "Sẵn sàng"}
          </ThemedText>

          <Counter
            counter={active ? counter : targetHours * 3_600}
            type="large"
          />

          <Animated.View
            layout={LinearTransition.springify().duration(250)}
            className="mt-1 min-h-4 items-center justify-center"
          >
            <Animated.View key={subtitle} entering={FadeIn.duration(200)}>
              <ThemedText
                size="xs"
                weight={reached ? "bold" : "medium"}
                color={reached ? "success" : "text"}
                opacity={reached ? "full" : "medium"}
              >
                {subtitle}
              </ThemedText>
            </Animated.View>
          </Animated.View>
        </Pressable>

        {/* Bottom: bắt đầu lúc / lịch sử */}
        <Pressable
          onPress={showHistory}
          hitSlop={8}
          className="flex-row items-center gap-1.5 px-3 py-1.5 active:opacity-70"
          style={{ borderRadius: RADIUS.pill, backgroundColor: theme.text + "0D" }}
        >
          <Feather name="clock" size={12} color={theme.text + "99"} />
          <ThemedText size="xs" color="text" opacity="medium">
            {active
              ? `Bắt đầu ${getRelativeTime(new Date(currentFast!.start_time))}`
              : "Lịch sử nhịn"}
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
};
