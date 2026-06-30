import { FastBarChart } from "@/components/dashboard/FastBarChart";
import DashboardHeader from "@/components/dashboard/Header";
import WeightLineChart from "@/components/dashboard/WeightLineChart";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAppSettingsStore } from "@/store/useAppSettingStore";
import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import {
  LayoutChangeEvent,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Tạo mảng thời gian 20 ngày liên tiếp (đếm ngược từ hôm nay)
export const MOCK_DASHBOARD_DATA = Array.from({ length: 20 }).map(
  (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (19 - index)); // Sắp xếp từ xa nhất đến hôm nay
    const dateString = date.toISOString().split("T")[0]; // Định dạng YYYY-MM-DD

    // 1. Khởi tạo hiệu suất nhịn (Giờ nhịn ngẫu nhiên từ 14h đến 24h)
    const fastingHours = Math.floor(Math.random() * 11) + 14;

    // 2. Tạo logic cân nặng với các điều kiện đặc biệt của bạn:
    // Xu hướng cân nặng giả định giảm dần từ 72kg về 70kg
    const baseWeight =
      Math.floor((72 - index * 0.2 + (Math.random() * 0.4 - 0.2)) * 10) / 10;
    let weightLogs: number | null = Number(baseWeight.toFixed(1));

    // Điều kiện: 2 ngày không có dữ liệu (Ví dụ ngày index 5 và index 12)
    if (
      [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].includes(
        index,
      )
    ) {
      weightLogs = null;
    }
    // Điều kiện: 2 ngày có 2 lần nhập dữ liệu (Ví dụ ngày index 8 và index 15)

    return {
      x: dateString,
      y: baseWeight,
    };
  },
);

