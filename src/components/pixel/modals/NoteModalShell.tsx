
import type { ReactNode } from "react";
import {
  Modal,
  Pressable,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  LinearTransition,
} from "react-native-reanimated";
import { FontAwesome6 } from "@expo/vector-icons";

import { useAppStore } from "@/stores/appStore";
import { ThemedText } from "@/components/themed-text";
import { useShallow } from "zustand/react/shallow";

type Props = {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  title: string;
  icon: React.ComponentProps<typeof FontAwesome6>["name"];
  children: ReactNode;
};

export const NoteModalShell = ({
  visible,
  setVisible,
  title,
  icon,
  children,
}: Props) => {
  const { theme, settings } = useAppStore(
    useShallow((state) => ({ theme: state.theme, settings: state.settings })),
  );
  const isDark = settings?.is_dark_mode ?? true;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => setVisible(false)}
    >
      <Pressable
        className="flex-1 justify-end"
        onPress={() => setVisible(false)}
        style={{
          backgroundColor: theme.text + (isDark ? "70" : "75"),
        }}
      >
        <Animated.View
          layout={LinearTransition.springify()
            .duration(180)
            .damping(80)}
        >
          <Pressable
            className="mx-3 mb-3 rounded-[32px] bg-background2 px-5 pb-5 pt-6"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="mb-6 flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View className="h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                  <FontAwesome6
                    name={icon}
                    size={17}
                    color={theme.primary}
                  />
                </View>

                <ThemedText
                  size="xl"
                  weight="bold"
                  color="title"
                >
                  {title}
                </ThemedText>
              </View>

              <TouchableOpacity
                hitSlop={10}
                activeOpacity={0.7}
                onPress={() => setVisible(false)}
                className="h-9 w-9 items-center justify-center rounded-full bg-text-base/5"
              >
                <ThemedText
                  size="md"
                  weight="bold"
                  color="text"
                  opacity="medium"
                >
                  ×
                </ThemedText>
              </TouchableOpacity>
            </View>

            {children}
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};
