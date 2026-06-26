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
        <TouchableOpacity>
          <View className="flex-row items-center justify-center rounded-full h-11 w-11 bg-gray-400 shadow-xs shadow-white">
            <View className="flex-row items-center justify-center rounded-full h-10 w-10 bg-black shadow-inner shadow-white">
              <ThemedText color="white">72</ThemedText>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default HomeHeader;
