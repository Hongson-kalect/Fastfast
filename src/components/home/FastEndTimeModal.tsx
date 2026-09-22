import {
  MAX_FAST_HOURS,
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
import { TouchableOpacity, View } from "react-native";
import { Toast } from "toastify-react-native";
import { ThemedText } from "../themed-text";

type Props = {
  startTime: number;
  targetFinishTime: number | null;
  currentFast: FastSession;
};

const STEP = 5 * 60 * 1000; // 5 phút
const MIN_SLIDER_RANGE = 60 * 60 * 1000; // 1 giờ
const LIMIT_SLIDER_RANGE = MAX_FAST_HOURS * 60 * 60 * 1000;

const FastEndTimeModal = ({
  startTime,
  targetFinishTime,
  currentFast,
}: Props) => {
  const { theme } = useAppStore();
  const [isMaxRange] = useState(Date.now() >= startTime + LIMIT_SLIDER_RANGE);

  const { now, sliderMin, effectiveMax, today } = useMemo(() => {
    const now = Date.now();

    // Không cho chọn tương lai.
    const sliderMax = now;

    const sliderMin = startTime;
    const sliderLimit = sliderMin + LIMIT_SLIDER_RANGE;

    // Nếu khoảng quá nhỏ thì vẫn tạo vùng kéo tối thiểu 1 giờ.
    const effectiveMax = Math.min(
      sliderLimit,
      Math.max(sliderMax, sliderMin + MIN_SLIDER_RANGE),
    );

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
    if (displayTime > now)
      return {
        type: "failed" as const,
        title: "Thời gian không hợp lệ",
        description: "Đây là mốc thời gian trong tương lai.",
      };
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
      <View className="mb-4 flex-row items-center justify-center">
        <ThemedText size="sm" color="warning" opacity="medium">
          Phiên nhịn không quá {MAX_FAST_HOURS} giờ
        </ThemedText>
      </View>

      <View className="mb-5">
        <ThemedText size="md" weight="bold">
          Chọn thời gian kết thúc
        </ThemedText>
      </View>

      {/* Selected time */}
      <View className="items-center justify-center rounded-2xl border border-text-base/10 bg-background/60 p-5">
        <ThemedText
          size="xxxl"
          weight="bold"
          style={{ fontVariant: ["tabular-nums"] }}
        >
          {hours.toString().padStart(2, "0")}:
          {minutes.toString().padStart(2, "0")}
        </ThemedText>

        <ThemedText
          size="xs"
          weight="medium"
          color={date !== today ? "warning" : "text"}
          opacity={date !== today ? "full" : "medium"}
          style={{ marginTop: 8 }}
        >
          {date !== today
            ? `⚠️ ${getRelativeTime(new Date(date), false)}`
            : "Hôm nay"}
        </ThemedText>
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
          maximumTrackTintColor={theme.text + "1F"}
          thumbTintColor={theme.primary}
          thumbTouchSize={{
            width: 40,
            height: 40,
          }}
          onValueChange={handleSliderChange}
          onSlidingComplete={handleSlidingComplete}
        />

        <View className="mt-1 flex-row justify-between">
          <ThemedText size="xxs" color="text" opacity="medium">
            {getRelativeTime(new Date(startTime))}
          </ThemedText>

          <ThemedText size="xxs" color="text" opacity="medium">
            {formatTime(effectiveMax)}
          </ThemedText>
        </View>
      </View>

      <View className="mt-5 rounded-xl bg-background2/70 px-4 py-3">
        <View className="mt-3 border-t border-text-base/10 pt-3">
          <ThemedText
            size="sm"
            weight="semibold"
            color={finishStatus.type === "completed" ? "success" : "warning"}
          >
            {finishStatus.type === "completed" ? "✓ " : "⚠️ "}
            {finishStatus.title}
          </ThemedText>

          <ThemedText
            size="xs"
            color="text"
            opacity="medium"
            style={{ marginTop: 4, lineHeight: 20 }}
          >
            {finishStatus.description}
          </ThemedText>
        </View>

        {targetFinishTime && (
          <View className="mt-3 flex-row justify-between border-t border-text-base/10 pt-3">
            <ThemedText size="xs" color="text" opacity="medium">
              Mục tiêu
            </ThemedText>

            <ThemedText size="xs" weight="medium" color="text" opacity="medium">
              {formatTime(targetFinishTime)}
            </ThemedText>
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
        <ThemedText size="sm" weight="bold" colorHex="#FFFFFF">
          Xác nhận kết thúc Fast
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
};

export default FastEndTimeModal;
