import { TouchableOpacity, View } from "react-native";
import { ThemedText } from "../themed-text";

const DashboardHeader = () => {
  return (
    <View className="flex-row justify-between items-center">
      <View>
        <ThemedText type="subtitle" color="white">
          {/* Hi, Kalect */}
          Dashboard
        </ThemedText>
        {/* <ThemedText type="small">A little encouragement!</ThemedText> */}
      </View>
      <View>
        <TouchableOpacity className="flex-row items-center gap-2">
          <ThemedText className="text-2xl!">🎯</ThemedText>
          <View className="py-1">
            <ThemedText color="error" className="font-bold!">
              65 kg
            </ThemedText>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default DashboardHeader;
