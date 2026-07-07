import { create } from "zustand";

export type AudioType =
  | {
      uri: string | null;
      duration: number;
    }
  | undefined;
interface RecodingProps {
  onRecording: ((val: AudioType | null) => void) | null;
  setOnRecording: (val: ((val: AudioType | null) => void) | null) => void;
}

const useRecordingStore = create<RecodingProps>((set) => ({
  onRecording: null,
  setOnRecording: (val) => set({ onRecording: val }),
}));

export default useRecordingStore;
