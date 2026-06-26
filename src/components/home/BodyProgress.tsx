import { getProcessLevelTitle, processData } from "@/constants/data";
import { useAppSettingsStore } from "@/store/useAppSettingStore";
import { FontAwesome6 } from "@expo/vector-icons";
import { useState } from "react";
import {
  LayoutChangeEvent,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { ThemedText } from "../themed-text";
import Counter from "./Counter";

type Props = {
  counter: number;
};

const HomeBodyProgress = ({ counter }: Props) => {
  const [labelWidth, setLabelWidth] = useState(0);
  const { width: screenWidth } = useWindowDimensions();
  const { theme } = useAppSettingsStore();
  const [circle, setCircle] = useState(0);

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

  const getStatusLabel = (val: number, steps: string[]) => {
    if (val === 0) return "Locked";
    const index = Math.min(
      Math.floor((val / 100) * steps.length),
      steps.length - 1,
    );
    return steps[index];
  };

  const reRender = () => {
    setCircle((prev) => prev + 1);
  };

  return (
    <View>
      <View className="flex-row items-center justify-between">
        <ThemedText type="default" className=" text-primary! font-bold!">
          Biological progress
        </ThemedText>

        <TouchableOpacity
          activeOpacity={0.7}
          hitSlop={{ bottom: 10, top: 20, left: 40, right: 10 }}
          onPress={() => alert("pressed")}
        >
          <FontAwesome6
            name="question-circle"
            size={20}
            color={theme.colors.primary + "aa"}
          />
        </TouchableOpacity>
      </View>

      <View>
        <View className="mt-4 gap-1">
          {processData.map(({ key, title, icon, color, process }) => {
            let activeProcess = undefined;
            let percentage = 0;
            let startOn = 0;
            const hours = counter / 1000 / 60 / 60;
            for (let i = 0; i < process.length; i++) {
              const item = process[i];
              if (hours < item.hours) {
                startOn = item.hours * 60 * 60 * 1000; // Số mili giây
                activeProcess = null;
                break;
              } else {
                const nextItem = process[i + 1];
                if (!nextItem || nextItem.hours > hours) {
                  activeProcess = item;
                  if (!nextItem) percentage = 100;
                  else
                    percentage =
                      ((hours - item.hours) / (nextItem.hours - item.hours)) *
                      100;
                  break;
                }
              }
            }

            if (activeProcess === undefined)
              activeProcess = process[process.length - 1];

            // const percentage = activeProcess?.nextLevel
            //   ? ((value.hours * 60 +
            //       value.minutes -
            //       activeProcess?.hours * 60) /
            //       activeProcess?.nextLevel) *
            //     100
            //   : 100;

            return (
              <View
                key={key}
                className="flex-row items-center gap-2 py-2 " // Tăng khoảng trống thở cho dòng
              >
                {/* Khối Nhãn & Icon bên trái */}
                <View className="flex-row items-center gap-2">
                  <View className="w-5 items-center justify-center">
                    <FontAwesome6
                      style={{ opacity: activeProcess ? 1 : 0.6 }}
                      name={icon}
                      size={14}
                      color={activeProcess ? color : theme.colors.textSecondary} // Sáng icon lên nếu đã kích hoạt tiến trình
                    />
                  </View>
                  <ThemedText
                    style={{
                      width: labelWidth || "auto",
                      opacity: activeProcess ? 1 : 0.6,
                    }}
                    onLayout={detectLabelWidth}
                    // type="small"
                    color="textSecondary"
                    className="font-medium text-sm! mr-1"
                  >
                    {title}
                  </ThemedText>
                </View>

                {/* Khối Thanh Progress + Ô trạng thái động */}
                {activeProcess ? (
                  <View className="flex-1 flex-row items-center gap-1">
                    {/* Thanh Progress với Background tối của Dark Mode */}
                    {Array.from({ length: 5 }).map((_, index) => {
                      if (index < activeProcess.level)
                        return (
                          <View
                            key={index}
                            style={{
                              backgroundColor: color,
                              opacity: 0.5 + (index + 1) * 0.1,
                            }}
                            className="h-2 flex-1 rounded-full"
                          ></View>
                        );

                      if (percentage && index === activeProcess.level) {
                        return (
                          <View
                            key={index}
                            className="h-2 flex-1 bg-slate-500/60 rounded-full overflow-hidden"
                          >
                            <View
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: color,
                              }}
                              className="h-full rounded-full"
                            ></View>
                          </View>
                        );
                      }
                      return (
                        <View
                          key={index}
                          className="h-2 flex-1 bg-slate-500/60 rounded-full"
                        ></View>
                      );
                    })}

                    {/* Ô hiển thị đánh giá tiến trình nhỏ gọn bên phải cùng */}
                    <View className="w-16 items-end">
                      <ThemedText
                        style={{
                          color: activeProcess
                            ? color
                            : theme.colors.textSecondary,
                        }}
                        className={`text-xs! font-semibold tracking-wide ${!activeProcess ? "opacity-40" : ""}`}
                        numberOfLines={1}
                      >
                        {/* {getStatusLabel(value, process)} */}
                        {getProcessLevelTitle(key, activeProcess.level) || ""}
                      </ThemedText>
                    </View>
                  </View>
                ) : (
                  <View className="flex-row items-center gap-1 opacity-40">
                    <ThemedText className="text-xs!">Start after</ThemedText>
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
    </View>
  );
};

export default HomeBodyProgress;
