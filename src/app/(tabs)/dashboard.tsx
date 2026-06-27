import DashboardHeader from "@/components/dashboard/Header";
import WeightLineChart from "@/components/dashboard/WeightLineChart";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
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
    const baseWeight = 72 - index * 0.1 + (Math.random() * 0.4 - 0.2);
    let weightLogs: number[] = [Number(baseWeight.toFixed(1))];

    // Điều kiện: 2 ngày không có dữ liệu (Ví dụ ngày index 5 và index 12)
    if (
      [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].includes(
        index,
      )
    ) {
      weightLogs = [];
    }
    // Điều kiện: 2 ngày có 2 lần nhập dữ liệu (Ví dụ ngày index 8 và index 15)
    else if (index === 8 || index === 15) {
      weightLogs = [
        Number((baseWeight + 0.3).toFixed(1)), // Lần 1 (Sáng)
        Number(baseWeight.toFixed(1)), // Lần 2 (Tối - giảm tí)
      ];
    }

    return {
      date: dateString,
      fastingHours,
      weightLogs, // Mảng chứa các lần cân trong ngày
    };
  },
);

const DashboardScreen = () => {
  const [layout, setLayout] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const { width } = useWindowDimensions();

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
            <View className="mt-8" style={{ height: 200 }}>
              <WeightLineChart />
            </View>

            {/* 4. BIỂU ĐỒ 2: XU HƯỚNG CÂN NẶNG (LINE CHART PLACEHOLDER) */}
            <View className=" rounded-3xl my-4">
              <View className="flex-row justify-between items-center mb-4">
                <ThemedText className="text-white!">Cân nặng</ThemedText>
                <View className="flex-row items-center gap-1">
                  <View className="flex-row items-center px-2 py-1 border border-[#7EF9FF] rounded-lg">
                    <ThemedText className="text-xs! text-[#7EF9FF]!">
                      Now: 70kg
                    </ThemedText>
                  </View>
                </View>
                {/* <Text className="text-white font-semibold text-base">
                  Biến động cân nặng
                </Text> */}
              </View>

              {/* Hộp đen đại diện cho Line Chart */}
              <View
                style={{ height: 200 }}
                onLayout={detectCounterLayout}
                className="bg-[#1A1C24] items-center justify-center border border-dashed border-gray-700 rounded-lg"
              >
                <WeightLineChart
                  layout={{ width: width - 24, height: 200 }}
                  //   data={MOCK_DASHBOARD_DATA}
                  //   targetWeight={70}
                />
              </View>
            </View>

            {/* 3. BIỂU ĐỒ 1: TỔNG SỐ GIỜ NHỊN (BAR CHART PLACEHOLDER) */}
            <View className="bg-black rounded-3xl my-6 border border-gray-900">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-white font-semibold text-base">
                  Hiệu suất nhịn ăn
                </Text>
                <Text className="text-gray-400 text-xs">Tuần này</Text>
              </View>

              {/* Hộp đen đại diện cho Bar Chart */}
              <View className="h-48 bg-[#1A1C24] rounded-2xl items-center justify-center border border-dashed border-gray-700">
                <Text className="text-gray-500 font-medium">
                  [ BAR CHART PLACEHOLDER ]
                </Text>
                <Text className="text-gray-600 text-xs mt-1">
                  (Tổng số giờ nhịn: Thứ 2 - Chủ Nhật)
                </Text>
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
