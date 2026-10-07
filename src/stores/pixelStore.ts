
import { PixelStats, ViewMode, YearPixelDataMap } from "@/interfaces/pixel";
import { create } from "zustand";

type PixelStore = {
  year: number;
  viewMode: ViewMode;

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

  yearPixelData: {},
  stats: initialStats,

  isLoading: false,

  setYear: (year) => set({ year }),

  setViewMode: (viewMode) => set({ viewMode }),

  setYearPixelData: (yearPixelData) =>
    set({ yearPixelData }),

  setStats: (stats) =>
    set({ stats }),

  setIsLoading: (isLoading) =>
    set({ isLoading }),

  hydratePixel: ({
    year,
    viewMode,
    yearPixelData,
    stats,
  }) =>
    set({
      year,
      viewMode,
      yearPixelData,
      stats,
      isLoading: false,
    }),
}));