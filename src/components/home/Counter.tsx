import { timeString } from "@/util/timer";
import { useMemo } from "react";
import { View } from "react-native";
import { ThemedText } from "../themed-text";

type Props = {
  counter: number;
  countTo?: number;
  type: "large" | "small" | "normal";
  className?: string;
  itemClassName?: string;
  style?: React.CSSProperties;
};

const Counter = ({
  counter,
  countTo = 0,
  type = "normal",
  className,
  itemClassName,
  style,
}: Props) => {
  const timeLeft = useMemo(() => {
    return Math.abs(countTo - counter);
  }, [countTo, counter]);

  return (
    <View className="flex-row items-center">
      {timeString(timeLeft)
        .split("")
        .map((item, index) => {
          let widthSize = "w-8";
          const isNumber = !isNaN(Number(item));
          if (isNumber)
            widthSize =
              type === "large" ? "w-8" : type === "normal" ? "w-6" : "w-2";
          else
            widthSize =
              type === "large" ? "w-6" : type === "normal" ? "w-4" : "w-3";

          return (
            <View
              key={index}
              className={`${widthSize} flex-row items-center justify-center ${className}`}
            >
              <ThemedText
                className={itemClassName}
                size="displayLarge"
                weight="semibold"
              >
                {item}
              </ThemedText>
            </View>
          );
        })}
    </View>
  );
};

export default Counter;
