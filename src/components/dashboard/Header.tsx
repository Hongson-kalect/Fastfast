import { View } from "react-native";
import { ThemedText } from "../themed-text";

const DashboardHeader = () => {
  return (
    <View className="flex-row justify-between items-center">
      <View>
        <ThemedText size="xxxl" weight="semibold">
          Dashboard
        </ThemedText>
      </View>
    </View>
  );
};

export default DashboardHeader;
