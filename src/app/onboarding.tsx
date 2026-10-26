import { ThemedText } from "@/components/themed-text";
import { useDBService } from "@/hooks/useDBService";
import { useT } from "@/providers/Language";
import { useAppStore } from "@/stores/appStore";
import { getContrastTextColor } from "@/utils/color";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Slide = {
  key: "welcome" | "habit" | "shield" | "pixel" | "health";
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
};

const SLIDES: Slide[] = [
  { key: "welcome", icon: "timer-outline" },
  { key: "habit", icon: "fire" },
  { key: "shield", icon: "shield-check" },
  { key: "pixel", icon: "grid" },
  { key: "health", icon: "heart-pulse" },
];

const OnboardingScreen = () => {
  const t = useT();
  const dbService = useDBService();
  const { theme, updateSetting } = useAppStore();
  const { width } = useWindowDimensions();
  const inset = useSafeAreaInsets();

  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);

  const isLast = index === SLIDES.length - 1;
  const buttonTextColor = getContrastTextColor(theme.primary);

  // Đổi cờ trong store → Stack.Protected ở _layout tự chuyển sang (tabs)
  const finish = async () => {
    await dbService.setting("onboarding_done", true);
    updateSetting({ onboarding_done: true });
  };

  const handleNext = () => {
    if (isLast) return finish();
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  };

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  return (
    <View
      style={{ paddingTop: inset.top, paddingBottom: inset.bottom + 16 }}
      className="flex-1 bg-background"
    >
      <View className="h-12 flex-row justify-end px-5">
        {!isLast && (
          <Pressable onPress={finish} hitSlop={16} className="justify-center">
            <ThemedText size="sm" color="text" opacity="medium">
              {t("onboarding.skip")}
            </ThemedText>
          </Pressable>
        )}
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumEnd}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item }) => (
          <View
            style={{ width }}
            className="flex-1 items-center justify-center px-8 gap-6"
          >
            <View
              style={{ backgroundColor: theme.primary + "22" }}
              className="h-40 w-40 rounded-full items-center justify-center"
            >
              <MaterialCommunityIcons
                name={item.icon}
                size={80}
                color={theme.primary}
              />
            </View>

            <ThemedText
              size="xxl"
              weight="bold"
              color="title"
              style={{ textAlign: "center" }}
            >
              {t(`onboarding.${item.key}.title`)}
            </ThemedText>

            <ThemedText
              size="md"
              color="text"
              opacity="medium"
              style={{ textAlign: "center" }}
            >
              {t(`onboarding.${item.key}.body`)}
            </ThemedText>
          </View>
        )}
      />

      <View className="flex-row justify-center gap-2 mb-6">
        {SLIDES.map((slide, i) => (
          <View
            key={slide.key}
            style={{
              width: i === index ? 20 : 8,
              backgroundColor: i === index ? theme.primary : theme.text + "33",
            }}
            className="h-2 rounded-full"
          />
        ))}
      </View>

      <View className="px-5">
        <Pressable
          onPress={handleNext}
          style={{ backgroundColor: theme.primary }}
          className="h-14 rounded-2xl items-center justify-center"
        >
          <ThemedText size="lg" weight="semibold" colorHex={buttonTextColor}>
            {isLast ? t("onboarding.start") : t("onboarding.next")}
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
};

export default OnboardingScreen;
