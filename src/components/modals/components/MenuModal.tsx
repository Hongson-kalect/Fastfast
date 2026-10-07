import { ThemedText } from "@/components/themed-text";
import { BasicModalOptions, MenuModalOptions } from "@/provider/Modal";
import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import { ScrollView, TouchableOpacity, View } from "react-native";

type Props = MenuModalOptions & BasicModalOptions;
const MenuModal = (modal: Props) => {
  const { closeCurrentModal } = useModalStore();

  const hasRightContent = modal.menuOptions.some(
    (item) => item.rightContent,
  );

  return (
    <View className="px-1 pb-1">
      {modal.title && (
        <ThemedText
          size="xl"
          weight="bold"
          color="title"
          className="mb-4"
        >
          {modal.title}
        </ThemedText>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 6 }}
      >
        {modal.menuOptions.map((menu, idx) => (
          <AppMenu
            key={idx}
            justifyContent={hasRightContent ? "space-between" : "center"}
            color={menu.color}
            backgroundColor={menu.backgroundColor}
            onPress={() => {
              menu.onPress?.();

              if (menu.isCloseAfterPress !== false) {
                closeCurrentModal();
              }
            }}
            icon={menu.icon}
            label={menu.label}
            rightContent={menu.rightContent}
          />
        ))}
      </ScrollView>

      {modal.cancelText && (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={closeCurrentModal}
          className="mt-3 h-11 items-center justify-center rounded-2xl"
        >
          <ThemedText
            size="sm"
            weight="semibold"
            color="text"
            opacity="medium"
          >
            {modal.cancelText}
          </ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );
};

type AppMenuType = {
  justifyContent?: "center" | "space-between";
  color?: string;
  backgroundColor?: string;
  onPress?: () => void;
  icon?: React.ReactNode;
  label?: string | React.ReactNode;
  rightContent?: React.ReactNode;
};

export const AppMenu = (props: AppMenuType) => {
  const { theme } = useAppStore();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={props.onPress}
      className="min-h-14 flex-row items-center rounded-2xl px-4 py-3"
      style={{
        justifyContent: props.justifyContent || "space-between",
        backgroundColor:
          props.backgroundColor || theme.background2,
      }}
    >
      <View className="min-w-0 flex-1 flex-row items-center gap-3">
        {props.icon && (
          <View className="items-center justify-center">
            {props.icon}
          </View>
        )}

        {typeof props.label === "string" ? (
          <ThemedText
            size="sm"
            weight="semibold"
            colorHex={props.color || theme.text}
            numberOfLines={1}
            className="flex-1"
          >
            {props.label}
          </ThemedText>
        ) : (
          props.label
        )}
      </View>

      {props.rightContent && (
        <View className="ml-3 shrink-0">
          {props.rightContent}
        </View>
      )}
    </TouchableOpacity>
  );
};

export default MenuModal;
