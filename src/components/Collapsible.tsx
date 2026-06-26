import { useAppSettingsStore } from "@/store/useAppSettingStore";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

export function Collapsible({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const { theme } = useAppSettingsStore();

  const progress = useSharedValue(0);

  const toggle = () => {
    const next = !isOpen;

    setIsOpen(next);

    progress.value = withTiming(next ? 1 : 0, {
      duration: 250,
    });
  };

  const contentStyle = useAnimatedStyle(() => ({
    height: contentHeight * progress.value,
    opacity: progress.value,
    overflow: "hidden",
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${progress.value * 180}deg`,
      },
    ],
  }));

  return (
    <View>
      <Pressable onPress={toggle}>
        <Animated.View style={iconStyle}>
          {/* Icon */}
          <SymbolView
            name={{
              ios: "chevron.right",
              android: "chevron_right",
              web: "chevron_right",
            }}
            size={14}
            weight="bold"
            tintColor={theme.colors.text}
            style={{ transform: [{ rotate: isOpen ? "-90deg" : "90deg" }] }}
          />
        </Animated.View>
      </Pressable>

      <Animated.View style={contentStyle}>
        <View
          style={{
            position: "absolute",
            width: "100%",
          }}
          onLayout={(e) => setContentHeight(e.nativeEvent.layout.height)}
        >
          {children}
        </View>
      </Animated.View>
    </View>
  );
}
