import React from "react";
import { View } from "react-native";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";

import { ThemedText } from "@/components/themed-text";

type Props = {
  habitPercent: number;
  isMilestone35Reached: boolean;
  isMilestone70Reached: boolean;
  isMilestone100Reached: boolean;
  primaryColor: string;
  textColor: string;
};

const HabitMilestone = ({
  habitPercent,
  isMilestone35Reached,
  isMilestone70Reached,
  isMilestone100Reached,
  primaryColor,
  textColor,
}: Props) => {
  return (
    <View className="bg-background2/80 p-4 rounded-2xl border border-text-base/5 my-4">
      <View className="flex-row justify-between items-center mb-4">
        <ThemedText size="xs" weight="semibold" color="text" opacity="medium">
          Tiến trình
        </ThemedText>
      </View>

      <View className="relative h-3 bg-text-base/20 rounded-full w-full overflow-hidden">
        <View
          className="h-full bg-primary rounded-full"
          style={{
            width: `${Math.min(habitPercent, 100)}%`,
          }}
        />
      </View>

      <View className="relative h-12 w-full flex-row justify-between px-1">
        {/* 0% */}
        <View className="items-center -ml-2 opacity-0">
          <View className="w-0.5 h-2 bg-text-base/20 mb-1" />

          <ThemedText size="xxs" color="text" opacity="low">
            0%
          </ThemedText>
        </View>

        {/* 35% */}
        <View className="absolute left-[35%] -translate-x-1/2 items-center">
          <View className="w-0.5 h-2 bg-text-base/20 mb-1" />

          <View
            className={`p-1 rounded-full ${
              isMilestone35Reached
                ? "bg-primary/20 border border-primary/50"
                : "bg-background2 opacity-40"
            }`}
          >
            <FontAwesome5
              name="shield-alt"
              size={10}
              color={isMilestone35Reached ? primaryColor : textColor}
            />
          </View>

          <ThemedText
            size="xxs"
            color="text"
            opacity="medium"
            style={{ marginTop: 2 }}
          >
            35%
          </ThemedText>
        </View>

        {/* 70% */}
        <View className="absolute left-[70%] -translate-x-1/2 items-center">
          <View className="w-0.5 h-2 bg-text-base/20 mb-1" />

          <View
            className={`p-1 rounded-full ${
              isMilestone70Reached
                ? "bg-primary/20 border border-primary/50"
                : "bg-background2 opacity-40"
            }`}
          >
            <FontAwesome5
              name="shield-alt"
              size={10}
              color={isMilestone70Reached ? primaryColor : textColor}
            />
          </View>

          <ThemedText
            size="xxs"
            color="text"
            opacity="medium"
            style={{ marginTop: 2 }}
          >
            70%
          </ThemedText>
        </View>

        {/* 100% */}
        <View className="items-center -mr-2">
          <View className="w-0.5 h-2 bg-text-base/20 mb-1" />

          <View
            className={`p-1 rounded-full ${
              isMilestone100Reached
                ? "bg-amber-500/20 border border-amber-500/50"
                : "bg-background2 opacity-40"
            }`}
          >
            <FontAwesome5
              name="crown"
              size={10}
              color={isMilestone100Reached ? "#FBBF24" : textColor}
            />
          </View>

          <ThemedText
            size="xxs"
            color="text"
            opacity="medium"
            style={{ marginTop: 2 }}
          >
            100%
          </ThemedText>
        </View>
      </View>
    </View>
  );
};

export default HabitMilestone;