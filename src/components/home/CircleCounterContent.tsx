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
      className="absolute bg-background rounded-full justify-center items-center overflow-hidden"
      style={{
        width: width - strokeWidth - padding * 2,
        height: width - strokeWidth - padding * 2,
      }}
    >
      {isCounting && currentFast ? (
        <Pressable
          onPress={openFastingSheet}
          hitSlop={10}
          className="items-center justify-between h-full pt-8 pb-10"
        >
          {/* Top */}
          <View className="items-center gap-1">
            {currentTarget ? (
              <>
                <TouchableOpacity
                  className="items-center pt-1"
                  hitSlop={10}
                  onPress={openTargetSheet}
                >
                  <ThemedText
                    weight="bold"
                    // size="sm"
                    colorHex={currentTarget.colors.accent}
                    className="uppercase"
                  >
                    {currentTarget.label} {settings?.target || 16}h
                  </ThemedText>
                </TouchableOpacity>

                <ThemedText opacity="half" size="xs">
                  Bắt đầu: {getRelativeTime(new Date(currentFast.start_time))}
                </ThemedText>
              </>
            ) : (
              <>
                <TouchableOpacity
                  onPress={openTargetSheet}
                  hitSlop={10}
                  className="items-center pt-1"
                >
                  <ThemedText
                    weight="bold"
                    // size="sm"
                    colorHex={theme.primary}
                    className="uppercase"
                  >
                    Choose a target
                  </ThemedText>
                </TouchableOpacity>
                <ThemedText opacity="half" size="xs">
                  Bắt đầu: {getRelativeTime(new Date(currentFast.start_time))}
                </ThemedText>
              </>
            )}
          </View>

          {/* Center */}
          <View className="my-auto items-center justify-center">
            <Counter
              itemClassName="text-white font-bold text-2xl"
              counter={counter}
              type="large"
            />

            {settings?.target && finishEstimate ? (
              counter > settings.target * 3_600 ? (
                <ThemedText size="xxs" color="success">
                  Đã hoàn thành
                </ThemedText>
              ) : (
                <ThemedText size="xxs" color="text" opacity="half">
                  Hoàn thành: {getRelativeDate(finishEstimate)}
                </ThemedText>
              )
            ) : (
              <ThemedText size="xxs" color="text" opacity="half">
                Free mode
              </ThemedText>
            )}
          </View>

          {/* Bottom */}
          <View className="items-center gap-1">
            <Pressable
              onPress={showHistory}
              hitSlop={8}
              className="mt-1 px-3 py-1.5 bg-text-base/20 rounded-xl flex-row gap-2"
            >
              <ThemedText size="xs" color="text" opacity="half">
                Fasts history
              </ThemedText>
            </Pressable>
          </View>
        </Pressable>
      ) : (
        <Pressable
          onPress={openTargetSheet}
          hitSlop={10}
          className="items-center justify-between h-full pt-8 pb-10"
        >
          {/* Top */}
          <View className="items-center gap-1">
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
                  No target had been selected
                </ThemedText>
              </>
            )}
          </View>

          {/* Center */}
          <View className="my-auto items-center justify-center">
            <Counter
              itemClassName="text-white font-bold text-2xl"
              counter={settings?.target ? Number(settings.target) * 3_600 : 0}
              type="large"
            />

            {finishEstimate ? (
              <ThemedText size="xxs" color="text" opacity="half">
                Dự kiến: {getRelativeDate(finishEstimate)}
              </ThemedText>
            ) : (
              <ThemedText size="xxs" color="text" opacity="half">
                Free mode
              </ThemedText>
            )}
          </View>

          {/* Bottom */}
          <View className="items-center gap-1">
            <Pressable
              onPress={showHistory}
              hitSlop={8}
              className="mt-1 px-3 py-1.5 bg-text-base/20 rounded-xl flex-row gap-2"
            >
              <ThemedText size="xs" color="text" opacity="medium">
                Fasts history
              </ThemedText>
            </Pressable>
          </View>
        </Pressable>
      )}
    </View>
  );
};
