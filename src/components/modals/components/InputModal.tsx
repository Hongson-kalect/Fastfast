import { ThemedText } from "@/components/themed-text";
import { BasicModalOptions, InputModalOptions } from "@/provider/Modal";
import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import { useEffect, useRef, useState } from "react";
import { Pressable, TextInput, TouchableOpacity, View } from "react-native";

type Props = InputModalOptions & BasicModalOptions;
const InputModal = (modal: Props) => {
  const { closeCurrentModal, currentModal } = useModalStore();
  const { theme } = useAppStore();

  const [value, setValue] = useState("");
  const textRef = useRef<TextInput>(null);

  const textFocus = () => {
    textRef.current?.focus();
  };

  const submit = () => {
    modal.onOk?.(value);
    closeCurrentModal();
  };

  useEffect(() => {
    if (!currentModal) return;

    const timer = setTimeout(textFocus, 300);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setValue(modal.defaultValue || "");
  }, [modal.defaultValue]);

  const showCancel = modal.isShowCancelButton !== false;

  return (
    <View className="px-1 pb-1">
      {/* Header */}
      {modal.title && (
        <ThemedText size="xl" weight="bold" color="title" className="mb-2">
          {modal.title}
        </ThemedText>
      )}

      {modal.message && (
        <ThemedText
          size="sm"
          color="text"
          opacity={modal.subMessage ? "full" : "medium"}
          style={{ lineHeight: 21 }}
        >
          {modal.message}
        </ThemedText>
      )}

      {modal.subMessage && (
        <ThemedText size="xs" color="text" opacity="low" className="mt-2">
          {modal.subMessage}
        </ThemedText>
      )}

      {modal.middle && <View className="mt-4">{modal.middle}</View>}

      {/* External input header */}
      {modal.textOuterHeader && (
        <View className="mt-5">{modal.textOuterHeader}</View>
      )}

      {/* Input */}
      <Pressable
        onPress={textFocus}
        className="mt-3 overflow-hidden rounded-2xl"
        style={{
          backgroundColor: theme.background2,
          borderWidth: 1,
          borderColor: theme.text + "10",
        }}
      >
        {modal.textInnerHeader && (
          <View className="px-4 pt-3">{modal.textInnerHeader}</View>
        )}

        <TextInput
          ref={textRef}
          value={value}
          onChangeText={setValue}
          onSubmitEditing={submit}
          keyboardType={modal.keyboardType || "default"}
          placeholder={modal.placeholder}
          placeholderTextColor={theme.text + "45"}
          style={{
            textAlign: modal.textAlign || "center",
            color: theme.text,
            fontSize: 20,
            height: 60,
            paddingHorizontal: 16,
          }}
        />

        {modal.textInnerFooter && (
          <View className="px-4 pb-3">{modal.textInnerFooter}</View>
        )}
      </Pressable>

      {modal.textOuterFooter && (
        <View className="mt-2">{modal.textOuterFooter}</View>
      )}

      {/* Actions */}
      <View className="mt-6 flex-row gap-2.5">
        {showCancel && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              modal.onCancel?.();
              closeCurrentModal();
            }}
            className="h-12 flex-1 items-center justify-center rounded-2xl bg-text-base/10"
          >
            <ThemedText
              size="sm"
              weight="semibold"
              color="text"
              opacity="medium"
            >
              {modal.cancelText || "Close"}
            </ThemedText>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={submit}
          className="h-12 flex-1 items-center justify-center rounded-2xl"
          style={{
            backgroundColor: theme.primary,
          }}
        >
          <ThemedText size="sm" weight="semibold" colorHex="white">
            {modal.okText || "OK"}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default InputModal;
