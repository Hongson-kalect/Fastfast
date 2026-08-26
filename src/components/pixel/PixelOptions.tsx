import { View } from "react-native";
import { ThemedText } from "../themed-text";
import { EMOTIONS } from "@/constants/data";

type Props = {
  viewMode: "fasting" | "mood";
  setViewMode: (mode: "fasting" | "mood") => void;
  currentGuides: { emoji: string; label: string }[];
};

const PixelOptions = ({ viewMode, setViewMode, currentGuides }: Props) => {
  return (
    <View className="w-full flex-row items-center gap-2">
      {EMOTIONS.map((item) => (
        <View
          key={item.level}
          className="flex-1 items-center justify-evenly gap-1.5"
        >
          <View className="items-center justify-center">
            <ThemedText className="text-xl!">{item.emoji}</ThemedText>
          </View>
          <ThemedText className="text-xs! text-white!">{item.label}</ThemedText>
          <View
            style={{ backgroundColor: item.color }}
            className="w-3 h-3 rounded-full"
          ></View>
        </View>
      ))}
    </View>
  );
};

export default PixelOptions;
