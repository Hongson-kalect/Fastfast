import { getProcessLevelTitle, processData } from "@/constants/data";
import { useAppStore } from "@/stores/appStore";
import { getProcessProgress } from "@/util/home/fast";
import { FontAwesome6 } from "@expo/vector-icons";
import { useState } from "react";
import { LayoutChangeEvent, useWindowDimensions, View } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOutDown,
  FadeOutUp,
  LinearTransition,
} from "react-native-reanimated";
import { ThemedText } from "../themed-text";
import Counter from "./Counter";

type Props = {
  counter: number;
};

const HomeBodyProgress = ({ counter }: Props) => {
  const [labelWidth, setLabelWidth] = useState(0);
  const { width: screenWidth } = useWindowDimensions();
  const { theme } = useAppStore();

  const detectLabelWidth = (e: LayoutChangeEvent) => {
    // 🌟 Bốc width ra ngay lập tức
    const width = e.nativeEvent?.layout?.width || 0;

    // Chỉ cập nhật nếu tìm thấy label có kích thước lớn hơn kích thước cũ
    setLabelWidth((prev) => {
      return Math.min(Math.max(prev, width), screenWidth / 2);
    });
    // if (width > labelWidth) {
    //   setLabelWidth(width);
    // }
  };

  return (
    <View className="gap-3">
      {processData.map(({ key, title, icon, color, process }) => {
        const { activeProcess, percentage, startOn } = getProcessProgress(
          counter,
          process,
        );

        const level = activeProcess?.level ?? 0;
        const totalPercentage = Math.min(
          100,
          level * 20 + (percentage ?? 0) / 5,
        );

        return (
          <View key={key} className="gap-1">
            {/* Header */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <View
                  className="h-8 w-8 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: activeProcess
                      ? color + "20"
                      : theme.text + "10",
                  }}
                >
                  <FontAwesome6
                    name={icon}
                    size={13}
                    color={activeProcess ? color : theme.text}
                    style={{
                      opacity: activeProcess ? 1 : 0.5,
                    }}
                  />
                </View>

                <View className="flex-row gap-2 items-center">
                  <ThemedText
                    size="sm"
                    weight="semibold"
                    color="text"
                    opacity={activeProcess ? "full" : "half"}
                  >
                    {title}
                  </ThemedText>

                  {activeProcess && (
                    <View
                      style={{ backgroundColor: color + "20" }}
                      className="px-2 py-1 rounded-full"
                    >
                      <ThemedText size="xs" colorHex={color} opacity="hight">
                        {getProcessLevelTitle(key, level)}
                      </ThemedText>
                    </View>
                  )}
                </View>
              </View>

              {activeProcess && (
                <ThemedText size="xs" weight="semibold" colorHex={color}>
                  {Math.round(totalPercentage)}%
                </ThemedText>
              )}
            </View>

            {/* Progress / Available after */}
            <Animated.View
              layout={LinearTransition.springify().duration(300)}
              className="ml-10 h-4"
            >
              {!activeProcess ? (
                <Animated.View
                  key="available"
                  entering={FadeInDown.duration(250)}
                  exiting={FadeOutUp.duration(180)}
                  className="flex-row items-center justify-between"
                >
                  <ThemedText size="xs" opacity="low">
                    Available after
                  </ThemedText>

                  <Counter
                    counter={counter}
                    countTo={startOn}
                    type="small"
                    itemClassName="text-xs!"
                  />
                </Animated.View>
              ) : (
                <Animated.View
                  key="progress"
                  entering={FadeInUp.duration(300).springify()}
                  exiting={FadeOutDown.duration(150)}
                  className="flex-row gap-1.5"
                >
                  {Array.from({ length: 5 }).map((_, index) => {
                    const completed = index < level;
                    const current = index === level;

                    return (
                      <Animated.View
                        key={index}
                        entering={FadeIn.duration(200).delay(index * 40)}
                        className="h-2 flex-1 overflow-hidden rounded-full"
                        style={{
                          backgroundColor: completed
                            ? color
                            : theme.text + "18",
                        }}
                      >
                        {current && percentage > 0 && (
                          <View
                            className="h-full rounded-full"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: color,
                              opacity: completed ? 0.8 : 1,
                            }}
                          />
                        )}
                      </Animated.View>
                    );
                  })}
                </Animated.View>
              )}
            </Animated.View>
          </View>
        );
      })}
    </View>
  );
};

export default HomeBodyProgress;
