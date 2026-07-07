import useModalStore from "@/stores/modalStore";
import { memo } from "react";
import { OptionsModal } from "./components/RadioModal";

export type ListModalOptions = {
  title: string;
  value: number | string;
  options: { label: string; value: number | string }[];
  onDismiss?: () => void;
  onSubmit: (val: number | string) => void;
};

const OptionsModalComponent = () => {
  const { listModal, setListModal } = useModalStore();

  const closeModal = () => {
    listModal?.onDismiss?.();
    setListModal(null);
  };

  return (
    <OptionsModal
      show={!!listModal}
      title={listModal?.title}
      value={listModal?.value?.toString() ?? ""}
      options={listModal?.options ?? []}
      onCancel={closeModal}
      onSubmit={(val) => {
        listModal?.onSubmit(val);
        setListModal(null);
      }}
    />
  );
};

export const ListModal = memo(OptionsModalComponent);
