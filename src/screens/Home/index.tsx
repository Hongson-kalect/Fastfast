import { Text, View } from "react-native";
import { useHome } from "./hooks/useHome";

export function HomeScreen() {
  const { loading } = useHome();

  return (
    <View className="flex-1 items-center justify-center">
      <Text>Home</Text>
    </View>
  );
}
