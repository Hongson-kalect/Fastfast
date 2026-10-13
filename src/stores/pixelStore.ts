import { PixelStats, ViewMode, YearPixelDataMap } from "@/interfaces/pixel";
import { create } from "zustand";
export type PixelCounter={
  mood:{
    0: number,
    1: number,
    2: number,
    3: number,
    4: number,
  },
  fast:{
    0: number,
    1: number,
    2: number,
    3: number,
    4: number,
    5: number,
    6: number,
  }
}
type PixelStore = {
  year: number;
  viewMode: ViewMode;

  counter: PixelCounter;
  yearPixelData: YearPixelDataMap;
  stats: PixelStats;

  isLoading: boolean;

  setYear: (year: number) => void;
  setViewMode: (viewMode: ViewMode) => void;
  setYearPixelData: (data: YearPixelDataMap) => void;
  setStats: (stats: PixelStats) => void;
  setIsLoading: (loading: boolean) => void;

  hydratePixel: (data: {
    year: number;
    viewMode: ViewMode;
    yearPixelData: YearPixelDataMap;
    stats: PixelStats;
    counter: PixelCounter;
  }) => void;
  updatePixel: (data: {
    year?: number;
    viewMode?: ViewMode;
    yearPixelData?: YearPixelDataMap;
    stats?: PixelStats;
    counter?: PixelCounter;
  }) => void;
};

const currentYear = new Date().getFullYear();

const initialStats: PixelStats = {
  fastDays: 0,
  fastHour: 0,
  logDays: 0,
};

export const usePixelStore = create<PixelStore>((set) => ({
  year: currentYear,
  viewMode: "fasting",

  counter: {
    mood: {
      0: 0,
      1: 0,
      2: 0,
      3: 0,
      4: 0,
    },
    fast:{
      0: 0,
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
      6: 0,
    }
  },
  yearPixelData: {},
  stats: initialStats,

  isLoading: false,

  setYear: (year) => set({ year }),

  setViewMode: (viewMode) => set({ viewMode }),

  setYearPixelData: (yearPixelData) => set({ yearPixelData }),

  setStats: (stats) => set({ stats }),

  setIsLoading: (isLoading) => set({ isLoading }),

  hydratePixel: ({ year, viewMode, yearPixelData, stats }) =>
    set({
      year,
      viewMode,
      yearPixelData,
      stats,
      isLoading: false,
    }),
  updatePixel: (data) =>
    set({
      ...data,
    }),
}));
