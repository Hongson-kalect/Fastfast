import { ThemedText } from "@/components/themed-text";
import { BasicModalOptions, CustomModalOptions } from "@/provider/Modal";
import { View } from "react-native";

type Props = CustomModalOptions & BasicModalOptions;

const CustomModal = (modal: Props) => {
  return (
    <View>
     {modal.title && <ThemedText size='xl' weight="semibold">{modal.title}</ThemedText>}
      {modal.message && <ThemedText
        size="sm"
        color="text"
        opacity="medium"
        style={{
          lineHeight: 21,
        }}
      >
        {modal.message}
      </ThemedText>}
      {modal.subMessage && (
        <ThemedText size='xs' className="mt-1.5 opacity-70">
          {modal.subMessage}
        </ThemedText>
      )}

      <View>{modal?.middle}</View>
      {modal.render}
    </View>
  );
};

export default CustomModal;
