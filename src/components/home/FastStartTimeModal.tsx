import { useAppStore } from "@/stores/appStore";
import { getLocalTodayStr } from "@/util/timer";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Platform, TouchableOpacity, View } from "react-native";
import { Toast } from "toastify-react-native";
import { ThemedText } from "../themed-text";

type Props = {
  minTime?: number | null;
  onSubmit: (startTime: number) => void;
};
const MAX_DELAY_MS = 24 * 60 * 60 * 1000;

const START_PRESETS = [
  { label: "2h", minutes: 120 },
  { label: "6h", minutes: 360 },
  { label: "12h", minutes: 720 },
  { label: "18h", minutes: 1080 },
  { label: "24h", minutes: 1440 },
];

const FastStartTimeModal = ({ minTime, onSubmit }: Props) => {
  const { theme } = useAppStore();

  const [now] = useState(() => new Date());
  const [startTime, setStartTime] = useState(now.getTime());
  const [showPicker, setShowPicker] = useState(false);

  const selectedDate = new Date(startTime);

  const today = getLocalTodayStr(now);
  const selectedDay = getLocalTodayStr(selectedDate);

  const hours = selectedDate.getHours();
  const minutes = selectedDate.getMinutes();

  const minAllowedTime = now.getTime() - MAX_DELAY_MS;

  const showError = (text2: string) => {
    Toast.show({
      type: "error",
      text1: "Thời gian không hợp lệ",
      text2,
      useModal: true,
    });
  };

  const validateTime = (time: number) => {
    if (minTime && time < minTime) {
      showError("Trùng thời gian với phiên trước đó!");
      return false;
    }

    if (time < minAllowedTime) {
      showError("Chỉ được phép bắt đầu sớm tối đa 24 giờ!");
      return false;
    }

    if (time > now.getTime()) {
      showError("Không thể chọn thời gian ở tương lai!");
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

  const handlePickerChange = (_event: any, value?: Date) => {
    if (Platform.OS === "android") {
      setShowPicker(false);
    }

    if (value) {
      applyTime(value.getTime());
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
      <View className="mb-5">
        <ThemedText size="md" weight="bold" color="title">
          Chọn thời gian bắt đầu Fast
        </ThemedText>

        <ThemedText size="xs" color="text" opacity="medium" className="mt-1">
          Có thể bắt đầu sớm hơn hiện tại tối đa 24 giờ
        </ThemedText>
      </View>

      {/* Quick presets */}
      <View className="mb-5">
        <ThemedText
          size="xxs"
          weight="bold"
          color="text"
          opacity="medium"
          className="mb-2"
          style={{
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          Bắt đầu sớm
        </ThemedText>

        <View className="flex-row gap-2">
          {START_PRESETS.map((preset) => (
            <TouchableOpacity
              key={preset.label}
              activeOpacity={0.7}
              onPress={() => handleQuickPreset(preset.minutes)}
              className="flex-1 items-center justify-center rounded-xl border border-text-base/10 bg-background2 py-2.5"
            >
              <ThemedText size="xs" weight="bold" color="primary">
                -{preset.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Time selector */}
      <View className="items-center rounded-2xl border border-text-base/10 bg-background2/60 px-4 py-4">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            activeOpacity={0.7}
            hitSlop={10}
            onPress={() => adjustMinutes(-5)}
            className="h-11 w-11 items-center justify-center rounded-full border border-text-base/10 bg-background"
          >
            <ThemedText size="sm" weight="bold" color="text" opacity="medium">
              −5
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowPicker(true)}
            className="min-w-36 items-center justify-center rounded-xl border border-primary/20 bg-primary/5 px-5 py-3"
          >
            <ThemedText
              size="xxxl"
              weight="bold"
              color="title"
              style={{
                fontVariant: ["tabular-nums"],
              }}
            >
              {hours.toString().padStart(2, "0")}:
              {minutes.toString().padStart(2, "0")}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            hitSlop={10}
            onPress={() => adjustMinutes(5)}
            className="h-11 w-11 items-center justify-center rounded-full border border-text-base/10 bg-background"
          >
            <ThemedText size="sm" weight="bold" color="text" opacity="medium">
              +5
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Date */}
        <View className="mt-3">
          <ThemedText
            size="xs"
            weight="medium"
            color={selectedDay !== today ? "warning" : "text"}
            opacity={selectedDay !== today ? "full" : "medium"}
          >
            {selectedDay !== today && "⚠️ "}
            {selectedDay === today ? "Hôm nay" : selectedDay}
          </ThemedText>
        </View>
      </View>

      {/* Native picker */}
      {showPicker && (
        <DateTimePicker
          value={selectedDate}
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
        className="mt-5 items-center justify-center rounded-2xl bg-primary py-3.5"
        style={{
          boxShadow: `0px 4px 8px ${theme.primary}40`,
        }}
      >
        <ThemedText size="sm" weight="bold" colorHex="white">
          Xác nhận bắt đầu Fast
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
};
export default FastStartTimeModal;
