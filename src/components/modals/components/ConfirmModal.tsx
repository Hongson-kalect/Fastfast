import { ThemedText } from "@/components/themed-text";
import { BasicModalOptions, ConfirmModalOptions } from "@/provider/Modal";
import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import { TouchableOpacity, View } from "react-native";

type Props = ConfirmModalOptions & BasicModalOptions;

const ConfirmModal = (modal: Props) => {
  const { closeCurrentModal } = useModalStore();
  const { theme } = useAppStore();

  const cancelText = modal.cancelText || "Cancel";
  const okText = modal.okText || "OK";

  const handleCancel = () => {
    modal.onCancel?.();
    closeCurrentModal();
  };

  const handleConfirm = async () => {
    await modal.onOk?.();
    closeCurrentModal();
  };

  return (
    <View className="px-1 pb-1">
      {/* Header */}
      {modal.title && (
        <ThemedText size="xl" weight="bold" color="title" className="mb-2">
          {modal.title}
        </ThemedText>
      )}

      {/* Message */}
      <ThemedText
        size="sm"
        color="text"
        opacity="medium"
        style={{
          lineHeight: 21,
        }}
      >
        {modal.message}
      </ThemedText>

      {/* Custom content */}
      {modal.middle && <View className="mt-4">{modal.middle}</View>}

      {/* Actions */}
      <View className="mt-6 flex-row gap-2.5">
        {/* Cancel */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleCancel}
          className="h-12 flex-1 items-center justify-center rounded-2xl bg-text-base/10"
        >
          {typeof cancelText === "string" ? (
            <ThemedText
              size="sm"
              weight="semibold"
              color="text"
              opacity="medium"
            >
              {cancelText}
            </ThemedText>
          ) : (
            cancelText
          )}
        </TouchableOpacity>

        {/* Confirm */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleConfirm}
          className="h-12 flex-1 items-center justify-center rounded-2xl"
          style={{
            backgroundColor: theme.primary,
          }}
        >
          {typeof okText === "string" ? (
            <ThemedText size="sm" weight="semibold" colorHex="white">
              {okText}
            </ThemedText>
          ) : (
            okText
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ConfirmModal;
