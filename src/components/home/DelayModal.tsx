import { useAppStore } from "@/stores/appStore";
import { getLocalTodayStr } from "@/util/timer";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useMemo, useState } from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";
import { Toast } from "toastify-react-native"; // Hoặc import Toast helper của dự án bạn

type Props = {
  onSubmit: (time: number) => void;
  isCounting: boolean;
};

const SIX_HOURS_MS = 6 * 60 * 60 * 1000; // 6 tiếng tính bằng milliseconds

const START_PRESETS = [
  { label: "-30p", minutes: 30 },
  { label: "-1h", minutes: 60 },
  { label: "-2h", minutes: 120 },
  { label: "-4h", minutes: 240 },
  { label: "-6h", minutes: 360 },
];

const DelayModal = ({ onSubmit, isCounting }: Props) => {
  const { theme } = useAppStore();
  const [{ now, today }] = useState(() => {
    const date = new Date();
    return {
      now: date,
      today: getLocalTodayStr(date),
    };
  });

  const [selectingTime, setSelectingTime] = useState(now.getTime());
  const [showPicker, setShowPicker] = useState(false);

  const { hours, minutes, date } = useMemo(() => {
    const d = new Date(selectingTime);
    return {
      hours: d.getHours(),
      minutes: d.getMinutes(),
      date: getLocalTodayStr(d),
    };
  }, [selectingTime]);

  // --- HÀM VALIDATE THỜI GIAN ---
  const validateAndApplyTime = (targetTime: number): boolean => {
    const minAllowedTime = now.getTime() - SIX_HOURS_MS;
    const maxAllowedTime = now.getTime(); // Không cho phép đặt ở tương lai (hoặc tinh chỉnh nếu cần)

    // 1. Check lùi quá 6 tiếng
    if (targetTime < minAllowedTime) {
      Toast.show({
        type: "error",
        text1: "Thời gian không hợp lệ",
        text2: "Chỉ được phép lùi tối đa 6 giờ!",
      });
      return false;
    }

    // 2. Check vượt quá thời gian hiện tại
    if (targetTime > maxAllowedTime) {
      Toast.show({
        type: "error",
        text1: "Thời gian không hợp lệ",
        text2: "Không thể chọn thời gian ở tương lai!",
      });
      return false;
    }

    setSelectingTime(targetTime);
    return true;
  };

  // Quick Presets
  const handleQuickPreset = (minutesDiff: number) => {
    let targetDateMs: number;
    targetDateMs = now.getTime() - minutesDiff * 60 * 1000;
    validateAndApplyTime(targetDateMs);
  };

  // Adjust +/- 5 phút
  const adjustMinutes = (deltaMinutes: number) => {
    const nextTime = selectingTime + deltaMinutes * 60 * 1000;
    validateAndApplyTime(nextTime);
  };

  // Picker Native Callback
  const handlePickerChange = (_: any, selectedDate?: Date) => {
    setShowPicker(Platform.OS === "ios");
    if (selectedDate) {
      validateAndApplyTime(selectedDate.getTime());
    }
  };

  // Submit Handler
  const handleSubmit = () => {
    if (validateAndApplyTime(selectingTime)) {
      onSubmit(selectingTime);
    }
  };

  return (
    <View className="pb-6 pt-4">
      {/* Header */}
      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-base font-bold text-white">
          {isCounting
            ? "Sửa thời gian kết thúc nhịn?"
            : "Chọn thời gian bắt đầu nhịn?"}
        </Text>
      </View>

      {/* 1. Quick Chips */}
      <Text className="mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
        {isCounting ? "Điều chỉnh nhanh" : "Lùi nhanh thời gian (Tối đa 6h)"}
      </Text>
      <View className="mb-6 flex-row justify-between gap-x-2">
        {START_PRESETS.map((chip) => (
          <TouchableOpacity
            key={chip.label}
            activeOpacity={0.7}
            onPress={() => handleQuickPreset(chip.minutes)}
            className="flex-1 items-center justify-center rounded-xl border border-white/10 bg-zinc-800/80 py-2.5 active:border-sky-500/50 active:bg-sky-500/20"
          >
            <Text className="text-xs font-bold text-sky-400">
              {!isCounting ? `-${chip.label}` : chip.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 2. Big HH:MM Display */}
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
            <Text className="text-center text-4xl font-bold text-white tabular-nums">
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

        {/* 3. Date Subtitle */}
        <View className="mt-3 flex-row items-center justify-center">
          <Text
            className={`${date !== today ? "text-warning/90" : "text-white/60"} text-xs font-medium`}
          >
            {date !== today && "⚠️ "}
            {date === today ? "Hôm nay" : date}
          </Text>
        </View>
      </View>

      {showPicker && (
        <DateTimePicker
          value={new Date(selectingTime)}
          mode="time"
          is24Hour={true}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handlePickerChange}
        />
      )}

      {/* Confirm Button */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleSubmit}
        style={{
          boxShadow:
            "0px 4px 8px " + (isCounting ? theme.error : theme.primary),
        }}
        className={`mt-5 items-center justify-center rounded-2xl ${isCounting ? "bg-error" : "bg-primary"} py-3.5`}
      >
        <Text className="text-sm font-bold text-white">
          {isCounting ? "Xác nhận kết thúc Fast" : "Xác nhận bắt đầu Fast"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default DelayModal;
