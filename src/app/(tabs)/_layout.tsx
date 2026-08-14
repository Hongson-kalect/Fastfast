import { useAppStore } from "@/stores/appStore";
import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";

const MainTab = () => {
  const { theme } = useAppStore();
  return (
    <Tabs
      // initialRouteName="dashboard"
      screenOptions={{
        // 1. Cấu hình thanh Tab Bar tổng thể
        tabBarStyle: {
          backgroundColor: "#1A1F26", // Màu nền bg-surface của bạn
          borderTopWidth: 1,
          borderTopColor: "#2A333F", // Đường viền mảnh ngăn cách
          height: 65,
          paddingBottom: 10,
          paddingTop: 8,
        },

        // 2. Màu sắc Trạng thái Active/Inactive của cả Icon và Chữ
        tabBarActiveTintColor: theme.primary, // Xanh Mint khi chọn
        tabBarInactiveTintColor: "#9CA3AF", // Xám nhạt khi chưa chọn

        // 3. Áp Font chữ hệ thống cho Label dưới Icon
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },

        // 4. Ẩn Header mặc định của hệ thống để sau này tự viết Custom Header cho đẹp
        headerShown: false,
      }}
    >
      {/* TRANG 1: ĐỒNG HỒ ĐẾM GIỜ */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Feather size={size - 2} name="home" color={color} />
          ),
        }}
      />

      {/* TRANG 2: BẢNG SỐ LIỆU CÂN NẶNG / BMI */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Feather size={size - 2} name="bar-chart-2" color={color} />
          ),
        }}
      />

      {/* TRANG 3: LƯỚI MA TRẬN PIXEL IN YEAR */}
      <Tabs.Screen
        name="pixel"
        options={{
          title: "Journey",
          tabBarIcon: ({ color, size }) => (
            <Feather size={size - 2} name="activity" color={color} />
          ),
        }}
      />

      {/* TRANG 4: CÀI ĐẶT cấu hình */}
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
    // <NativeTabs>
    // 		<NativeTabs.Trigger name="index" hidden={false}>
    // 			<NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
    // 			<NativeTabs.Trigger.Icon selectedColor={'blue'} sf="house.fill" drawable="custom_android_drawable"/>
    // 		</NativeTabs.Trigger>
    // 		<NativeTabs.Trigger name="settings">
    // 			<NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
    // 			<NativeTabs.Trigger.Icon sf="gear" drawable="custom_settings_drawable"/>
    // 		</NativeTabs.Trigger>
    // 	</NativeTabs>
  );
};

export default MainTab;
