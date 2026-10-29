import {
  RADIUS,
  TAB_BAR_BOTTOM_GAP,
  TAB_BAR_SIDE_GAP,
  TAB_BAR_HEIGHT,
  glow,
} from "@/constants/design";
import { FontByWeight } from "@/constants/typography";
import { useAppStore } from "@/stores/appStore";
import { feedback } from "@/utils/feedback";
import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useT } from "@/providers/Language";
import { TabBarEffect } from "@/components/effect/slots";

const TAB_ICONS = {
  index: "clock",
  dashboard: "bar-chart-2",
  pixel: "grid",
  settings: "settings",
} as const;

const MainTab = () => {
  const t = useT();
  const theme = useAppStore((state) => state.theme);
  const inset = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.text + "80",
        tabBarButton: (props) => (
          <Pressable
            {...(props as React.ComponentProps<typeof Pressable>)}
            onPress={(e) => {
              feedback("tap");
              props.onPress?.(e);
            }}
          />
        ),
        tabBarIcon: ({ color, focused }) => (
          <View
            className="h-9 w-14 items-center justify-center"
            style={{
              borderRadius: RADIUS.pill,
              backgroundColor: focused ? theme.primary + "22" : "transparent",
            }}
          >
            <Feather
              size={20}
              name={TAB_ICONS[route.name as keyof typeof TAB_ICONS] ?? "circle"}
              color={color}
            />
          </View>
        ),
        tabBarBackground: () => <TabBarEffect />,
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: FontByWeight.semibold,
          marginTop: 2,
        },
        // Thanh tab nổi bo tròn; nội dung các màn chừa TAB_BAR_SPACE ở đáy
        tabBarStyle: {
          position: "absolute",
          // left/right/bottom bị bỏ qua với tab bar của React Navigation → dùng margin
          // Rộng hơn lề nội dung một chút để đọc ra là lớp nổi, không lẫn với card
          marginHorizontal: TAB_BAR_SIDE_GAP,
          marginBottom: inset.bottom + TAB_BAR_BOTTOM_GAP,
          height: TAB_BAR_HEIGHT,
          paddingTop: 6,
          paddingBottom: 6,
          borderRadius: RADIUS.lg,
          // Viền mảnh đều 4 cạnh + bóng đậm để tách khỏi card/background2
          borderTopWidth: 1,
          borderWidth: 1,
          borderColor: theme.text + "1A",
          borderTopColor: theme.text + "1A",
          backgroundColor: theme.card,
          ...glow("#000", 0.6),
          shadowRadius: 20,
          elevation: 16,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: t("tabs.fast") }} />
      <Tabs.Screen name="dashboard" options={{ title: t("tabs.stats") }} />
      <Tabs.Screen name="pixel" options={{ title: t("tabs.journey") }} />
      <Tabs.Screen name="settings" options={{ title: t("tabs.settings") }} />
    </Tabs>
  );
};

export default MainTab;
