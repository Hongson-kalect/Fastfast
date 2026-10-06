import { FASTING_TARGETS } from "@/constants/data";
import { ThemeType } from "@/constants/themes";
import { AppSettings, FastSession } from "@/interfaces/db.type";
import { getRelativeDate, getRelativeTime } from "@/util/timer";
import {
  Pressable,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
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
};

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
}: Props) => {
  const strokeWidth = 20;
  const padding = 48;
  const { width } = useWindowDimensions();
  return (
    <View
      className="absolute items-center justify-center overflow-hidden rounded-full bg-background"
      style={{
        width: width - strokeWidth - padding * 2,
        height: width - strokeWidth - padding * 2,
      }}
    >
      {isCounting && currentFast ? (
        <View className="h-full w-full items-center justify-between px-4 pb-10 pt-8">
          {/* Top */}
          <Animated.View
            key={`active-top-${currentTarget?.id ?? "free"}`}
            entering={FadeInDown.duration(250)}
            exiting={FadeOutUp.duration(150)}
            className="items-center gap-1"
          >
            <TouchableOpacity
              className="items-center px-2 pt-1"
              hitSlop={10}
              onPress={openTargetSheet}
            >
              <ThemedText
                weight="bold"
                colorHex={currentTarget?.colors.accent ?? theme.primary}
                className="uppercase"
              >
                {currentTarget
                  ? `${currentTarget.label} ${settings?.target || 16}h`
                  : "Choose a target"}
              </ThemedText>
            </TouchableOpacity>

            <ThemedText size="xs" opacity="half">
              Bắt đầu: {getRelativeTime(new Date(currentFast.start_time))}
            </ThemedText>
          </Animated.View>

          {/* Center */}
          <Pressable
            onPress={openFastingSheet}
            hitSlop={10}
            className="my-auto items-center justify-center"
          >
            <Counter
              itemClassName="text-white font-bold text-2xl"
              counter={counter}
              type="large"
            />

            <Animated.View
              layout={LinearTransition.springify().duration(250)}
              className="mt-1 min-h-4 items-center justify-center"
            >
              {settings?.target && finishEstimate ? (
                counter > settings.target * 3_600 ? (
                  <Animated.View
                    key="completed"
                    entering={FadeInUp.duration(300)}
                  >
                    <ThemedText size="xxs" color="success" weight="semibold">
                      Đã hoàn thành
                    </ThemedText>
                  </Animated.View>
                ) : (
                  <Animated.View key="estimate" entering={FadeIn.duration(200)}>
                    <ThemedText size="xxs" color="text" opacity="half">
                      Hoàn thành: {getRelativeDate(finishEstimate)}
                    </ThemedText>
                  </Animated.View>
                )
              ) : (
                <Animated.View key="free" entering={FadeIn.duration(200)}>
                  <ThemedText size="xxs" color="text" opacity="half">
                    Free mode
                  </ThemedText>
                </Animated.View>
              )}
            </Animated.View>
          </Pressable>

          {/* Bottom */}
          <Pressable
            onPress={showHistory}
            hitSlop={8}
            className="flex-row items-center gap-2 rounded-xl bg-text-base/10 px-3 py-1.5 active:bg-text-base/15"
          >
            <ThemedText size="xs" color="text" opacity="half">
              Fasts history
            </ThemedText>
          </Pressable>
        </View>
      ) : (
        <View className="h-full w-full items-center justify-between px-4 pb-10 pt-8">
          {/* Top */}
          <Animated.View
            key={`idle-top-${currentTarget?.id ?? "none"}`}
            entering={FadeInDown.duration(250)}
            exiting={FadeOutUp.duration(150)}
            className="items-center gap-1"
          >
            {currentTarget ? (
              <>
                <ThemedText
                  size="sm"
                  weight="bold"
                  colorHex={currentTarget.colors.accent}
                  style={{
                    textTransform: "uppercase",
                    textDecorationLine: "underline",
                  }}
                >
                  {currentTarget.label} {settings?.target || 16}h
                </ThemedText>

                <ThemedText size="xxs" color="text" opacity="medium">
                  {currentTarget.title}
                </ThemedText>
              </>
            ) : (
              <>
                <ThemedText
                  size="sm"
                  weight="bold"
                  color="primary"
                  style={{
                    textTransform: "uppercase",
                    textDecorationLine: "underline",
                  }}
                >
                  Choose a target
                </ThemedText>

                <ThemedText size="xxs" color="text" opacity="medium">
                  No target selected
                </ThemedText>
              </>
            )}
          </Animated.View>

          {/* Center */}
          <Pressable
            onPress={openTargetSheet}
            hitSlop={10}
            className="my-auto items-center justify-center"
          >
            <Counter
              itemClassName="text-white font-bold text-2xl"
              counter={settings?.target ? Number(settings.target) * 3_600 : 0}
              type="large"
            />

            <Animated.View
              key={`idle-estimate-${finishEstimate ? "estimate" : "free"}`}
              entering={FadeIn.duration(250)}
              className="mt-1 min-h-4 items-center justify-center"
            >
              {finishEstimate ? (
                <ThemedText size="xxs" color="text" opacity="half">
                  Dự kiến: {getRelativeDate(finishEstimate)}
                </ThemedText>
              ) : (
                <ThemedText size="xxs" color="text" opacity="half">
                  Free mode
                </ThemedText>
              )}
            </Animated.View>
          </Pressable>

          {/* Bottom */}
          <Pressable
            onPress={showHistory}
            hitSlop={8}
            className="flex-row items-center gap-2 rounded-xl bg-text-base/10 px-3 py-1.5 active:bg-text-base/15"
          >
            <ThemedText size="xs" color="text" opacity="medium">
              Fasts history
            </ThemedText>
          </Pressable>
        </View>
      )}
    </View>
  );
};
