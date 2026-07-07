import { ThemedText } from "@/components/themed-text";
import { BasicModalOptions, MenuModalOptions } from "@/provider/Modal";
import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import { ScrollView, TouchableOpacity, View } from "react-native";

type Props = MenuModalOptions & BasicModalOptions;

const MenuModal = (modal: Props) => {
  const { globalModal, setGlobalModal } = useModalStore();
  const menuType = modal.menuOptions.some((item) => item.rightContent)
    ? "space-between"
    : "center";

  return (
    <View>
      {modal.title && (
        <ThemedText className="mb-4" type="subtitle">
          {modal.title}
        </ThemedText>
      )}
      <ScrollView>
        {modal.menuOptions.map((menu, idx) => (
          <AppMenu
            key={idx}
            justifyContent={menuType}
            color={menu.color}
            backgroundColor={menu.backgroundColor}
            borderColor={
              idx === modal.menuOptions.length - 1
                ? "transparent"
                : "rgba(0, 0, 0, 0.1)"
            }
            onPress={() => {
              menu.onPress?.();
              if (menu.isCloseAfterPress !== false) setGlobalModal(null);
            }}
            icon={menu.icon}
            label={menu.label}
            rightContent={menu.rightContent}
          />
        ))}
      </ScrollView>
      {modal.cancelText && (
        <TouchableOpacity
          className="mt-4 py-2"
          onPress={() => {
            setGlobalModal(null);
          }}
        >
          <ThemedText className="text-center text-gray-500 text-base">
            {modal.cancelText || "Cancel"}
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
  borderColor?: string;
  onPress?: () => void;
  icon?: React.ReactNode;
  label?: string | React.ReactNode;
  rightContent?: React.ReactNode;
};
export const AppMenu = (props: AppMenuType) => {
  const { theme } = useAppStore();
  return (
    <TouchableOpacity
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: props.justifyContent || "space-between",
        borderBottomWidth: 0.5,
        backgroundColor: props.backgroundColor || "transparent",
        borderColor: props.borderColor,
      }}
      className="py-4 px-2 rounded-lg gap-4"
      onPress={() => {
        props.onPress?.();
      }}
    >
      <View className="flex-row items-center justify-center gap-4">
        {props.icon}
        {typeof props.label === "string" ? (
          <ThemedText
            style={{ color: props.color || theme.text }}
            className="text-center text-lg"
          >
            {props.label}
          </ThemedText>
        ) : (
          props.label
        )}
      </View>
      {props.rightContent}
    </TouchableOpacity>
  );
};

export default MenuModal;
