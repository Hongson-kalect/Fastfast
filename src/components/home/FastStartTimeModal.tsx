import { useAppStore } from "@/stores/appStore";
import { getLocalTodayStr } from "@/util/timer";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";
import { Toast } from "toastify-react-native";

type Props = {
  minTime?: number | null;
  onSubmit: (startTime: number) => void;
};

const MAX_DELAY_MS = 6 * 60 * 60 * 1000;

const START_PRESETS = [
  { label: "30p", minutes: 30 },
  { label: "1h", minutes: 60 },
  { label: "2h", minutes: 120 },
  { label: "4h", minutes: 240 },
  { label: "6h", minutes: 360 },
];

const FastStartTimeModal = ({ minTime, onSubmit }: Props) => {
  const { theme } = useAppStore();

  const [now] = useState(() => new Date());
  const [startTime, setStartTime] = useState(now.getTime());
  const [showPicker, setShowPicker] = useState(false);

  const selectedDate = new Date(startTime);
  const today = getLocalTodayStr(now);
  const date = getLocalTodayStr(selectedDate);

  const hours = selectedDate.getHours();
  const minutes = selectedDate.getMinutes();

  const minAllowedTime = now.getTime() - MAX_DELAY_MS;

  const validateTime = (time: number): boolean => {
    if (minTime && time < minTime) {
      Toast.show({
        type: "error",
        text1: "Thời gian không hợp lệ",
        text2: "Trùng thời gian với phiên trước đó!",
      });
      return false;
    }
    if (time < minAllowedTime) {
      Toast.show({
        type: "error",
        text1: "Thời gian không hợp lệ",
        text2: "Chỉ được phép bắt đầu sớm tối đa 6 giờ!",
      });
      return false;
    }

    if (time > now.getTime()) {
      Toast.show({
        type: "error",
        text1: "Thời gian không hợp lệ",
        text2: "Không thể chọn thời gian ở tương lai!",
      });
      return false;
    }

    return true;
  };

  const applyTime = (time: number) => {
    if (validateTime(time)) {
      setStartTime(time);
    }
  };

  const handleQuickPreset = (minutes: number) => {
    applyTime(now.getTime() - minutes * 60 * 1000);
  };

  const adjustMinutes = (delta: number) => {
    applyTime(startTime + delta * 60 * 1000);
  };

  const handlePickerChange = (_: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowPicker(false);
    }

    if (selectedDate) {
      applyTime(selectedDate.getTime());
    }
  };

  const handleSubmit = () => {
    if (validateTime(startTime)) {
      onSubmit(startTime);
    }
  };

  return (
    <View className="pb-6 pt-4">
      {/* Header */}
      <View className="mb-4">
        <Text className="text-base font-bold text-white">
          Chọn thời gian bắt đầu Fast
        </Text>

        <Text className="mt-1 text-xs text-zinc-500">
          Có thể bắt đầu sớm hơn hiện tại tối đa 6 giờ
        </Text>
      </View>

      {/* Quick Presets */}
      <Text className="mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
        Bắt đầu sớm
      </Text>

      <View className="mb-6 flex-row gap-x-2">
        {START_PRESETS.map((preset) => (
          <TouchableOpacity
            key={preset.label}
            activeOpacity={0.7}
            onPress={() => handleQuickPreset(preset.minutes)}
            className="flex-1 items-center justify-center rounded-xl border border-white/10 bg-zinc-800/80 py-2.5 active:border-sky-500/50 active:bg-sky-500/20"
          >
            <Text className="text-xs font-bold text-sky-400">
              -{preset.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Time */}
      <View className="items-center justify-center rounded-2xl border border-white/5 bg-zinc-950/60 p-4">
        <View className="flex-row items-center justify-center gap-x-4">
          <TouchableOpacity
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10 }}
            onPress={() => adjustMinutes(-5)}
            className="h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-zinc-800 active:bg-zinc-700"
          >
            <Text className="text-sm font-bold text-zinc-300">-5</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowPicker(true)}
            className="w-36 items-center justify-center rounded-xl border border-dashed border-white/20 bg-zinc-900/80 py-3"
          >
            <Text className="text-4xl font-bold text-white tabular-nums">
              {hours.toString().padStart(2, "0")}:
              {minutes.toString().padStart(2, "0")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, right: 10 }}
            onPress={() => adjustMinutes(5)}
            className="h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-zinc-800 active:bg-zinc-700"
          >
            <Text className="text-sm font-bold text-zinc-300">+5</Text>
          </TouchableOpacity>
        </View>

        {/* Date */}
        <View className="mt-3 flex-row items-center justify-center">
          <Text
            className={`text-xs font-medium ${
              date !== today ? "text-warning/90" : "text-white/60"
            }`}
          >
            {date !== today && "⚠️ "}
            {date === today ? "Hôm nay" : date}
          </Text>
        </View>
      </View>

      {/* Native Picker */}
      {showPicker && (
        <DateTimePicker
          value={new Date(startTime)}
          mode="time"
          is24Hour
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onValueChange={handlePickerChange}
        />
      )}

      {/* Confirm */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleSubmit}
        style={{
          boxShadow: `0px 4px 8px ${theme.primary}`,
        }}
        className="mt-5 items-center justify-center rounded-2xl bg-primary py-3.5"
      >
        <Text className="text-sm font-bold text-white">
          Xác nhận bắt đầu Fast
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default FastStartTimeModal;
