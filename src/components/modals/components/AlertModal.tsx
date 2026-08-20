import { ThemedText } from "@/components/themed-text";
import { AlertModalOptions, BasicModalOptions } from "@/provider/Modal";
import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import { TouchableOpacity, View } from "react-native";

type Props = AlertModalOptions & BasicModalOptions;

const AlertModal = (modal: Props) => {
  const { addModal } = useModalStore();
  const { theme } = useAppStore();
  return (
    <View>
      {modal.title && <ThemedText type="subtitle">{modal.title}</ThemedText>}
      <ThemedText>{modal.message}</ThemedText>
      {modal.subMessage && (
        <ThemedText className="text-sm mt-1.5 opacity-70">
          {modal.subMessage}
        </ThemedText>
      )}
      {modal?.middle}

      <TouchableOpacity
        style={{ backgroundColor: theme.primary }}
        className="rounded-lg py-3 mt-5 mx-2"
        onPress={() => {
          modal.onOk?.();
          addModal(null);
        }}
      >
        <ThemedText
          style={{ fontFamily: "PlaypenSans-Semibold" }}
          className="text-center"
          color="white"
        >
          {modal.okText || "OK"}
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
};

export default AlertModal;
