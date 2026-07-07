import {ThemedText} from "@/components/themed-text"
import { BasicModalOptions, ConfirmModalOptions } from "@/provider/Modal";
import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import { TouchableOpacity, View } from "react-native";

type Props = ConfirmModalOptions & BasicModalOptions;

const ConfirmModal = (modal: Props) => {
  const { setGlobalModal } = useModalStore();
  const { theme } = useAppStore();
  return (
    <View>
      {modal.title && (
        <ThemedText type='subtitle'>
          {modal.title}
        </ThemedText>
      )}
      <ThemedText className="mb-4">{modal.message}</ThemedText>

      {modal?.middle}

      <View className="flex-row justify-between mt-4">
        <TouchableOpacity
          className="bg-gray-300 rounded-lg py-3 px-4"
          onPress={() => {
            modal.onCancel?.();
            setGlobalModal(null);
          }}
        >
          <ThemedText color="white">{modal.cancelText || "Cancel"}</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ backgroundColor: theme.primary }}
          className=" rounded-lg py-3 items-center justify-center min-w-28"
          onPress={() => {
            modal.onOk?.();
            setGlobalModal(null);
          }}
        >
          <ThemedText color="white">{modal.okText || "OK"}</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ConfirmModal;
