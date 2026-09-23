import { useAppStore } from "@/stores/appStore";
import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Pressable } from "react-native";

const MainTab = () => {
  const { theme } = useAppStore();

  return (
    <Tabs
      screenOptions={{
        tabBarButton: (props) => <TabButton {...props} />,
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

const TabButton = (props: any) => {
  const { theme } = useAppStore();

  return (
    <Pressable
      {...props}
      android_ripple={{
        color: theme.primary + "20",
        borderless: true,
      }}
    />
  );
};

export default MainTab;
