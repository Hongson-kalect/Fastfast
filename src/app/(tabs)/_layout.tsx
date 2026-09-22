import { useAppStore } from "@/stores/appStore";
import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";

const MainTab = () => {
  const { theme } = useAppStore();

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopWidth: 1,
          borderTopColor: theme.text + "15",
          height: 65,
          paddingBottom: 10,
          paddingTop: 8,
        },

        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.text + "66",

        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },

        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Feather size={size - 2} name="home" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Feather size={size - 2} name="bar-chart-2" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="pixel"
        options={{
          title: "Journey",
          tabBarIcon: ({ color, size }) => (
            <Feather size={size - 2} name="activity" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Feather size={size - 2} name="settings" color={color} />
          ),
        }}
      />
    </Tabs>
  );
};
export default MainTab;
