import { ThemedText } from "@/components/themed-text";
import { BasicModalOptions, PromptModalOptions } from "@/provider/Modal";
import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import { useEffect, useRef, useState } from "react";
import { Pressable, TextInput, TouchableOpacity, View } from "react-native";

type Props = PromptModalOptions & BasicModalOptions;

const PromptModal = (modal: Props) => {
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
          numberOfLines={3}
          style={{ lineHeight: 21 }}
        >
          {modal.message}
        </ThemedText>
      )}

      {modal.subMessage && (
        <ThemedText
          size="xs"
          color="text"
          opacity="low"
          numberOfLines={3}
          className="mt-2"
        >
          {modal.subMessage}
        </ThemedText>
      )}

      {modal.middle && <View className="mt-4">{modal.middle}</View>}

      {modal.textOuterHeader && (
        <View className="mt-5">{modal.textOuterHeader}</View>
      )}

      {/* Text area */}
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
          multiline
          numberOfLines={4}
          value={value}
          onChangeText={setValue}
          placeholder={modal.placeholder}
          placeholderTextColor={theme.text + "45"}
          textAlignVertical="top"
          style={{
            color: theme.text,
            fontSize: 16,
            lineHeight: 23,
            minHeight: 110,
            paddingHorizontal: 16,
            paddingTop: 14,
            paddingBottom: 14,
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

export default PromptModal;