const DashboardScreen = () => {
  const [layout, setLayout] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const { width } = useWindowDimensions();
  const { theme } = useAppSettingsStore();

  const detectCounterLayout = (e: LayoutChangeEvent) => {
    if (layout) return;
    const { width, height } = e.nativeEvent.layout;
    setLayout({ width: width + 10, height: height + 42 });
  };

  return (
    <ThemedView className="flex-1 bg-main">
      <SafeAreaView>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="px-3">
            <DashboardHeader />

            {/* 4. BIỂU ĐỒ 2: XU HƯỚNG CÂN NẶNG (LINE CHART PLACEHOLDER) */}
            <View className=" rounded-3xl my-4">
              <View className="flex-row justify-between items-center mb-4">
                <View className="items-center justify-center gap-2">
                  <ThemedText className="text-white!">Weight</ThemedText>
                </View>
                <View className="flex-row items-center gap-1">
                  <View
                    style={{ borderColor: theme.colors.text }}
                    className="flex-row items-center p-2 border rounded-lg gap-1"
                  >
                    <ThemedText className="text-xs!">Last 7 days</ThemedText>

                    <Feather
                      name="chevron-down"
                      size={14}
                      color={theme.colors.text}
                    />
                  </View>
                </View>
              </View>

              {/* Hộp đen đại diện cho Line Chart */}
              <View
                style={{ height: 200 }}
                className="bg-[#1A1C24] py-4 px-2 border border-dashed border-gray-700 rounded-lg"
              >
                <WeightLineChart
                  layout={{ width: width - 24, height: 200 }}
                  data={MOCK_DASHBOARD_DATA}
                  target={70}
                />
              </View>
            </View>

            {/* 3. BIỂU ĐỒ 1: TỔNG SỐ GIỜ NHỊN (BAR CHART PLACEHOLDER) */}
            <View className="rounded-3xl my-6 border">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-white font-semibold text-base">
                  Hiệu suất nhịn ăn
                </Text>
                <View className="flex-row items-center gap-1">
                  <View
                    style={{ borderColor: theme.colors.text }}
                    className="flex-row items-center p-2 border rounded-lg gap-1"
                  >
                    <ThemedText className="text-xs!">Last 7 days</ThemedText>

                    <Feather
                      name="chevron-down"
                      size={14}
                      color={theme.colors.text}
                    />
                  </View>
                </View>
              </View>

              {/* Hộp đen đại diện cho Bar Chart */}
              <View
                style={{ height: 200 }}
                className="bg-[#1A1C24] py-4 px-2 border border-dashed border-gray-700 rounded-lg"
              >
                <FastBarChart />
              </View>
            </View>

            {/* 2. QUICK STATS (Thống kê nhanh dạng số) */}
            <Text className="text-white font-semibold text-base">
              Statistics
            </Text>
            <View className="flex-row items-center justify-between flex-wrap my-4 gap-4">
              {/* Card 1: Streak */}
              <View className="bg-black p-4 rounded-2xl flex-1 border border-gray-800 shadow shadow-gray-800">
                <Text className="text-gray-400 text-xs mb-1">
                  Streak hiện tại
                </Text>
                <Text className="text-white text-xl font-semibold">
                  5 ngày 🔥
                </Text>
              </View>

              {/* Card 2: Total Hours */}
              <View className="bg-black p-4 rounded-2xl flex-1 border border-gray-800 shadow shadow-gray-800">
                <Text className="text-gray-400 text-xs mb-1">
                  Tổng giờ nhịn
                </Text>
                <Text className="text-white text-xl font-semibold">
                  128 giờ
                </Text>
              </View>
            </View>

            <View className="flex-row items-center justify-between flex-wrap mb-6 gap-4">
              {/* Card 1: Streak */}
              <View className="bg-black p-4 rounded-2xl flex-1 border border-gray-800 shadow shadow-gray-800">
                <Text className="text-gray-400 text-xs mb-1">Max Streak</Text>
                <Text className="text-white text-xl font-semibold">
                  105 ngày
                </Text>
              </View>

              {/* Card 2: Total Hours */}
              <View className="bg-black p-4 rounded-2xl flex-1 border border-gray-800 shadow shadow-gray-800">
                <Text className="text-gray-400 text-xs mb-1">
                  Trung bình giờ nhịn
                </Text>
                <Text className="text-white text-xl font-semibold">
                  128 giờ
                </Text>
              </View>
            </View>

            <Text className="text-white font-semibold text-base">
              Fast level
            </Text>
            <View className="flex-row items-center justify-between flex-wrap my-4 gap-2">
              {/* Card 1: Streak */}
              <View className="bg-black p-2 rounded-2xl flex-1 border border-gray-800 shadow shadow-gray-800">
                <Text className="text-gray-400 text-xs mb-1">16+</Text>
                <Text className="text-white text-center text-xl font-semibold">
                  5
                </Text>
              </View>

              {/* Card 2: Total Hours */}
              <View className="bg-black p-2 rounded-2xl flex-1 border border-gray-800 shadow shadow-gray-800">
                <Text className="text-gray-400 text-xs mb-1">24+</Text>
                <Text className="text-white text-center text-xl font-semibold">
                  128
                </Text>
              </View>
              <View className="bg-black p-2 rounded-2xl flex-1 border border-gray-800 shadow shadow-gray-800">
                <Text className="text-gray-400 text-xs mb-1">36+</Text>
                <Text className="text-white text-center text-xl font-semibold">
                  5
                </Text>
              </View>

              {/* Card 2: Total Hours */}
              <View className="bg-black p-2 rounded-2xl flex-1 border border-gray-800 shadow shadow-gray-800">
                <Text className="text-gray-400 text-xs mb-1">48+</Text>
                <Text className="text-white text-center text-xl font-semibold">
                  128
                </Text>
              </View>
              <View className="bg-black p-2 rounded-2xl flex-1 border border-gray-800 shadow shadow-gray-800">
                <Text className="text-gray-400 text-xs mb-1">72+</Text>
                <Text className="text-white text-center text-xl font-semibold">
                  128
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
};

export default DashboardScreen;
