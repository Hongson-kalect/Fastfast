import { useDBService } from "@/hooks/useDBService";
import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import { View } from "react-native";
import { ThemedText } from "../themed-text";

const DashboardHeader = () => {
  return (
    <View className="flex-row justify-between items-center">
      <View>
        <ThemedText type="subtitle" color="white">
          Dashboard
        </ThemedText>
      </View>
    </View>
  );
};

export default DashboardHeader;
