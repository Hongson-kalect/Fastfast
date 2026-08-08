import { useBottomSheet } from "@/provider/BottomSheet";
import { useAppStore } from "@/stores/appStore";
import { Pressable, View } from "react-native";
import CircularProgress from "../circleProgress";
import { ThemedText } from "../themed-text";
import HabitBottomSheet from "./HabitBottomSheet";

const radius = 50;
const strokeWidth = 10;
const circumference = 2 * Math.PI * radius;

const progress = 0.75;

const HomeHeader = () => {
  const { theme, settings, userProfile } = useAppStore();
  const { isPresent, present, close } = useBottomSheet();

  const openHabitModal = () => {
    present({
      render: () => <HabitBottomSheet />,
      title: "",
      onClose: () => close(),
      size: "long",
    });
  };
  return (
    <View className="flex-row justify-between items-center">
      <View>
        <ThemedText type="subtitle" color="white">
          {/* Hi, Kalect */}
          FastFast
        </ThemedText>
        {/* <ThemedText type="small">A little encouragement!</ThemedText> */}
      </View>
      {/* <View className="h-10 w-10 bg-red-400"> */}
      <Pressable hitSlop={10} onPress={openHabitModal}>
        <CircularProgress value={userProfile?.habit_percent || 0} />
      </Pressable>
      {/* </View> */}
      {/* <View className="p-1">
        <TouchableOpacity
          onPress={() => openTargetSheet()}
          activeOpacity={0.7}
          style={{
            borderTopRightRadius: "20%",
            borderBottomLeftRadius: "20%",
            borderBottomRightRadius: "50%",
            borderTopLeftRadius: "50%",
          }}
          className="h-10 w-14 justify-center items-center rounded-full border-2 border-primary relative"
        >
          <ThemedText className="text-primary! text-base! font-semibold!">
            {settings?.target || (
              <Feather name="trending-up" size={20} color={theme.primary} />
            )}
          </ThemedText>
        </TouchableOpacity>
      </View> */}
    </View>
  );
};

export default HomeHeader;
