import { ThemedText } from "@/components/themed-text";
import { useDebounce } from "@/hooks/useDebouce";
import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import { Feather } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
    ScrollView,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";
import ReactNativeModal from "react-native-modal";
import { Divider, RadioButton } from "react-native-paper";
import Animated from "react-native-reanimated";

type ListModalProps = {
  value: string;
  options: { label: string; value: string | number }[];
  onSubmit: (value: string | number) => void;
  onCancel: () => void;
  type?: "checkbox" | "radio";
  title?: string;
  show?: boolean;
  inAnimation?:
    | "fadeIn"
    | "slideInDown"
    | "slideInUp"
    | "zoomIn"
    | "zoomInDown";
  outAnimation?:
    | "fadeOut"
    | "slideOutDown"
    | "slideOutUp"
    | "zoomOut"
    | "zoomOutDown";
};

export const OptionsModal = (props: ListModalProps) => {
  const [placeholder, setPlaceholder] = useState(props);
  const { listModal } = useModalStore();
  const { theme } = useAppStore();
  const { height } = useWindowDimensions();

  const outAnimation = useDebounce(
    listModal?.outAnimation,
    200,
  );

  useEffect(() => {
    if (props.show) {
      setPlaceholder(props);
    }
  }, [props]);

  const showValue = useMemo(
    () => (props.show ? props : placeholder),
    [placeholder, props],
  );

  const onSubmit = (value: string | number) => {
    props.onSubmit(value);
  };

  const SelectItem = ({
    label,
    value,
  }: {
    label: string;
    value: string | number;
  }) => {
    const selected = value === showValue.value;

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onSubmit(value)}
        className="min-h-14 flex-row items-center rounded-2xl px-4 py-3"
        style={{
          backgroundColor: selected
            ? theme.primary + "12"
            : "transparent",
        }}
      >
        <ThemedText
          size="sm"
          weight={selected ? "semibold" : "medium"}
          color={selected ? "primary" : "text"}
          opacity={selected ? "full" : "medium"}
          numberOfLines={2}
          className="flex-1"
        >
          {label}
        </ThemedText>

        {selected && (
          <View
            className="ml-3 h-6 w-6 items-center justify-center rounded-full"
            style={{
              backgroundColor: theme.primary + "20",
            }}
          >
            <Feather
              name="check"
              size={13}
              color={theme.primary}
            />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ReactNativeModal
      onBackButtonPress={props.onCancel}
      animationIn={props.inAnimation || "slideInUp"}
      animationOut={outAnimation || "fadeOut"}
      isVisible={props.show}
      backdropTransitionOutTiming={1}
      backdropColor={theme.text}
      backdropOpacity={0.4}
      onBackdropPress={props.onCancel}
      style={{
        zIndex: 1000,
        margin: 20,
      }}
      avoidKeyboard
    >
      <Animated.View
        className="overflow-hidden rounded-3xl p-4"
        style={{
          maxHeight: (height / 4) * 3,
          backgroundColor: theme.background,
        }}
      >
        {showValue.title && (
          <View className="mb-4 px-1">
            <ThemedText
              size="xl"
              weight="bold"
              color="title"
            >
              {showValue.title}
            </ThemedText>

            <ThemedText
              size="xs"
              color="text"
              opacity="low"
              className="mt-1"
            >
              Chọn một tùy chọn
            </ThemedText>
          </View>
        )}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: 6 }}
        >
          {showValue.options.map((option) => (
            <SelectItem
              key={String(option.value)}
              label={option.label}
              value={option.value}
            />
          ))}
        </ScrollView>
      </Animated.View>
    </ReactNativeModal>
  );
};