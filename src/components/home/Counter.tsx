import { timeString } from "@/util/timer";
import { useEffect, useMemo, useState } from "react";
import { LayoutChangeEvent, View } from "react-native";
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
  const timeLeft = useMemo (()=>{
    return Math.abs(countTo - counter);
  }, [countTo, counter])


  return (
    <View className="flex-row items-center">
      {timeString(timeLeft)
        .split("")
        .map((item, index) => {
          if (typeof Number(item) === "number") {
            return (
              <View
                key={index}
                className={`${type === "large" ? "w-8" : type === "normal" ? "w-6" : "w-2"} flex-row items-center justify-center ${className}`}
              >
                <ThemedText
                  className={itemClassName}
                  type={type === "large" ? "title" : undefined}
                >
                  {item}
                </ThemedText>
              </View>
            );
          }
        })}
    </View>
  );
};

export default Counter;
