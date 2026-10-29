import { EffectDefinition } from "../types";
import { ChristmasButton } from "./ChristmasButton";
import { ChristmasCard } from "./ChristmasCard";
import { ChristmasTabBar } from "./ChristmasTabBar";
import { Snowfall } from "./Snowfall";
import { ChristmasTouch } from "./ChristmasTouch";

export const christmasEffect: EffectDefinition = {
  screen: Snowfall,
  card: ChristmasCard,
  tabBar: ChristmasTabBar,
  button: ChristmasButton,
  touch: ChristmasTouch,
};
