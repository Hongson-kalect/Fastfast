import { AntDesign } from "@expo/vector-icons";
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
  { index: 5, emoji: "🥰", label: "Excellent", color: "#2E7D32" }, // Xanh lá rừng sâu (Deep Forest Green)
];

const PixelOptions = ({ viewMode, setViewMode, currentGuides }: Props) => {
  return (
    <>
      <View className="flex-row gap-2">
        {/* <View className="rounded-lg bg-black flex-1 py-2 px-2">
          <View className="py-4 px-2  flex-row items-center gap-4 justify-between">
            <View className="flex-row items-center h-22 w-22 rounded-full bg-primary"></View>
            <View>
              <ThemedText className="text-xs! font-base! text-gray-200!">
                Chú thích tỉ lệ
              </ThemedText>
              <ThemedText className="text-xs! font-base! text-gray-200!">
                Chú thích tỉ lệ
              </ThemedText>
              <ThemedText className="text-xs! font-base! text-gray-200!">
                Chú thích tỉ lệ
              </ThemedText>
              <ThemedText className="text-xs! font-base! text-gray-200!">
                Chú thích tỉ lệ
              </ThemedText>
              <ThemedText className="text-xs! font-base! text-gray-200!">
                Chú thích tỉ lệ
              </ThemedText>
            </View>
          </View>
          <ThemedText className="text-xs! italic text-center">
            Tỉ lệ trạng thái của bạn
          </ThemedText>
        </View> */}

        <View className="gap-2">
          <View className="gap-2 py-1 px-2 rounded-lg bg-primary">
            <View className="flex-row gap-4 justify-between">
              <ThemedText className="text-xs! font-base! text-white!">
                Fast days
              </ThemedText>
              <AntDesign name="calendar" color="white" size={16} />
            </View>
            <View className="flex-row items-center justify-center">
              <ThemedText className="text-white!">246</ThemedText>
            </View>
          </View>
          <View className="gap-2 py-2 px-2 rounded-lg bg-success">
            <View className="flex-row gap-4">
              <ThemedText className="text-xs! font-base! text-white!">
                Good days
              </ThemedText>
              <View className="flex-row items-center justify-center">
                <ThemedText className="text-white! text-sm!">246</ThemedText>
              </View>
            </View>
          </View>
          <View className="gap-2 py-2 px-2 rounded-lg bg-error">
            <View className="flex-row justify-between">
              <ThemedText className="text-xs! font-base! text-white!">
                Bad days
              </ThemedText>
              <View className="flex-row items-center justify-center">
                <ThemedText className="text-white! text-sm!">246</ThemedText>
              </View>
            </View>
          </View>
        </View>
      </View>
      <View className="flex-row justify-between items-center mt-4 rounded-lg py-2 px-4">
        {moodArr.map((item) => (
          <View
            key={item.index}
            className="items-center justify-evenly gap-1.5"
          >
            <View className="items-center justify-center">
              <ThemedText className="text-xl!">{item.emoji}</ThemedText>
            </View>
            <ThemedText className="text-xs! text-white!">
              {item.label}
            </ThemedText>
            <View
              style={{ backgroundColor: item.color }}
              className="w-3 h-3 rounded-full"
            ></View>
          </View>
        ))}
      </View>
    </>
  );
};

export default PixelOptions;
