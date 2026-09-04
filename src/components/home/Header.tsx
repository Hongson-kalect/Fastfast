import { useBottomSheet } from "@/provider/BottomSheet";
import { useAppStore } from "@/stores/appStore";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useMemo } from "react";
import { Button, Dimensions, Pressable, View } from "react-native";
import CircularProgress from "../circleProgress";
import { ThemedText } from "../themed-text";

const radius = 50;
const strokeWidth = 10;
const circumference = 2 * Math.PI * radius;
const NINETY_PERCENT_SCREEN_HEIGHT = 0.9;
const progress = 0.75;

const HomeHeader = () => {
  const { theme, settings, userProfile, habit } = useAppStore();
  const { show } = useBottomSheet();

  const maxHeight = useMemo(
    () => Dimensions.get("window").height * 0.5,
    [0.3, 0.8],
  );

  const openHabitModal = () => {
    console.log("Vừng mở ra");
    show(
      <BottomSheetScrollView style={{ padding: 20, maxHeight }}>
        <Button title="Hello" onPress={() => {}} />
        <Button title="Hello" onPress={() => {}} />
        <Button title="Hello" onPress={() => {}} />
        <Button title="Hello" onPress={() => {}} />
        <Button title="Hello" onPress={() => {}} />
        <Button title="Hello" onPress={() => {}} />
        <Button title="Hello" onPress={() => {}} />
        <Button title="Hello" onPress={() => {}} />
        <Button title="Hello" onPress={() => {}} />
        <Button title="Hello" onPress={() => {}} />
        <Button title="Hello" onPress={() => {}} />
        <Button title="Hello" onPress={() => {}} />
        <Button title="Hello" onPress={() => {}} />
        <Button title="Hello" onPress={() => {}} />
        <Button title="Hello" onPress={() => {}} />
        <Button title="Hello" onPress={() => {}} />
        <Button title="Hello" onPress={() => {}} />
        <Button title="Hello" onPress={() => {}} />
        <Button title="Hello" onPress={() => {}} />
        <Button title="Hello" onPress={() => {}} />
        <Button title="Hello" onPress={() => {}} />
        <Button title="Hello" onPress={() => {}} />
        <Button title="Hello" onPress={() => {}} />
        <Button title="Hello" onPress={() => {}} />
        <Button title="Hello" onPress={() => {}} />
        <Button title="Hello" onPress={() => {}} />
        <Button title="Hello" onPress={() => {}} />
        <Button title="Hello" onPress={() => {}} />
        <Button title="Hello" onPress={() => {}} />
      </BottomSheetScrollView>,
      {
        snapPoints: ["40%", "80%"],
      },
    );
    // present({
    //   render: () => <HabitBottomFlatList />,
    //   title: "",
    //   scrollable: true,
    //   size: "long",
    // });
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
        <CircularProgress value={habit?.habit_snap || 0} />
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
