import { GlobalModalOptions, ListModalOptions } from "@/providers/Modal";
import { create } from "zustand";

interface UserStateProps {
  hearable: boolean;
  setHearable: (val: boolean) => void;
  talkable: boolean;
  setTalkable: (val: boolean) => void;
}

const useUserStateStore = create<UserStateProps>((set) => ({
  hearable: true,
  talkable: true,
  setHearable: (val) => set({ hearable: val }),
  setTalkable: (val) => set({ talkable: val }),
}));

export default useUserStateStore;
