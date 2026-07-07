import { ThemedText } from "@/components/themed-text";
import { BasicModalOptions, CustomModalOptions } from "@/provider/Modal";
import { View } from "react-native";

type Props = CustomModalOptions & BasicModalOptions;

const CustomModal = (modal: Props) => {
  return (
    <View>
      {modal.title && <ThemedText type="subtitle">{modal.title}</ThemedText>}
      {modal.message && (
        <ThemedText>
          {modal.message}
        </ThemedText>
      )}
      {modal.subMessage && (
        <ThemedText type='small' className="mt-1.5 opacity-70">
          {modal.subMessage}
        </ThemedText>
      )}

      <View>{modal?.middle}</View>
      {modal.render}
    </View>
  );
};

export default CustomModal;
