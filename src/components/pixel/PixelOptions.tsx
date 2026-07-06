import { View } from "react-native";
import { ThemedText } from "../themed-text";

type Props = {
  viewMode: "fasting" | "mood";
  setViewMode: (mode: "fasting" | "mood") => void;
  currentGuides: { emoji: string; label: string }[];
};

export const moodArr = [
  { index: 1, emoji: "😫", label: "Tired", color: "#C62828" }, // Đỏ rượu rất trầm (Deep Muted Red)
  { index: 2, emoji: "😮‍💨", label: "Bad", color: "#EF6C00" }, // Nâu cam đất (Muted Terracotta)
  { index: 3, emoji: "😐", label: "Normal", color: "#6D4D41" }, // Nâu gỗ ấm (Warm Muted Brown)
  { index: 4, emoji: "🙂", label: "Good", color: "#1565C0" }, // Xanh biển đêm (Deep Navy/Slate)
  { index: 5, emoji: "🥰", label: "Happy", color: "#2E7D32" }, // Xanh lá rừng sâu (Deep Forest Green)
];

const PixelOptions = ({ viewMode, setViewMode, currentGuides }: Props) => {
  return (
    <View className="w-full flex-row items-center gap-2">
      {moodArr.map((item) => (
        <View
          key={item.index}
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
