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
};

const Counter = ({
  counter,
  countTo = 0,
  type = "normal",
  className,
  itemClassName
}: Props) => {
  const timeLeft = Math.abs(countTo - counter);

  const numberWidth =
    type === "large" ? "w-8" : type === "normal" ? "w-6" : "w-2";

  const separatorWidth =
    type === "large" ? "w-6" : type === "normal" ? "w-4" : "w-3";

  return (
    <View className="flex-row items-center">
      {timeString(timeLeft).split("").map((item, index) => {
        const isNumber = !isNaN(Number(item));
        const widthSize = isNumber ? numberWidth : separatorWidth;

        return (
          <View
            key={`${item}-${index}`}
            className={`${widthSize} flex-row items-center justify-center ${className ?? ""}`}
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
