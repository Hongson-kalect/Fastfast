import { GlobalModalOptions, ListModalOptions } from "@/providers/Modal";
import { create } from "zustand";

interface ModalProps {
  globalModal: GlobalModalOptions | null;
  setGlobalModal: (modal: GlobalModalOptions | null) => void;

  listModal: ListModalOptions | null;
  setListModal: (modal: ListModalOptions | null) => void;
}

const useModalStore = create<ModalProps>((set) => ({
  globalModal: null,
  setGlobalModal: (modal: GlobalModalOptions | null) =>
    set({ globalModal: modal }),

  listModal: null,
  setListModal: (modal: ListModalOptions | null) => set({ listModal: modal }),
}));

export default useModalStore;
