import { useAppStore } from "@/stores/appStore";
import { getLocalTodayStr } from "@/util/timer";
import Slider from "@react-native-community/slider";
import { useMemo, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Toast } from "toastify-react-native";

type Props = {
  startTime: number;
  targetFinishTime: number | null;
  onSubmit: (endTime: number) => void;
};

const MIN_SLIDER_RANGE = 60 * 60 * 1000; // 1 giờ

const FastEndTimeModal = ({ startTime, targetFinishTime, onSubmit }: Props) => {
  const { theme } = useAppStore();

  const now = Date.now();

  /**
   * Target chỉ được dùng để mở rộng vùng slider.
   *
   * Ví dụ:
   * start = 08:00
   * target = 20:00
   * now   = 18:00
   *
   * => slider: 08:00 -> 20:00
   *
   * Nhưng khi submit vẫn không cho endTime > now.
   *
   * Nếu:
   * start = 08:00
   * target = 12:00
   * now   = 15:00
   *
   * => slider: 08:00 -> 15:00
   */
  const sliderMax = now;

  /**
   * Nếu start và max quá gần nhau thì mở rộng vùng slider
   * để người dùng dễ thao tác.
   */
  const sliderMin = startTime;
  const sliderRange = sliderMax - sliderMin;

  const effectiveMax =
    sliderRange < MIN_SLIDER_RANGE ? sliderMin + MIN_SLIDER_RANGE : sliderMax;

  const [selectedTime, setSelectedTime] = useState(Math.min(now, effectiveMax));

  const selectedDate = useMemo(() => new Date(selectedTime), [selectedTime]);

  const hours = selectedDate.getHours();
  const minutes = selectedDate.getMinutes();

  const date = getLocalTodayStr(selectedDate);
  const today = getLocalTodayStr(new Date());

  const handleSubmit = () => {
    /**
     * Không cho xác nhận thời gian tương lai.
     */
    if (selectedTime > now) {
      Toast.show({
        type: "error",
        text1: "Thời gian không hợp lệ",
        text2: "Không thể chọn thời gian ở tương lai!",
      });
      return;
    }

    if (selectedTime < startTime) {
      Toast.show({
        type: "error",
        text1: "Thời gian không hợp lệ",
        text2: "Thời gian kết thúc phải sau thời gian bắt đầu!",
      });
      return;
    }

    onSubmit(selectedTime);
  };

  return (
    <View className="pb-6 pt-4">
      {/* Header */}
      <View className="mb-5">
        <Text className="text-base font-bold text-white">
          Chọn thời gian kết thúc
        </Text>

        <Text className="mt-1 text-xs text-zinc-500">
          Kéo thanh trượt đến thời điểm Fast thực sự kết thúc
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
          hitSlop={5}
          style={{ height: 40 }}
          value={selectedTime}
          minimumValue={sliderMin}
          maximumValue={effectiveMax}
          step={5 * 60 * 1000}
          minimumTrackTintColor={theme.primary}
          maximumTrackTintColor="rgba(255,255,255,0.12)"
          thumbTintColor={theme.primary}
          //   onSlidingComplete={setSelectedTime}
          onValueChange={setSelectedTime}
        />

        <View className="mt-1 flex-row justify-between">
          <Text className="text-[11px] text-zinc-500">
            {new Date(sliderMin).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })}
          </Text>

          <Text className="text-[11px] text-zinc-500">
            {new Date(effectiveMax).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })}
          </Text>
        </View>
      </View>

      {/* Current / target info */}
      <View className="mt-5 rounded-xl bg-zinc-900/70 px-4 py-3">
        <View className="flex-row justify-between">
          <Text className="text-xs text-zinc-500">Bắt đầu</Text>

          <Text className="text-xs font-medium text-zinc-300">
            {new Date(startTime).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })}
          </Text>
        </View>

        {targetFinishTime && (
          <View className="mt-2 flex-row justify-between">
            <Text className="text-xs text-zinc-500">Mục tiêu</Text>

            <Text className="text-xs font-medium text-zinc-300">
              {new Date(targetFinishTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })}
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
