import { ThemedText } from "@/components/themed-text";
import { BasicModalOptions, InputModalOptions } from "@/provider/Modal";
import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import { useEffect, useRef, useState } from "react";
import { Pressable, TextInput, TouchableOpacity, View } from "react-native";

type Props = InputModalOptions & BasicModalOptions;

const InputModal = (modal: Props) => {
  const { setGlobalModal, globalModal } = useModalStore();
  const [value, setValue] = useState("");
  const textRef = useRef<TextInput>(null);
  const textFocus = () => textRef.current?.focus();
  const { theme } = useAppStore();

  const submit = () => {
    modal.onOk?.(value);
    setGlobalModal(null);
  };

  useEffect(() => {
    globalModal && setTimeout(() => textFocus(), 300);
  }, []);

  useEffect(() => {
    setValue(modal.defaultValue || "");
  }, [modal.defaultValue]);
  return (
    <View>
      {modal.title && <ThemedText type="subtitle">{modal.title}</ThemedText>}
      {modal.message && (
        <ThemedText className="mt-2">{modal.message}</ThemedText>
      )}
      {modal.subMessage && (
        <ThemedText type={"small"} className="mt-1.5 opacity-70">
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
          style={{ textAlign: modal.textAlign || "center" }}
          //   style={{ textAlignVertical: "top", height: 90 }}
          className={`text-gray-700 text-xl h-14 px-2`}
          keyboardType={modal.keyboardType || "default"}
          ref={textRef}
          onSubmitEditing={submit}
          value={value}
          onChangeText={setValue}
          placeholder={modal.placeholder}
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
              setGlobalModal(null);
            }}
          >
            <ThemedText color="white">{modal.cancelText || "Close"}</ThemedText>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          className={`rounded-lg py-3 items-center justify-center ${
            modal.isShowCancelButton === false
              ? "min-w-36 rounded-full py-4"
              : ""
          } min-w-28`}
          style={{
            backgroundColor: theme.primary,
          }}
          onPress={submit}
        >
          <ThemedText color="white">{modal.okText || "OK"}</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default InputModal;
