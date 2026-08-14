import { Text, View } from "react-native";
import { ThemedText } from "../themed-text";
import { moodArr } from "./PixelInYear";

const moodCount = [102, 25, 5, 2, 0];
const PixelStatistic = () => {
  return (
    <View className="gap-4">
      <View className="flex-row gap-1 items-end">
        <Text className="text-sm text-text-base/80 font-semibold">📅 218</Text>
        <Text className="text-xs text-text-base/60">days</Text>
        <Text className="text-sm text-text-base">-</Text>
        <Text className="text-sm text-text-base/80 font-semibold">⌛ 3224</Text>
        <Text className="text-xs text-text-base/60">hours</Text>
      </View>

      <View className="flex-row justify-end items-center mt-8">
        {/* <View className=" items-center px-3 py-1 bg-primary rounded-lg gap-1 flex-row">
          <ThemedText className="text-[11px]! text-white! font-bold">
            Week of year
          </ThemedText>

          <Feather name="chevron-down" size={12} color="white" />
        </View> */}

        <View className="flex-row items-center gap-1 justify-between">
          <View className=" items-center px-3 py-1 bg-primary rounded-lg">
            <ThemedText className="text-[11px]! text-white! font-bold">
              Emotion
            </ThemedText>
          </View>
          <View className=" items-center px-3 py-1 bg-gray-600 rounded-lg">
            <ThemedText className="text-[11px]! text-white/60! font-bold">
              Fast process
            </ThemedText>
          </View>
        </View>
      </View>

      <View className="flex-row gap-2 mt-2">
        {moodArr.map((item, index) => (
          <View
            key={item.label}
            style={{ backgroundColor: item.color }}
            className="flex-1 px-2 py-1 rounded"
          >
            <View className="flex-row items-center justify-between">
              <ThemedText className="text-base!">{item.emoji}</ThemedText>
              <ThemedText className="text-[13px]! text-text-base/800!">
                {moodCount[index]}
              </ThemedText>
            </View>
            {/* <ThemedText className="text-white! text-xl! font-semibold! text-center mt-1 mb-0.5">
              {moodCount[index]}
            </ThemedText> */}
          </View>
        ))}
      </View>
    </View>
  );
};

export default PixelStatistic;
