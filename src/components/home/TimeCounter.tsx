import { useEffect, useState } from "react";
import { LayoutChangeEvent, View } from "react-native";
import { ThemedText } from "../themed-text";
import Counter from "./Counter";

type Props = {
  counter: number;
};
const HomeTimeCounter = ({ counter }: Props) => {
  const [counterWidth, setCounterWidth] = useState(0);
  const detectCounterWidth = (e: LayoutChangeEvent) => {
    if (counterWidth) return;

    setCounterWidth(e.nativeEvent.layout.width + 40); // padding
  };

  return (
    <View>
      <View className="items-center justify-center">
        <View
          onLayout={detectCounterWidth}
          style={{ width: counterWidth || "auto" }}
          className="py-6 bg-black flex-row items-center justify-center shadow-lg shadow-primary border-l-4 border-t-2 border-r-4 border-b-6 border-primary rounded-full"
        >
          <Counter itemClassName="text-white!" counter={counter} type="large" />
        </View>

        <ThemedText type="small" className="mt-4">
          You're doing great, keep it up
        </ThemedText>
      </View>
    </View>
  );
};

export default HomeTimeCounter;
