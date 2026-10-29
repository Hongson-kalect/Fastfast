import { RADIUS } from "@/constants/design";
import { useBottomSheet } from "@/providers/BottomSheet";
import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import { feedback } from "@/utils/feedback";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";
import CircularProgress from "../CircleProgress";
import { ThemedText } from "../themed-text";
import HabitBottomSheet from "./HabitBottomSheet";
import { ShieldInfo } from "./InfoContent";
import { ButtonEffect } from "../effect/slots";
import { useShallow } from "zustand/react/shallow";
import { useT } from "@/providers/Language";

const greetingKey = (date = new Date()) => {
  const hour = date.getHours();
  if (hour < 11) return "home.greeting.morning";
  if (hour < 14) return "home.greeting.noon";
  if (hour < 18) return "home.greeting.afternoon";
  return "home.greeting.evening";
};

const Pill = ({
  icon,
  value,
  color,
  onPress,
}: {
  icon: React.ReactNode;
  value: string | number;
  color: string;
  onPress?: () => void;
}) => (
  <Pressable
    disabled={!onPress}
    hitSlop={6}
    onPress={onPress}
    className="flex-row items-center gap-1.5 px-3 py-1.5"
    style={{ borderRadius: RADIUS.pill, backgroundColor: color + "1F" }}
  >
    {icon}
    <ThemedText size="sm" weight="bold" colorHex={color}>
      {value}
    </ThemedText>
    <ButtonEffect variant="chip" radius={RADIUS.pill} color={color} isCounting={false} />
  </Pressable>
);

const HomeHeader = () => {
  const { habit, userProfile, theme } = useAppStore(
    useShallow((state) => ({
      habit: state.habit,
      userProfile: state.userProfile,
      theme: state.theme,
    })),
  );
  const { present } = useBottomSheet();
  const addModal = useModalStore((state) => state.addModal);
  const t = useT();

  const openHabitModal = () => {
    feedback("tap");
    present(<HabitBottomSheet />, {
      isRaw: true,
      snapPoints: ["100%"],
    });
  };

  const openShieldInfo = () => {
    feedback("tap");
    addModal({
      type: "alert",
      title: t("info.shield.title"),
      message: t("info.shield.message"),
      middle: <ShieldInfo />,
      okText: t("common.gotIt"),
    });
  };

  const habitValue = Math.round(habit?.habit_snap || 0);

  return (
    <View className="flex-row items-center justify-between pt-2">
      <View className="gap-2">
        <ThemedText size="sm" color="text" opacity="medium">
          {t(greetingKey())} 👋
        </ThemedText>

        <View className="flex-row gap-2">
          <Pill
            icon={<Ionicons name="flame" size={15} color={theme.warning} />}
            value={t("home.streakDays", { count: userProfile?.current_streak ?? 0 })}
            color={theme.warning}
          />
          <Pill
            icon={<FontAwesome5 name="shield-alt" size={12} color={theme.info} />}
            value={habit?.shield_snap ?? 0}
            color={theme.info}
            onPress={openShieldInfo}
          />
        </View>
      </View>

      {/* Độ bền thói quen */}
      <Pressable
        className="z-10 items-center"
        hitSlop={10}
        onPress={openHabitModal}
      >
        <CircularProgress
          value={habitValue}
          size={64}
          strokeWidth={6}
          strokeColor={theme.primary}
          inactiveStrokeColor={theme.text + "14"}
          renderCenter={(_, animated) => (
            <View className="items-center">
              <ThemedText size="md" weight="extrabold" color="title">
                {animated}
                <ThemedText size="xxs" weight="bold" color="text" opacity="medium">
                  %
                </ThemedText>
              </ThemedText>
            </View>
          )}
        />
        <ButtonEffect variant="chip" radius={32} color={theme.primary} isCounting={false} />
      </Pressable>
    </View>
  );
};

export default HomeHeader;
