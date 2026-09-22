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
import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { ThemedText } from "../themed-text";

export const GoalCard = () => {
  const dbService = useDBService();
  const { weight, settings, theme, updateSetting, updateWeight } =
    useAppStore();
  const { addModal } = useModalStore();
  const [activeTarget, setActiveTarget] = useState<WeightTarget | null>(null);

  const [startWeight, targetWeight] = useMemo(() => {
    if (!activeTarget) return [];
    return [activeTarget?.start_weight, activeTarget?.target_weight];
  }, [activeTarget]);

  const percentage = useMemo(() => {
    if (!activeTarget || !weight) return 0;
    return Math.max(
      Math.min(
        ((activeTarget?.start_weight - weight) /
          (activeTarget?.start_weight - activeTarget?.target_weight)) *
          100,
        100,
      ),
      0,
    );
  }, []);

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

  const remaining = useMemo(() => {
    if (!activeTarget || !weight) return 0;
    return (weight - activeTarget.target_weight).toFixed(1);
  }, []);

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
        await getActiveWeightTarget();
      },
    });
  };

  const handleSetWeight = () => {
    openSetWeightModal();
  };

  const handleSetTarget = () => {
    openWeightTargetModal();
  };

  const getActiveWeightTarget = async () => {
    const res = await dbService?.getActiveWeightTarget();
    if (res) setActiveTarget(res);
  };

  useEffect(() => {
    getActiveWeightTarget();
  }, []);

  if (!weight)
    return (
      <View className="mb-4 items-end">
        <Pressable
          onPress={handleSetWeight}
          className="flex-row items-center gap-1 rounded-lg bg-success px-2 py-3"
        >
          <Feather name="plus" size={16} color="#FFFFFF" />

          <ThemedText size="sm" weight="medium" colorHex="#FFFFFF">
            Add current Weight
          </ThemedText>
        </Pressable>
      </View>
    );

  return (
    <View
      className="mb-4 h-36 rounded-2xl p-4"
      style={{
        backgroundColor: theme.primary + "40",
        borderWidth: 1,
        borderColor: theme.text + "12",
      }}
    >
      {/* Header Goal */}
      <View className="flex-row items-center justify-between">
        {activeTarget ? (
          <Pressable
            onPress={handleSetTarget}
            className="flex-row items-center gap-2.5"
          >
            <View
              className="h-8 w-8 items-center justify-center rounded-lg"
              style={{
                backgroundColor: theme.primary + "50",
              }}
            >
              <Text>🎯</Text>
            </View>

            <View>
              <ThemedText size="xxs" color="text" opacity="medium">
                Weight Target
              </ThemedText>

              <View className="flex-row items-center gap-1">
                <ThemedText size="sm" weight="semibold" color="text">
                  {targetWeight} kg
                </ThemedText>

                <MaterialIcons name="edit" size={14} color={theme.warning} />
              </View>
            </View>
          </Pressable>
        ) : (
          <Pressable
            onPress={handleSetTarget}
            className="rounded-lg bg-warning px-2 py-3"
          >
            <ThemedText size="xs" weight="medium" colorHex="#FFFFFF">
              Set Weight Target
            </ThemedText>
          </Pressable>
        )}

        <Pressable
          onPress={handleSetWeight}
          className="items-end rounded-lg border p-1.5"
          style={{
            borderStyle: "dashed",
            borderColor: theme.text + "20",
            backgroundColor: theme.text + "10",
          }}
        >
          <View className="flex-row items-baseline gap-0.5">
            <MaterialCommunityIcons
              name="weight"
              size={16}
              color={theme.text}
            />

            <ThemedText size="lg" weight="bold" color="text">
              {fixed(weight)}
            </ThemedText>

            <ThemedText size="xxs" color="text" opacity="medium">
              kg
            </ThemedText>
          </View>

          {targetWeight && (
            <ThemedText size="xxs" weight="medium" color="success">
              -{remaining} kg to go
            </ThemedText>
          )}
        </Pressable>
      </View>

      {/* Progress */}
      {targetWeight ? (
        <View className="mt-3.5">
          <View className="h-2 w-full overflow-hidden rounded-full bg-background2">
            <Animated.View
              className="h-full rounded-full bg-primary/80"
              style={[animatedStyle]}
            >
              <LinearGradient
                colors={[theme.primary + "AA", theme.primary]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={{
                  flex: 1,
                  borderRadius: 999,
                }}
              />
            </Animated.View>
          </View>

          <View className="mt-1.5 flex-row justify-between">
            <ThemedText size="xxs" color="text" opacity="medium">
              Start: {startWeight}kg
            </ThemedText>

            <ThemedText size="xxs" weight="semibold" color="primary">
              {Math.round(percentage)}%
            </ThemedText>
          </View>
        </View>
      ) : (
        <View className="flex-1 items-center justify-center">
          <ThemedText size="xs" color="text" opacity="low">
            Set target to measure your progress
          </ThemedText>
        </View>
      )}
    </View>
  );
};
