import { ThemedText } from "@/components/themed-text";
import { BasicModalOptions, PromptModalOptions } from "@/provider/Modal";
import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import { useEffect, useRef, useState } from "react";
import { Pressable, TextInput, TouchableOpacity, View } from "react-native";

type Props = PromptModalOptions & BasicModalOptions;

const PromptModal = (modal: Props) => {
  const { addModal, currentModal } = useModalStore();
  const [value, setValue] = useState("");
  const textRef = useRef<TextInput>(null);
  const textFocus = () => textRef.current?.focus();
  const { theme } = useAppStore();

  useEffect(() => {
    currentModal && setTimeout(() => textFocus(), 300);
  }, []);

  useEffect(() => {
    setValue(modal.defaultValue || "");
  }, [modal.defaultValue]);
  return (
    <View>
      {modal.title && <ThemedText type="subtitle">{modal.title}</ThemedText>}
      {modal.message && (
        <ThemedText className="mt-2" numberOfLines={2}>
          {modal.message}
        </ThemedText>
      )}
      {modal.subMessage && (
        <ThemedText className="mt-1.5 opacity-70" numberOfLines={3}>
          {modal.subMessage}
        </ThemedText>
      )}
      {modal?.middle}
      {modal.textOuterHeader}

      <Pressable
        onPress={textFocus}
        className="bg-gray-100 rounded-lg px-1 mt-3"
      >
        {modal.textInnerHeader}
        <TextInput
          style={{ textAlignVertical: "top", height: 90 }}
          className="text-gray-700 "
          ref={textRef}
          multiline
          numberOfLines={4}
          value={value}
          onChangeText={setValue}
          placeholder={modal.placeholder}
          placeholderTextColor={"#00000040"}
        ></TextInput>
        {modal.textInnerFooter}
      </Pressable>
      {modal.textOuterFooter}

      <View
        style={{
          justifyContent:
            modal.isShowCancelButton !== false ? "space-between" : "center",
        }}
        className="flex-row items-center mt-4"
      >
        {modal.isShowCancelButton !== false && (
          <TouchableOpacity
            className="bg-gray-300 rounded-lg py-3 px-4"
            onPress={() => {
              modal.onCancel?.();
              addModal(null);
            }}
          >
            <ThemedText color="white">{modal.cancelText || "Close"}</ThemedText>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          className={`rounded-lg py-3 items-center justify-center ${
            modal.isShowCancelButton === false ? "w-full" : ""
          } min-w-28`}
          style={{
            backgroundColor: theme.primary,
          }}
          onPress={() => {
            modal.onOk?.(value);
            addModal(null);
          }}
        >
          <ThemedText color="white">{modal.okText || "OK"}</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PromptModal;
