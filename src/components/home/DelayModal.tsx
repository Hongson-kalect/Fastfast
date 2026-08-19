import { getLocalTodayStr } from "@/util/timer";
import { useMemo, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

type Props = {
  onSubmit: (time: number) => void;
  isCounting: boolean;
};

const QUICK_PRESETS = [
  { label: "30p", minutes: 30 },
  { label: "1h", minutes: 60 },
  { label: "2h", minutes: 120 },
  { label: "4h", minutes: 240 },
  { label: "6h", minutes: 360 },
];

const DelayModal = ({ onSubmit, isCounting }: Props) => {
  const [{ now, today }] = useState(() => {
    const date = new Date();
    return {
      now: date,
      today: getLocalTodayStr(date),
    };
  });
  const [selectingTime, setSelectingTime] = useState(now.getTime());
  const { hours, minutes, date } = useMemo(() => {
    const date = new Date(selectingTime);
    return {
      hours: date.getHours(),
      minutes: date.getMinutes(),
      date: getLocalTodayStr(date),
    };
  }, [selectingTime]);
  const returnQuickPresets = (minutes: number) => {
    const date = new Date(now.getTime() - minutes * 60 * 1000);
    onSubmit(date.getTime());
  };

  const adjustMinutes = (minutes: number) => {
    const date = new Date(selectingTime + minutes * 60 * 1000);
    setSelectingTime(date.getTime());
  };

  return (
    <View className="pt-4 pb-6">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-base font-bold text-white">
          Chọn thời gian nhịn?
        </Text>
      </View>

      {/* 1. Quick Chips (NOW - X) */}
      <Text className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
        Lùi nhanh thời gian
      </Text>
      <View className="flex-row justify-between gap-x-2 mb-6">
        {QUICK_PRESETS.map((chip) => (
          <TouchableOpacity
            key={chip.label}
            activeOpacity={0.7}
            onPress={() => returnQuickPresets(chip.minutes)}
            className="flex-1 items-center justify-center rounded-xl border border-white/10 bg-zinc-800/80 py-2.5 active:bg-sky-500/20 active:border-sky-500/50"
          >
            <Text className="text-xs font-bold text-sky-400">
              -{chip.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 2. Big HH:MM Display + Fine Tune Buttons */}
      <View className="items-center justify-center bg-zinc-950/60 rounded-2xl p-4 border border-white/5">
        <View className="flex-row items-center justify-center gap-x-4">
          {/* Nút -5m */}
          <TouchableOpacity
            onPress={() => adjustMinutes(-5)}
            className="h-10 w-10 items-center justify-center rounded-full bg-zinc-800 border border-white/10 active:bg-zinc-700"
          >
            <Text className="text-sm font-bold text-zinc-300">-5</Text>
          </TouchableOpacity>

          <View>
            <Text className="text-3xl font-bold text-white">
              {hours.toString().padStart(2, "0")}:
              {minutes.toString().padStart(2, "0")}
            </Text>
          </View>

          {/* Nút +5m */}
          <TouchableOpacity
            onPress={() => adjustMinutes(5)}
            className="h-10 w-10 items-center justify-center rounded-full bg-zinc-800 border border-white/10 active:bg-zinc-700"
          >
            <Text className="text-sm font-bold text-zinc-300">+5</Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* 3. Date Subtitle (Nổi bật nếu lùi sang hôm qua) */}
      <View className="mt-2 flex-row items-center">
        <Text>{date}</Text>
        <Text
          className={`text-xs font-semibold ${
            date !== today ? "text-amber-400" : "text-zinc-400"
          }`}
        >
          {date !== today && "⚠️ "}
        </Text>
      </View>

      {/* Confirm Action Button */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onSubmit(selectingTime)}
        className="mt-5 items-center justify-center rounded-2xl bg-primary py-3.5"
      >
        <Text className="text-sm font-bold text-white">
          Xác nhận bắt đầu Fast
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default DelayModal;
