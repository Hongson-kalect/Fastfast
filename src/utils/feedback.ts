import { useAppStore } from "@/stores/appStore";
import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from "expo-audio";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

/**
 * Âm thanh và rung dùng chung cho cả app.
 *
 * Chỗ nào cần phản hồi chỉ việc gọi:
 *   feedback("fastStart")       // âm thanh + rung theo sự kiện
 *   playSound("tap")            // chỉ âm thanh
 *   haptic("success")           // chỉ rung
 *
 * Tất cả đều tôn trọng cài đặt sound_enabled / touch_sound_enabled / vibration_enabled.
 */

const SOUNDS = {
  tap: require("../../assets/sounds/tap.wav"),
  toggle: require("../../assets/sounds/toggle.wav"),
  start: require("../../assets/sounds/start.wav"),
  success: require("../../assets/sounds/success.wav"),
  reward: require("../../assets/sounds/reward.wav"),
  warning: require("../../assets/sounds/warning.wav"),
};

export type SoundName = keyof typeof SOUNDS;

export type HapticKind =
  | "light"
  | "medium"
  | "heavy"
  | "selection"
  | "success"
  | "warning"
  | "error";

// Âm thanh chạm nhỏ (tap, toggle) dùng cờ touch_sound_enabled riêng
const TOUCH_SOUNDS: SoundName[] = ["tap", "toggle"];

const players: Partial<Record<SoundName, AudioPlayer>> = {};
let audioModeReady = false;

const getSettings = () => useAppStore.getState().settings;

const getPlayer = (name: SoundName) => {
  if (!players[name]) {
    players[name] = createAudioPlayer(SOUNDS[name]);
  }
  return players[name]!;
};

export const playSound = async (name: SoundName, volume = 1) => {
  const settings = getSettings();
  if (settings?.sound_enabled === false) return;
  if (TOUCH_SOUNDS.includes(name) && settings?.touch_sound_enabled === false) {
    return;
  }

  try {
    if (!audioModeReady) {
      // Hiệu ứng ngắn: không chiếm audio focus, không cắt nhạc của app khác
      await setAudioModeAsync({
        playsInSilentMode: false,
        interruptionMode: "mixWithOthers",
      });
      audioModeReady = true;
    }

    const player = getPlayer(name);
    player.volume = volume;
    await player.seekTo(0);
    player.play();
  } catch (e) {
    console.warn("playSound error", name, e);
  }
};

// Android: performAndroidHapticsAsync cho cảm giác giống iOS và không cần quyền VIBRATE
const ANDROID_HAPTICS: Record<HapticKind, Haptics.AndroidHaptics> = {
  light: Haptics.AndroidHaptics.Keyboard_Tap,
  medium: Haptics.AndroidHaptics.Context_Click,
  heavy: Haptics.AndroidHaptics.Long_Press,
  selection: Haptics.AndroidHaptics.Segment_Tick,
  success: Haptics.AndroidHaptics.Confirm,
  warning: Haptics.AndroidHaptics.Reject,
  error: Haptics.AndroidHaptics.Reject,
};

export const haptic = async (kind: HapticKind = "light") => {
  if (getSettings()?.vibration_enabled === false) return;

  try {
    if (Platform.OS === "android") {
      await Haptics.performAndroidHapticsAsync(ANDROID_HAPTICS[kind]);
      return;
    }

    switch (kind) {
      case "selection":
        return await Haptics.selectionAsync();
      case "success":
        return await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      case "warning":
        return await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Warning,
        );
      case "error":
        return await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Error,
        );
      case "heavy":
        return await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      case "medium":
        return await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      default:
        return await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  } catch (e) {
    console.warn("haptic error", kind, e);
  }
};

// Sự kiện → cặp âm thanh + rung. Thêm sự kiện mới ở đây thay vì gọi lẻ tẻ.
const EVENTS = {
  tap: { sound: "tap", haptic: "light" },
  toggle: { sound: "toggle", haptic: "selection" },
  fastStart: { sound: "start", haptic: "medium" },
  fastComplete: { sound: "success", haptic: "success" },
  fastFailed: { sound: "warning", haptic: "warning" },
  reward: { sound: "reward", haptic: "success" },
  streakLost: { sound: "warning", haptic: "error" },
  error: { sound: "warning", haptic: "error" },
} satisfies Record<string, { sound?: SoundName; haptic?: HapticKind }>;

export type FeedbackEvent = keyof typeof EVENTS;

export const feedback = (event: FeedbackEvent) => {
  const { sound, haptic: kind } = EVENTS[event];
  playSound(sound);
  haptic(kind);
};
