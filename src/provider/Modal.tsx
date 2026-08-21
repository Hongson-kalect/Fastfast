import AlertModal from "@/components/modals/components/AlertModal";
import ConfirmModal from "@/components/modals/components/ConfirmModal";
import CustomModal from "@/components/modals/components/CustomModal";
import InputModal from "@/components/modals/components/InputModal";
import MenuModal from "@/components/modals/components/MenuModal";
import PromptModal from "@/components/modals/components/PromptModal";
import TabsModal from "@/components/modals/components/TabModal";
import ModalWrapper from "@/components/modals/ModalWrapper";
import "@/global.css";
import useModalStore from "@/stores/modalStore";
import React, { memo, useEffect, useMemo, useState } from "react";
import { View } from "react-native";

export type AlertModalOptions = {
  type: "alert";
  title?: string;
  message?: string;
  subMessage?: string;
  okText?: string;
  onOk?: () => void;
  onClose?: () => void;
};
export type ConfirmModalOptions = {
  type: "confirm";
  title?: string;
  message?: string;
  subMessage?: string;
  okText?: string;
  cancelText?: string;
  onOk?: () => void;
  onCancel?: () => void;
};
export type InputModalOptions = {
  type: "input";
  textAlign?: "center" | "left" | "right";
  keyboardType?: "default" | "numeric" | "email-address" | "phone-pad";
  defaultValue?: string;
  placeholder?: string;
  isShowCancelButton?: boolean;
  textInnerHeader?: React.ReactNode;
  textOuterHeader?: React.ReactNode;
  textInnerFooter?: React.ReactNode;
  textOuterFooter?: React.ReactNode;
  okText?: string;
  cancelText?: string;
  onOk?: (value: string) => void;
  onCancel?: () => void;
};

export type PromptModalOptions = {
  type: "prompt";
  defaultValue?: string;
  placeholder?: string;
  isShowCancelButton?: boolean;
  textInnerHeader?: React.ReactNode;
  textOuterHeader?: React.ReactNode;
  textInnerFooter?: React.ReactNode;
  textOuterFooter?: React.ReactNode;
  okText?: string;
  cancelText?: string;
  onOk?: (value: string) => void;
  onCancel?: () => void;
};

export type MenuOption = {
  key?: string;
  icon?: React.ReactNode;
  label: string;
  rightContent?: React.ReactNode;
  value?: string | number;
  isCloseAfterPress?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  color?: string;
  backgroundColor?: string;
};

export type MenuModalOptions = {
  type: "menu";
  menuOptions: MenuOption[];
  okText?: string;
  cancelText?: string;
  onOk?: () => void;
  onCancel?: () => void;
};

export type TabsModalOptions = {
  type: "tabs";
  tabs: React.ReactNode[];
  okText?: string;
  cancelText?: string;
  isShowCancelButton?: boolean;
  onOk?: () => void;
  onCancel?: () => void;
};

export type CustomModalOptions = {
  type: "custom";
};

export type BasicModalOptions = {
  title?: string;
  message?: string;
  subMessage?: string;
  modalTitle?: string;
  render?: React.ReactNode;
  onDismiss?: () => void; // lúc đóng modal
  header?: React.ReactNode;
  footer?: React.ReactNode;
  middle?: React.ReactNode;
  inAnimation?: "fade" | "slideDown" | "slideUp" | "zoomIn" | "zoomOut";
  outAnimation?: "fade" | "slideDown" | "slideUp" | "zoomIn" | "zoomOut";
};
export type GlobalModalOptions = BasicModalOptions &
  (
    | AlertModalOptions
    | ConfirmModalOptions
    | InputModalOptions
    | PromptModalOptions
    | MenuModalOptions
    | CustomModalOptions
    | TabsModalOptions
  );

export type ListModalOptions = {
  title: string;
  value: number | string;
  type?: "checkbox" | "radio";
  options: { label: string; value: number | string }[];
  onDismiss?: () => void;
  onSubmit: (val: number | string) => void;
  inAnimation?: "fade" | "slideDown" | "slideUp" | "zoomIn" | "zoomOut";
  outAnimation?: "fade" | "slideDown" | "slideUp" | "zoomIn" | "zoomOut";
};
const GlobalModalComponent = () => {
  const { currentModal, modalQueue, closeCurrentModal } = useModalStore();
  const backDropVisible = useMemo(
    () => currentModal || modalQueue.length,
    [currentModal],
  );
  const [placeholder, setPlaceholder] = useState<GlobalModalOptions | null>(
    currentModal,
  );

  useEffect(() => {
    if (currentModal) {
      setPlaceholder(currentModal);
    }
  }, [currentModal]);

  const showValue = currentModal ?? placeholder;

  const closeModal = () => {
    if (!currentModal) return;
    currentModal?.onDismiss?.();
    closeCurrentModal();
  };

  return (
    <ModalWrapper
      title={showValue?.modalTitle}
      show={!!currentModal}
      onCancel={closeModal}
      inAnimation={showValue?.inAnimation}
      outAnimation={showValue?.outAnimation}
      type={showValue?.type}
      bottom={showValue?.footer}
    >
      <View className="px-3 rounded-lg">
        {showValue?.header}

        {showValue && <RenderContent modal={showValue} />}

        {showValue?.footer}
      </View>
    </ModalWrapper>
  );
};

const RenderContent = ({ modal }: { modal: GlobalModalOptions }) => {
  switch (modal.type) {
    case "alert":
      return <AlertModal {...modal} />;

    case "confirm":
      return <ConfirmModal {...modal} />;

    case "menu":
      return <MenuModal {...modal} />;

    case "input":
      return <InputModal {...modal} />;

    case "prompt":
      return <PromptModal {...modal} />;

    case "tabs":
      return <TabsModal {...modal} />;

    case "custom":
      return <CustomModal {...modal} />;

    default:
      return null;
  }
};

export const GlobalModal = memo(GlobalModalComponent);

export default GlobalModal;
