import { themes } from "@/constants/themes";
import { useAppStore } from "@/stores/appStore";
import { useIsFocused } from "expo-router";
import { useReducedMotion } from "react-native-reanimated";
import { useShallow } from "zustand/react/shallow";
import { EFFECTS } from "./registry";
import { ButtonEffectProps, EffectContext } from "./types";

/**
 * Bộ effect theo theme + cường độ, chưa xét focus màn hình; dùng được cả ở gốc app
 * (ngoài navigator). null khi tắt / theme không có effect.
 */
export const useEffectSelection = () => {
  const { themeId, intensity, isDarkMode } = useAppStore(
    useShallow((state) => ({
      themeId: state.settings?.theme || "default",
      intensity: state.settings?.effect_intensity ?? "light",
      isDarkMode: state.settings?.is_dark_mode ?? true,
    })),
  );
  const reduceMotion = useReducedMotion();

  const effectId = themes[themeId]?.effect;
  if (!effectId || intensity === "off") return null;

  const context: EffectContext = { intensity, isDarkMode, animate: !reduceMotion };
  return { definition: EFFECTS[effectId], context };
};

/** Bộ effect cho phần nằm trong màn hình: thêm dừng animation khi tab không focus */
export const useThemeEffect = () => {
  const selection = useEffectSelection();
  const isFocused = useIsFocused();
  if (!selection) return null;

  return {
    definition: selection.definition,
    context: { ...selection.context, animate: selection.context.animate && isFocused },
  };
};

// Mỗi phần giao diện đặt slot của mình; slot tự lấy mảnh tương ứng của effect hiện tại

/** Đặt làm con đầu tiên của màn hình để nằm dưới nội dung */
export const ScreenEffect = () => {
  const effect = useThemeEffect();
  const Slot = effect?.definition.screen;
  return Slot ? <Slot {...effect.context} /> : null;
};

/** Đặt làm con đầu tiên của thẻ (thẻ cần overflow hidden) để nằm dưới nội dung */
export const CardEffect = () => {
  const effect = useThemeEffect();
  const Slot = effect?.definition.card;
  return Slot ? <Slot {...effect.context} /> : null;
};

/** Dùng làm `tabBarBackground` của thanh tab */
export const TabBarEffect = () => {
  const effect = useThemeEffect();
  const Slot = effect?.definition.tabBar;
  return Slot ? <Slot {...effect.context} /> : null;
};

/** Đặt làm con cuối cùng bên trong nút (nút làm khung định vị cho trang trí) */
export const ButtonEffect = (props: Omit<ButtonEffectProps, keyof EffectContext>) => {
  const effect = useThemeEffect();
  const Slot = effect?.definition.button;
  return Slot ? <Slot {...effect.context} {...props} /> : null;
};
