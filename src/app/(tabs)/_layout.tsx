import { Tabs } from "expo-router";
import { NativeTabs} from "expo-router/unstable-native-tabs";
import { FontAwesome6 } from '@expo/vector-icons';

const MainTab = ()=>{
    return (
		<Tabs
      screenOptions={{
        // 1. Cấu hình thanh Tab Bar tổng thể
        tabBarStyle: {
          backgroundColor: '#1A1F26', // Màu nền bg-surface của bạn
          borderTopWidth: 1,
          borderTopColor: '#2A333F',   // Đường viền mảnh ngăn cách
          height: 65,
          paddingBottom: 10,
          paddingTop: 8,
        },
        
        // 2. Màu sắc Trạng thái Active/Inactive của cả Icon và Chữ
        tabBarActiveTintColor: '#4ADE80',   // Xanh Mint khi chọn
        tabBarInactiveTintColor: '#9CA3AF', // Xám nhạt khi chưa chọn
        
        // 3. Áp Font chữ hệ thống cho Label dưới Icon
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        
        // 4. Ẩn Header mặc định của hệ thống để sau này tự viết Custom Header cho đẹp
        headerShown: false,
      }}
    >
      {/* TRANG 1: ĐỒNG HỒ ĐẾM GIỜ */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome6 size={size - 2} name="stopwatch" color={color} />
          ),
        }}
      />

      {/* TRANG 2: BẢNG SỐ LIỆU CÂN NẶNG / BMI */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome6 size={size - 2} name="chart-simple" color={color} />
          ),
        }}
      />

      {/* TRANG 3: LƯỚI MA TRẬN PIXEL IN YEAR */}
      <Tabs.Screen
        name="pixel"
        options={{
          title: 'Journey',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome6 size={size - 2} name="calendar-days" color={color} />
          ),
        }}
      />

      {/* TRANG 4: CÀI ĐẶT cấu hình */}
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome6 size={size - 2} name="sliders" color={color} />
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
}

export default MainTab