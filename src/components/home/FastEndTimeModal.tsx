import {
  MIN_FAST_DURATION,
  TOO_QUICK_DURATION,
} from "@/database/shema/fast_sessions";
import { useDBService } from "@/hooks/useDBService";
import { FastSession } from "@/interfaces/db.type";
import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import { finishFast } from "@/util/home/fast";
import { getLocalTodayStr, getRelativeTime } from "@/util/timer";
import { Slider } from "@miblanchard/react-native-slider";
import { useMemo, useRef, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Toast } from "toastify-react-native";

type Props = {
  startTime: number;
  targetFinishTime: number | null;
  currentFast: FastSession;
};

const STEP = 5 * 60 * 1000; // 5 phút
const MIN_SLIDER_RANGE = STEP;

const FastEndTimeModal = ({
  startTime,
  targetFinishTime,
  currentFast,
}: Props) => {
  const { theme } = useAppStore();

  const { now, sliderMin, effectiveMax, today } = useMemo(() => {
    const now = Date.now();

    // Không cho chọn tương lai.
    const sliderMax = now;

    const sliderMin = startTime;
    const sliderRange = sliderMax - sliderMin;

    // Nếu khoảng quá nhỏ thì vẫn tạo vùng kéo tối thiểu 1 giờ.
    const effectiveMax =
      sliderRange < MIN_SLIDER_RANGE ? sliderMin + MIN_SLIDER_RANGE : sliderMax;

    return {
      now,
      sliderMin,
      effectiveMax,
      today: getLocalTodayStr(new Date(now)),
    };
  }, [startTime]);

  const initialTime = Math.min(now, effectiveMax);

  // Giá trị thực tế đang được slider giữ.
  // Không dùng state để tránh render ngược vào slider.
  const selectedTimeRef = useRef(initialTime);

  // Chỉ dùng state cho phần text HH:mm.
  const [displayTime, setDisplayTime] = useState(initialTime);

  const { date, hours, minutes } = useMemo(() => {
    const selectedDate = new Date(displayTime);

    return {
      hours: selectedDate.getHours(),
      minutes: selectedDate.getMinutes(),
      date: getLocalTodayStr(selectedDate),
    };
  }, [displayTime]);

  const formatTime = (time: number) =>
    new Date(time).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

  const handleSliderChange = (values: number[]) => {
    const value = values[0];

    if (value == null) return;

    selectedTimeRef.current = value;
    setDisplayTime(value);
  };

  const handleSlidingComplete = (values: number[]) => {
    const value = values[0];

    if (value == null) return;

    selectedTimeRef.current = value;
    setDisplayTime(value);
  };

  const selectedDuration = displayTime - startTime;
  const getFinishStatus = () => {
    const seconds = selectedDuration / 1000;
    if (seconds < TOO_QUICK_DURATION) {
      return {
        type: "too_quick" as const,
        title: "Phiên sẽ bị hủy",
        description: "Thời gian quá ngắn để được ghi nhận.",
      };
    }
    if (seconds < MIN_FAST_DURATION) {
      return {
        type: "failed" as const,
        title: "Phiên sẽ được đánh dấu thất bại",
        description: "Chưa đạt thời gian tối thiểu để hoàn thành Fast.",
      };
    }
    return {
      type: "completed" as const,
      title: "Phiên sẽ được hoàn thành",
      description: "Thời gian này đủ để ghi nhận Fast.",
    };
  };
  const finishStatus = getFinishStatus();

  const dbService = useDBService();
  const { addModal } = useModalStore();
  const handleSubmit = async () => {
    const finalTime = selectedTimeRef.current;

    if (finalTime > now) {
      Toast.show({
        type: "error",
        text1: "Thời gian không hợp lệ",
        text2: "Không thể chọn thời gian ở tương lai!",
      });
      return;
    }

    if (finalTime < startTime) {
      Toast.show({
        type: "error",
        text1: "Thời gian không hợp lệ",
        text2: "Thời gian kết thúc phải sau thời gian bắt đầu!",
      });
      return;
    }
    addModal(null);
    await finishFast({ dbService, currentFast, endTime: finalTime });
  };

  return (
    <View className="pb-6 pt-4">
      {/* Header */}
      <View className="mb-5">
        <Text className="text-base font-bold text-white">
          Chọn thời gian kết thúc
        </Text>
      </View>

      {/* Selected time */}
      <View className="items-center justify-center rounded-2xl border border-white/5 bg-zinc-950/60 p-5">
        <Text className="text-4xl font-bold text-white tabular-nums">
          {hours.toString().padStart(2, "0")}:
          {minutes.toString().padStart(2, "0")}
        </Text>

        <Text
          className={`mt-2 text-xs font-medium ${
            date !== today ? "text-warning/90" : "text-white/50"
          }`}
        >
          {date !== today ? `⚠️ ${date}` : "Hôm nay"}
        </Text>
      </View>

      {/* Slider */}
      <View className="mt-6">
        <Slider
          containerStyle={{
            height: 40,
          }}
          minimumValue={sliderMin}
          maximumValue={effectiveMax}
          value={initialTime}
          step={STEP}
          minimumTrackTintColor={theme.primary}
          maximumTrackTintColor="rgba(255,255,255,0.12)"
          thumbTintColor={theme.primary}
          thumbTouchSize={{
            width: 40,
            height: 40,
          }}
          onValueChange={handleSliderChange}
          onSlidingComplete={handleSlidingComplete}
        />

        <View className="mt-1 flex-row justify-between">
          <Text className="text-[11px] text-zinc-500">
            {getRelativeTime(new Date(startTime))}
          </Text>

          <Text className="text-[11px] text-zinc-500">
            {formatTime(effectiveMax)}
          </Text>
        </View>
      </View>

      <View className="mt-5 rounded-xl bg-zinc-900/70 px-4 py-3">
        <View className="mt-3 border-t border-white/5 pt-3">
          <Text
            className={`text-sm font-semibold ${finishStatus.type === "completed" ? "text-success" : "text-warning"}`}
          >
            {finishStatus.type === "completed" ? "✓ " : "⚠️ "}
            {finishStatus.title}
          </Text>
          <Text className="mt-1 text-xs leading-5 text-zinc-500">
            {finishStatus.description}
          </Text>
        </View>
        {targetFinishTime && (
          <View className="mt-3 flex-row justify-between border-t border-white/5 pt-3">
            <Text className="text-xs text-zinc-500"> Mục tiêu </Text>
            <Text className="text-xs font-medium text-zinc-300">
              {formatTime(targetFinishTime)}
            </Text>
          </View>
        )}
      </View>
      {/* Confirm */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleSubmit}
        style={{
          boxShadow: `0px 4px 8px ${theme.error}`,
        }}
        className="mt-5 items-center justify-center rounded-2xl bg-error py-3.5"
      >
        <Text className="text-sm font-bold text-white">
          Xác nhận kết thúc Fast
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default FastEndTimeModal;
