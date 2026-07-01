import { TouchableOpacity, View } from "react-native";
import { ThemedText } from "../themed-text";

const HomeHeader = () => {
  return (
    <View className="flex-row justify-between items-center">
      <View>
        <ThemedText type="subtitle" color="white">
          {/* Hi, Kalect */}
          FastFast
        </ThemedText>
        {/* <ThemedText type="small">A little encouragement!</ThemedText> */}
      </View>
      <View>
        <TouchableOpacity className="flex-row items-center gap-2">
          <ThemedText className="text-2xl!">🎯</ThemedText>
          <View className="py-1">
            <ThemedText color="secondary" className="font-bold! text-2xl!">
              24H
            </ThemedText>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default HomeHeader;
