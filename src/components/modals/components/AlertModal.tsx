import { ThemedText } from "@/components/themed-text";
import { AlertModalOptions, BasicModalOptions } from "@/provider/Modal";
import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import { Pressable, View } from "react-native";

type Props = AlertModalOptions & BasicModalOptions;

const AlertModal = (modal: Props) => {
  const { closeCurrentModal } = useModalStore();
  const { theme } = useAppStore();

  const handleOk = () => {
    modal.onOk?.();
    closeCurrentModal();
  };

  return (
    <View className="px-1 pb-1">
      {/* Header */}
      {modal.title && (
        <ThemedText
          size="xl"
          weight="bold"
          color="title"
          className="mb-2"
        >
          {modal.title}
        </ThemedText>
      )}

      {/* Message */}
      <ThemedText
        size="sm"
        color="text"
        opacity={modal.subMessage ? "full" : "medium"}
        style={{
          lineHeight: 21,
        }}
      >
        {modal.message}
      </ThemedText>

      {/* Secondary message */}
      {modal.subMessage && (
        <ThemedText
          size="xs"
          color="text"
          opacity="low"
          className="mt-2"
        >
          {modal.subMessage}
        </ThemedText>
      )}

      {/* Custom content */}
      {modal.middle && (
        <View className="mt-4">
          {modal.middle}
        </View>
      )}

      {/* Action */}
      <Pressable
        onPress={handleOk}
        className="mt-6 h-12 items-center justify-center rounded-2xl"
        style={{
          backgroundColor: theme.primary,
        }}
      >
        <ThemedText
          size="sm"
          weight="semibold"
          colorHex={theme.background}
        >
          {modal.okText || "OK"}
        </ThemedText>
      </Pressable>
    </View>
  );
};

export default AlertModal;