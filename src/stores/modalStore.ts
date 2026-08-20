import { GlobalModalOptions, ListModalOptions } from "@/provider/Modal";
import { create } from "zustand";

interface ModalProps {
  currentModal: GlobalModalOptions | null;
  modalQueue: GlobalModalOptions[];

  addModal: (modal: GlobalModalOptions | null) => void;
  closeCurrentModal: () => void;
  clearModalQueue: () => void;

  listModal: ListModalOptions | null;
  setListModal: (modal: ListModalOptions | null) => void;
}

const useModalStore = create<ModalProps>((set, get) => ({
  currentModal: null,
  modalQueue: [],

  addModal: (modal) => {
    if (!modal) return get().closeCurrentModal();

    set((state) => {
      if (state.currentModal) {
        return {
          modalQueue: [...state.modalQueue, modal],
        };
      }

      return {
        currentModal: modal,
      };
    });
  },

  closeCurrentModal: () =>
    set({
      currentModal: null,
    }),

  clearModalQueue: () =>
    set({
      currentModal: null,
      modalQueue: [],
    }),

  listModal: null,
  setListModal: (modal: ListModalOptions | null) => set({ listModal: modal }),
}));

export default useModalStore;
