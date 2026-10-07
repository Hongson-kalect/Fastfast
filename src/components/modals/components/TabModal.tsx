import { ThemedText } from "@/components/themed-text";
import { BasicModalOptions, TabsModalOptions } from "@/provider/Modal";
import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import { useState } from "react";
import { FlatList, TouchableOpacity, View } from "react-native";

type Props = TabsModalOptions & BasicModalOptions;
const TabsModal = (modal: Props) => {
  const [width, setWidth] = useState(0);
  const [tabIndex, setTabIndex] = useState(0);
  const { closeCurrentModal } = useModalStore();
  const { theme } = useAppStore();

  const showCancel = modal.isShowCancelButton !== false;

  const handleCancel = () => {
    modal.onCancel?.();
    closeCurrentModal();
  };

  const handleOk = () => {
    modal.onOk?.();
    closeCurrentModal();
  };

  return (
    <View
      className="px-1 pb-1"
      onLayout={(event) => {
        setWidth(event.nativeEvent.layout.width);
      }}
    >
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

      {modal.message && (
        <ThemedText
          size="sm"
          color="text"
          opacity={modal.subMessage ? "full" : "medium"}
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
          className="mt-2"
        >
          {modal.subMessage}
        </ThemedText>
      )}

      {modal.middle && (
        <View className="mt-4">
          {modal.middle}
        </View>
      )}

      {/* Step indicator */}
      <View className="mb-3 mt-5 flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5">
          {modal.tabs.map((_, index) => (
            <View
              key={index}
              className="h-1.5 rounded-full"
              style={{
                width: index === tabIndex ? 20 : 6,
                backgroundColor:
                  index === tabIndex
                    ? theme.primary
                    : theme.text + "18",
              }}
            />
          ))}
        </View>

        <ThemedText
          size="xxs"
          weight="semibold"
          color="text"
          opacity="low"
        >
          {tabIndex + 1} / {modal.tabs.length}
        </ThemedText>
      </View>

      {/* Tabs */}
      {width > 0 && (
        <FlatList
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          data={modal.tabs}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={{ width }}>
              {item}
            </View>
          )}
          onMomentumScrollEnd={(event) => {
            const newIndex = Math.round(
              event.nativeEvent.contentOffset.x / width,
            );

            setTabIndex(newIndex);
          }}
        />
      )}

      {/* Actions */}
      <View className="mt-6 flex-row gap-2.5">
        {showCancel && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleCancel}
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
          onPress={handleOk}
          className="h-12 flex-1 items-center justify-center rounded-2xl"
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
        </TouchableOpacity>
      </View>
    </View>
  );
};
export default TabsModal;
