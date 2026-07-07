import { ThemedText } from "@/components/themed-text";
import { useDebounce } from "@/hooks/useDebouce";
import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
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
  // Modal sẽ ẩn khi props = null => Dữ liệu bị mất ngay lập tức
  // Animation out sẽ thực hiện với màn trắng => dùng cái này để cache dữ liệu trước đó
  const [placeholder, setPlaceholder] = useState(props);
  const { listModal } = useModalStore();
  const outAnimation = useDebounce(listModal?.outAnimation, 200); // when close all modal will be null, include outAnimation, so keep this to close it correctly

  useEffect(() => {
    props.show && setPlaceholder(props);
  }, [props]);

  const showValue = useMemo(
    () => (props.show ? props : placeholder),
    [placeholder, props],
  );

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
    const submit = () => onSubmit(value);
    return (
      <TouchableOpacity
        onPress={submit}
        className="flex-row items-center justify-between py-2"
      >
        <ThemedText style={{ fontFamily: "PlaypenSans-Medium" }}>
          {label}
        </ThemedText>
        <RadioButton
          onPress={submit}
          value={value?.toString()}
          status={value === showValue.value ? "checked" : "unchecked"}
        />
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
      style={{ zIndex: 1000 }}
      avoidKeyboard
    >
      <Animated.View
        className="py-4 rounded-xl"
        style={{
          maxHeight: (height / 4) * 3,
          backgroundColor: theme.background,
        }}
      >
        {showValue.title && (
          <ThemedText
            className="mb-4 px-4"
            type='subtitle'
          >
            {showValue.title}
          </ThemedText>
        )}

        <ScrollView className="px-4">
          {showValue.options.map((option, index) => (
            <View key={option.value || "null value"}>
              <SelectItem
                key={option.value}
                label={option.label}
                value={option.value}
              />
              {index !== showValue.options.length - 1 && <Divider />}
            </View>
          ))}
        </ScrollView>
      </Animated.View>
      {/* </TouchableWithoutFeedback> */}
    </ReactNativeModal>
  );
};
