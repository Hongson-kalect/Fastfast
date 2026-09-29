import { GlobalModalOptions, ListModalOptions } from "@/provider/Modal";
import { create } from "zustand";

const MODAL_TRANSITION_DELAY = 500;

interface ModalState {
  currentModal: GlobalModalOptions | null;
  modalQueue: GlobalModalOptions[];

  listModal: ListModalOptions | null;

  addModal: (modal: GlobalModalOptions) => void;
  closeCurrentModal: () => void;
  clearModalQueue: () => void;

  setListModal: (modal: ListModalOptions | null) => void;
}

const useModalStore = create<ModalState>((set, get) => ({
  currentModal: null,
  modalQueue: [],

  listModal: null,

  /**
   * Add a modal to the global modal system.
   *
   * If no modal is currently displayed, show it immediately.
   * Otherwise, append it to the queue.
   */
  addModal: (modal) => {
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

  /**
   * Close the currently displayed modal.
   *
   * The next modal is displayed after the close animation
   * has had enough time to finish.
   */
  closeCurrentModal: () => {
    const nextModal = get().modalQueue[0];

    set({
      currentModal: null,
    });

    if (!nextModal) {
      return;
    }

    setTimeout(() => {
      set((state) => {
        // Queue may have changed while the closing animation
        // was running. Always consume the current first item.
        const next = state.modalQueue[0];

        if (!next) {
          return {};
        }

        return {
          currentModal: next,
          modalQueue: state.modalQueue.slice(1),
        };
      });
    }, MODAL_TRANSITION_DELAY);
  },

  /**
   * Immediately close the current modal and discard
   * every queued modal.
   */
  clearModalQueue: () => {
    set({
      currentModal: null,
      modalQueue: [],
    });
  },

  /**
   * List modal is separate from the normal global modal queue.
   */
  setListModal: (modal) => {
    set({
      listModal: modal,
    });
  },
}));

export default useModalStore;
