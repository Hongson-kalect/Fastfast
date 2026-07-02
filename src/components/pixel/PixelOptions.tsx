import { Text, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../themed-text";

type Props = {
  viewMode: "fasting" | "mood";
  setViewMode: (mode: "fasting" | "mood") => void;
  currentGuides: { emoji: string; label: string }[];
};
const PixelOptions = ({ viewMode, setViewMode, currentGuides }: Props) => {
  return (
    <View className="bg-white/5 rounded-2xl p-4 mb-4 mt-2 border border-white/10">
      {/* Selector Mode */}
      <View className="flex-row bg-black/20 p-1 rounded-xl mb-4">
        <TouchableOpacity
          onPress={() => setViewMode("fasting")}
          className={`flex-1 py-2 rounded-lg items-center ${viewMode === "fasting" ? "bg-white/10" : ""}`}
        >
          <ThemedText
            className={`text-sm ${viewMode === "fasting" ? "font-bold text-secondary" : "opacity-60"}`}
          >
            ⚡ Hiệu suất nhịn
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setViewMode("mood")}
          className={`flex-1 py-2 rounded-lg items-center ${viewMode === "mood" ? "bg-white/10" : ""}`}
        >
          <ThemedText
            className={`text-sm ${viewMode === "mood" ? "font-bold text-secondary" : "opacity-60"}`}
          >
            🧠 Chất lượng ngày
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Hướng dẫn Emoji (Guides) */}
      <View className="flex-row flex-wrap gap-y-2 justify-between">
        {currentGuides.map((guide, idx) => (
          <View key={idx} className="flex-row items-center gap-1.5 w-[48%]">
            <Text className="text-xl">{guide.emoji}</Text>
            <ThemedText className="text-xs opacity-80" numberOfLines={1}>
              {guide.label}
            </ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
};

export default PixelOptions;
