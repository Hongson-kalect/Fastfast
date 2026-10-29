import { ThemeItem } from "@/constants/themes";
import { christmasEffect } from "./christmas";
import { EffectDefinition } from "./types";

/** Mọi bộ effect, key là giá trị `effect` khai báo trên theme */
export const EFFECTS: Record<NonNullable<ThemeItem["effect"]>, EffectDefinition> = {
  christmas: christmasEffect,
};
