import { useDBService } from "@/hooks/useDBService";
import { WeightTarget } from "@/interfaces/db.type";
import { useBottomSheet } from "@/provider/BottomSheet";
import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
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
  const { setGlobalModal } = useModalStore();
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
  const { present, close } = useBottomSheet();

  const openSetWeightModal = () => {
    setGlobalModal({
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
    setGlobalModal({
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

  console.log(targetWeight);

  const getActiveWeightTarget = async () => {
    const res = await dbService?.getActiveWeightTarget();
    if (res) setActiveTarget(res);
  };

  useEffect(() => {
    getActiveWeightTarget();
  }, []);

  if (!weight)
    return (
      <View className="items-end mb-4">
        <Pressable
          onPress={handleSetWeight}
          className="px-2 py-3 rounded-lg bg-success flex-row items-center gap-1"
        >
          <Feather name="plus" size={16} color="white" />
          <ThemedText color="white" className="text-sm!">
            Add current Weigth
          </ThemedText>
        </Pressable>
      </View>
    );

  return (
    <View className="mb-4 rounded-2xl border border-zinc-800 bg-primary/40 p-4">
      {/* Header Goal */}
      <View className="flex-row items-center justify-between">
        {!!weight ? (
          activeTarget ? (
            <Pressable
              onPress={handleSetTarget}
              className="flex-row items-center gap-2.5"
            >
              <View className="h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/50">
                <Text>🎯</Text>
              </View>
              <View>
                <Text className="text-[10px] text-zinc-400">Weight Target</Text>
                <View className="flex-row items-center gap-1">
                  <Text className="text-sm text-white font-semibold">
                    {targetWeight} kg
                  </Text>
                  <MaterialIcons name="edit" size={14} color="orange" />
                </View>
              </View>
            </Pressable>
          ) : (
            <Pressable
              onPress={handleSetTarget}
              className="px-2 py-3 rounded-lg bg-orange-600"
            >
              <ThemedText color="white" className="text-xs!">
                Set Weight Target
              </ThemedText>
            </Pressable>
          )
        ) : (
          <View></View>
        )}

        <Pressable
          onPress={handleSetWeight}
          className="items-end p-1.5 border-dashed border-white/20 rounded-lg border bg-white/10"
        >
          <View className="flex-row items-baseline gap-0.5">
            <MaterialCommunityIcons name="weight" size={16} color="white" />
            <Text className="text-lg font-bold text-white">
              {weight.toFixed(1)}
            </Text>
            <Text className="text-[10px] text-zinc-400">kg</Text>
          </View>
          {targetWeight && (
            <Text className="text-[10px] font-medium text-green-400">
              -{remaining} kg to go
            </Text>
          )}
        </Pressable>
      </View>

      {/* Modern Slim Progress Bar */}
      {!!weight && !!targetWeight && (
        <View className="mt-3.5">
          <View className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
            <Animated.View
              className="h-full rounded-full bg-primary/80"
              style={[animatedStyle]}
            >
              <LinearGradient
                colors={[theme.primary + "aa", theme.primary]}
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
            <Text className="text-[10px] text-zinc-500">
              Start: {startWeight}kg
            </Text>
            <Text className="text-[10px] font-semibold text-primary">
              {Math.round(percentage)}%
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};
