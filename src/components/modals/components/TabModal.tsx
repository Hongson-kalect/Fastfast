import { ThemedText } from "@/components/themed-text";
import { BasicModalOptions, TabsModalOptions } from "@/provider/Modal";
import useModalStore from "@/stores/modalStore";
import { useState } from "react";
import { FlatList, TouchableOpacity, View } from "react-native";

type Props = TabsModalOptions & BasicModalOptions;

const TabsModal = (modal: Props) => {
  const [width, setWidth] = useState(0);
  const { addModal } = useModalStore();
  const [tabIndex, setTabIndex] = useState(0);
  return (
    <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {modal.title && <ThemedText type="subtitle">{modal.title}</ThemedText>}
      <ThemedText className="text-gray-700">{modal.message}</ThemedText>
      {modal.subMessage && (
        <ThemedText className="text-sm mt-1.5 text-gray-500">
          {modal.subMessage}
        </ThemedText>
      )}
      {modal?.middle}

      <View>
        <ThemedText className="text-xs text-gray-600 text-right">
          {tabIndex + 1}/{modal.tabs.length}
        </ThemedText>
      </View>

      <FlatList
        onMomentumScrollEnd={(event) => {
          const newIndex = Math.round(
            event.nativeEvent.contentOffset.x / width,
          );
          setTabIndex(newIndex);
        }}
        horizontal
        pagingEnabled
        data={modal.tabs}
        renderItem={({ item }) => <View style={{ width }}>{item}</View>}
        keyExtractor={(_, index) => index.toString()}
      />

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
            <ThemedText className="text-gray-600">
              {modal.cancelText || "Close"}
            </ThemedText>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          className={`bg-blue-600 rounded-lg py-3 items-center justify-center ${
            modal.isShowCancelButton === false ? "w-full" : ""
          } min-w-28`}
          onPress={() => {
            modal.onOk?.();
            addModal(null);
          }}
        >
          <ThemedText className="text-white">{modal.okText || "OK"}</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default TabsModal;
