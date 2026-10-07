import { create } from "zustand";

import { DashboardState } from "./dashboardAction";

export const initialState = {
  weightTarget:null,
  weightData: [],
  fastStatistics: null,
  hasUnclaimedMilestones: false,
  userAchievements: [],
  currentMilestones: [],
  isInitialized: false,
  isRefreshing: false,
  isHydrated: false,
};

export const useDashboardStore = create<DashboardState>((set) => ({
  ...initialState,

  setWeightTarget: (weightTarget) => {
    set({ weightTarget: weightTarget });
  },
  setWeightData: (weightData) => {
    set({ weightData });
  },

  setFastStatistics: (fastStatistics) => {
    set({ fastStatistics });
  },

  setHasUnclaimedMilestones: (value) => {
    set({
      hasUnclaimedMilestones: value,
    })
  },

  setUserAchievements: (value) => {
    set({
      userAchievements: value,
    })
  },

  setCurrentMilestones: (value) => {
    set({
      currentMilestones: value,
    });
  },

  setInitialized: (isInitialized) => {
    set({ isInitialized });
  },

  setRefreshing: (isRefreshing) => {
    set({ isRefreshing });
  },

  reset: () => {
    set({ ...initialState });
  },
}));
