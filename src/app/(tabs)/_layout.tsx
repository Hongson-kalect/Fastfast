import {
  RADIUS,
  SCREEN_PADDING,
  TAB_BAR_BOTTOM_GAP,
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

const TAB_ICONS = {
  index: "clock",
  dashboard: "bar-chart-2",
  pixel: "grid",
  settings: "settings",
} as const;

const MainTab = () => {
  const { theme } = useAppStore();
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
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: FontByWeight.semibold,
          marginTop: 2,
        },
        // Thanh tab nổi bo tròn; nội dung các màn chừa TAB_BAR_SPACE ở đáy
        tabBarStyle: {
          position: "absolute",
          // left/right/bottom bị bỏ qua với tab bar của React Navigation → dùng margin
          marginHorizontal: SCREEN_PADDING,
          marginBottom: inset.bottom + TAB_BAR_BOTTOM_GAP,
          height: TAB_BAR_HEIGHT,
          paddingTop: 6,
          paddingBottom: 6,
          borderRadius: RADIUS.lg,
          // Nổi rõ cả khi nằm trên card/background2: viền sáng hơn + bóng đậm
          borderTopWidth: 1,
          borderWidth: 1,
          borderColor: theme.text + "26",
          borderTopColor: theme.text + "33",
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
      <Tabs.Screen name="index" options={{ title: "Fast" }} />
      <Tabs.Screen name="dashboard" options={{ title: "Stats" }} />
      <Tabs.Screen name="pixel" options={{ title: "Journey" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
};

export default MainTab;
