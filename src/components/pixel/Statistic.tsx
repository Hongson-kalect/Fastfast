import { View } from "react-native";
import { ThemedText } from "../themed-text";
import { moodArr } from "./PixelInYear";

const moodCount = [102, 25, 5, 2, 0];
const PixelStatistic = () => {
  return (
    <View className="gap-4">
      <View className="flex-row gap-4">
        <View className="flex-1 bg-black p-2 rounded-xl shadow shadow-white">
          <ThemedText className="text-gray-200! text-sm!">Fast days</ThemedText>
          <ThemedText type="subtitle" className="py-2 text-center text-white!">
            218
          </ThemedText>
        </View>
        <View className="flex-1 bg-black p-2 rounded-xl shadow shadow-white">
          <ThemedText className="text-gray-200! text-sm!">
            Fast hours
          </ThemedText>
          <ThemedText type="subtitle" className="py-2 text-center text-white!">
            3224
          </ThemedText>
        </View>
      </View>

      <View className="flex-row justify-end items-center mt-8">
        {/* <View className=" items-center px-3 py-1 bg-primary rounded-lg gap-1 flex-row">
          <ThemedText className="text-[11px]! text-white! font-bold">
            Week of year
          </ThemedText>

          <Feather name="chevron-down" size={12} color="white" />
        </View> */}

        <View className="flex-row items-center gap-1 justify-end">
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

      <View className="flex-row gap-1 mt-2">
        {moodArr.map((item, index) => (
          <View
            key={item.label}
            style={{ backgroundColor: item.color }}
            className="flex-1 p-1.5 rounded-xl"
          >
            <View className="flex-row items-center justify-between">
              <ThemedText className="text-[9px]! font-light! text-gray-200!">
                {item.label}
              </ThemedText>
              <ThemedText className="text-base!">{item.emoji}</ThemedText>
            </View>
            <ThemedText className="text-white! text-2xl! font-semibold! text-center my-2">
              {moodCount[index]}
            </ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
};

export default PixelStatistic;
