import HomeBodyProgress from "@/components/home/BodyProgress";
import HomeHeader from "@/components/home/Header";
import { SwapButton } from "@/components/home/SwapButton";
import HomeTimeCounter from "@/components/home/TimeCounter";
import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const HomeScreen = () => {
  const [startTime] = useState(() => {
    return (
      new Date().getTime() - (18 * 1000 * 60 * 60 + 24 * 1000 * 60 + 12 * 1000)
    );
  });

  const [counter, setCounter] = useState(0);
  const handleCounter = () => {
    const now = new Date().getTime();
    setCounter(Math.abs(now - startTime));
  };

  useEffect(() => {
    handleCounter();

    const interval = setInterval(() => {
      handleCounter();
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <View className="flex-1 bg-main">
      <SafeAreaView>
        <ScrollView keyboardShouldPersistTaps="handled">
          <View className="px-3">
            <HomeHeader />
            <View className="py-4 mt-4">
              <HomeTimeCounter counter={counter} />
            </View>

            <View className="py-4 mt-4 items-center justify-center">
              <SwapButton title="| |" variant="primary" />
            </View>
            <View className="mt-12">
              {/* These indicators reflect general biological stages based on fasting duration. Always listen to your body and consult a healthcare professional before attempting prolonged fasts */}
              <HomeBodyProgress counter={counter} />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default HomeScreen;
