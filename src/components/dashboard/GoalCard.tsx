import { useDBService } from "@/hooks/useDBService";
import { WeightTarget } from "@/interfaces/db.type";
import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import { fixed } from "@/util/numberLimit";
import {
  Feather,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  Easing,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { ThemedText } from "../themed-text";
import { useDashboardStore } from "@/stores/dashboardStore";
import { loadActiveTarget } from "@/stores/dashboardAction";
import { useSQLiteContext } from "expo-sqlite";

export const GoalCard = () => {
  const dbService = useDBService();
  const { weight, settings, theme, updateSetting, updateWeight } =
    useAppStore();
    const {weightTarget, setWeightTarget} = useDashboardStore()
  const { addModal } = useModalStore();

  const targetWeight = weightTarget?.target_weight;

  const percentage =
    weightTarget &&
    weight &&
    weightTarget.start_weight !== weightTarget.target_weight
      ? Math.max(
          Math.min(
            ((weightTarget.start_weight - weight) /
              (weightTarget.start_weight - weightTarget.target_weight)) *
              100,
            100,
          ),
          0,
        )
      : 0;

  const remaining =
    weightTarget && weight ? fixed(weight - weightTarget.target_weight) : 0;

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;

    progress.value = withTiming(percentage, {
      duration: 700,
      easing: Easing.out(Easing.cubic),
    });
  }, [percentage]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

  const openSetWeightModal = () => {
    addModal({
      type: "input",
      keyboardType: "numeric",
      title: "Current Weight",
      message: "Enter your current weight",
      onOk: async (value) => {
        const val = Number(value);
        if (val && val > 0) {
          await dbService?.updateWeight(val);
          updateWeight(val);
        }
      },
    });
  };

  const db = useSQLiteContext()

  const openWeightTargetModal = () => {
    addModal({
      type: "input",
      keyboardType: "numeric",
      title: "Target",
      message: "Set your weight target",
      onOk: async (value) => {
        const target = Number(value);
        await dbService?.setting("weight_target", target);
        await dbService.createWeightTarget({
          startWeight: weight || 0,
          targetWeight: target,
        });
        updateSetting({ weight_target: target });
        const activeTarget = await loadActiveTarget(db);
        setWeightTarget(activeTarget)
      },
    });
  };


  const goalCardLayout = LinearTransition
  .springify()
  .damping(18)
  .stiffness(180);

  if (!weight) {
    return (
      <Animated.View className="mb-4 rounded-2xl bg-background2 px-4 py-4"
      layout={goalCardLayout}
      >
        <View className="flex-row items-center gap-3">
          <View className="h-11 w-11 items-center justify-center rounded-xl bg-success/10">
            <MaterialCommunityIcons
              name="weight"
              size={20}
              color={theme.success}
            />
          </View>

          <View className="flex-1">
            <ThemedText size="sm" weight="semibold" color="title">
              Set your current weight
            </ThemedText>
            <ThemedText
              size="xxs"
              color="text"
              opacity="medium"
              className="mt-0.5"
            >
              Add your weight to start tracking progress
            </ThemedText>
          </View>

          <Pressable
            onPress={openSetWeightModal}
            className="h-10 w-10 items-center justify-center rounded-full bg-success"
          >
            <Feather name="plus" size={18} color={theme.background} />
          </Pressable>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View className="mb-4 rounded-2xl bg-background2 px-4 py-4"
      layout={goalCardLayout}
    >

      {/* Header */}
      <View className="flex-row items-start justify-between">
        <View>
          <ThemedText size="xxs" color="text" opacity="medium">
            Weight goal
          </ThemedText>

          {weightTarget ? (
            <Pressable
              onPress={openWeightTargetModal}
              className="mt-0.5 flex-row items-center gap-1.5"
              hitSlop={6}
            >
              <ThemedText size="lg" weight="bold" color="title">
                {targetWeight} kg
              </ThemedText>

              <MaterialIcons name="edit" size={14} color={theme.warning} />
            </Pressable>
          ) : (
            <Pressable
              onPress={openWeightTargetModal}
              className="mt-1 flex-row items-center gap-1.5"
              hitSlop={6}
            >
              <ThemedText size="sm" weight="semibold" color="warning">
                Set weight target
              </ThemedText>

              <Feather name="arrow-right" size={14} color={theme.warning} />
            </Pressable>
          )}
        </View>

        {/* Current weight */}
        <Pressable
          onPress={openSetWeightModal}
          className="items-end"
          hitSlop={6}
        >
          <View className="flex-row items-baseline gap-1">
            <ThemedText size="xxl" weight="bold" color="title">
              {fixed(weight)}
            </ThemedText>

            <ThemedText size="xxs" color="text" opacity="medium">
              kg
            </ThemedText>
          </View>

          <ThemedText size="xxs" color="text" opacity="low" className="mt-0.5">
            Current weight
          </ThemedText>
        </Pressable>
      </View>

      {/* Progress */}
      {weightTarget ? (
        <View className="mt-5">
          <View className="h-2 overflow-hidden rounded-full bg-text-base/10">
            <Animated.View
              className="h-full rounded-full"
              style={[
                {
                  backgroundColor: theme.primary,
                },
                animatedStyle,
              ]}
            >
              <LinearGradient
                colors={[theme.primary + "80", theme.primary]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={{
                  flex: 1,
                  borderRadius: 999,
                }}
              />
            </Animated.View>
          </View>

          <View className="mt-2 flex-row items-center justify-between">
            <ThemedText size="xxs" color="text" opacity="medium">
              {fixed(weightTarget.start_weight)} kg
            </ThemedText>

            <ThemedText size="xs" weight="bold" color="primary">
              {Math.round(percentage)}%
            </ThemedText>

            <ThemedText size="xxs" color="text" opacity="medium">
              {fixed(weightTarget.target_weight)} kg
            </ThemedText>
          </View>
        </View>
      ) : (
        <View className="mt-5 rounded-xl bg-text-base/5 px-3 py-2.5">
          <ThemedText
            size="xxs"
            color="text"
            opacity="medium"
            style={{ textAlign: "center" }}
          >
            Set a target weight to track your progress
          </ThemedText>
        </View>
      )}

      {/* Remaining */}
      {targetWeight && (
        <View className="mt-3 flex-row items-center justify-between">
          <ThemedText size="xxs" color="text" opacity="low">
            Progress
          </ThemedText>

          <ThemedText
            size="xs"
            weight="semibold"
            color={remaining > 0 ? "success" : "primary"}
          >
            {remaining > 0 ? `${fixed(remaining)} kg to go` : "Goal reached"}
          </ThemedText>
        </View>
      )}
    </Animated.View>
  );
};
