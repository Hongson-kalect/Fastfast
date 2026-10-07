import { ThemedText } from "@/components/themed-text";
import { useAppStore } from "@/stores/appStore";
import {
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import ReactNativeModal from "react-native-modal";
import { Divider, RadioButton } from "react-native-paper";

type ListModalProps = {
  value: string;
  options: { label: string; value: string | number }[];
  onSubmit: (value: string | number) => void;
  onCancel: () => void;
  type?: "checkbox" | "radio";
  title?: string;
  show?: boolean;
};

export const OptionsModal = (props: ListModalProps) => {
  const { height } = useWindowDimensions();
  const { theme } = useAppStore();
  const onSubmit = (val: number | string) => {
    props.onSubmit(val);
  };

 const SelectItem = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => {
  const selected = value === props.value;

  const submit = () => {
    onSubmit(value);
  };

  return (
    <TouchableOpacity
      onPress={submit}
      activeOpacity={0.7}
      className="flex-row items-center justify-between rounded-xl px-3.5 py-3"
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
      >
        {label}
      </ThemedText>

      <RadioButton
        onPress={submit}
        value={value.toString()}
        status={selected ? "checked" : "unchecked"}
        color={theme.primary}
      />
    </TouchableOpacity>
  );
};

return (
  <ReactNativeModal
    onBackButtonPress={props.onCancel}
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
    <View
      className="overflow-hidden rounded-3xl p-4"
      style={{
        maxHeight: (height / 4) * 3,
        backgroundColor: theme.background,
      }}
    >
      {/* Header */}
      {props.title && (
        <View className="mb-4 px-1">
          <ThemedText
            size="xl"
            weight="bold"
            color="title"
          >
            {props.title}
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

      {/* Options */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          gap: 4,
        }}
      >
        {props.options.map((option) => (
          <SelectItem
            key={option.value?.toString() ?? "null-value"}
            label={option.label}
            value={option.value}
          />
        ))}
      </ScrollView>
    </View>
  </ReactNativeModal>
);
};
