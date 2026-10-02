import { getProcessLevelTitle, processData } from "@/constants/data";
import { useAppStore } from "@/stores/appStore";
import { getProcessProgress } from "@/util/home/fast";
import { FontAwesome6 } from "@expo/vector-icons";
import { useState } from "react";
import { LayoutChangeEvent, useWindowDimensions, View } from "react-native";
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
    <View>
      <View className="gap-1">
        {processData.map(({ key, title, icon, color, process }) => {
          const { activeProcess, percentage, startOn } = getProcessProgress(
            counter,
            process,
          );

          return (
            <View key={key} className="flex-row items-center gap-2 py-2">
              {/* Khối Nhãn & Icon bên trái */}
              <View className="flex-row items-center gap-2">
                <View className="w-5 items-center justify-center">
                  <FontAwesome6
                    style={{ opacity: activeProcess ? 1 : 0.6 }}
                    name={icon}
                    size={14}
                    color={activeProcess ? color : theme.text}
                  />
                </View>

                <ThemedText
                  size="xs"
                  weight="regular"
                  color="text"
                  opacity={activeProcess ? "half" : "low"}
                  style={{
                    width: labelWidth || "auto",
                    marginRight: 4,
                  }}
                  onLayout={detectLabelWidth}
                >
                  {title}
                </ThemedText>
              </View>

              {/* Khối Thanh Progress + Ô trạng thái động */}
              {activeProcess ? (
                <View className="flex-1 flex-row items-center gap-1">
                  {/* Thanh Progress */}
                  {Array.from({ length: 5 }).map((_, index) => {
                    if (index < activeProcess.level) {
                      return (
                        <View
                          key={index}
                          style={{
                            backgroundColor: color,
                            opacity: 0.5 + (index + 1) * 0.1,
                          }}
                          className="h-2 flex-1 rounded-full"
                        />
                      );
                    }

                    if (percentage && index === activeProcess.level) {
                      return (
                        <View
                          key={index}
                          className="h-2 flex-1 overflow-hidden rounded-full bg-text-base/30"
                        >
                          <View
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: color,
                            }}
                            className="h-full rounded-full"
                          />
                        </View>
                      );
                    }

                    return (
                      <View
                        key={index}
                        className="h-2 flex-1 rounded-full bg-text-base/40"
                      />
                    );
                  })}

                  {/* Trạng thái */}
                  <View className="w-16 items-end">
                    <ThemedText
                      size="xs"
                      weight="semibold"
                      colorHex={color}
                      opacity="full"
                      numberOfLines={1}
                      style={{ letterSpacing: 0.5 }}
                    >
                      {getProcessLevelTitle(key, activeProcess.level) || ""}
                    </ThemedText>
                  </View>
                </View>
              ) : (
                <View className="flex-1 flex-row items-center justify-start gap-1 opacity-30">
                  <ThemedText size="xs">Available after</ThemedText>

                  <Counter
                    counter={counter}
                    countTo={startOn}
                    type="small"
                    itemClassName="text-xs!"
                  />
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default HomeBodyProgress;
