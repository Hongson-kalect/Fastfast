import { RADIUS } from "@/constants/design";
import { useAppStore } from "@/stores/appStore";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";
import { ThemedText } from "../themed-text";

const MiniStat = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) => (
  <View className="flex-row items-center gap-2">
    <View className="h-7 w-7 items-center justify-center rounded-full bg-text-base/10">
      {icon}
    </View>
    <View>
      <ThemedText size="xxs" color="text" opacity="medium">
        {label}
      </ThemedText>
      <ThemedText size="sm" weight="extrabold" color="title">
        {value}
      </ThemedText>
    </View>
  </View>
);

/** Card nổi bật đầu Dashboard: streak hiện tại + kỷ lục, khiên, độ bền thói quen. */
export const StreakHero = () => {
  const { userProfile, habit, theme } = useAppStore();
  const streak = userProfile?.current_streak ?? 0;

  return (
    <LinearGradient
      colors={[theme.warning + "40", theme.primary + "1A", theme.card]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        borderRadius: RADIUS.xl,
        borderWidth: 1,
        borderColor: theme.warning + "33",
        padding: 20,
      }}
    >
      <View className="flex-row items-center justify-between">
        <View className="gap-1">
          <ThemedText
            size="xs"
            weight="extrabold"
            colorHex={theme.warning}
            style={{ letterSpacing: 1.2, textTransform: "uppercase" }}
          >
            Streak hiện tại
          </ThemedText>
          <View className="flex-row items-end gap-2">
            <ThemedText size="displayLarge" weight="extrabold" color="title">
              {streak}
            </ThemedText>
            <ThemedText
              size="md"
              weight="semibold"
              color="text"
              opacity="medium"
              style={{ marginBottom: 8 }}
            >
              ngày
            </ThemedText>
          </View>
        </View>

        <View
          className="h-20 w-20 items-center justify-center rounded-full"
          style={{ backgroundColor: theme.warning + "26" }}
        >
          <Ionicons name="flame" size={44} color={theme.warning} />
        </View>
      </View>

      <View className="mt-4 flex-row justify-between border-t border-text-base/10 pt-4">
        <MiniStat
          icon={<Ionicons name="trophy" size={13} color={theme.warning} />}
          label="Kỷ lục"
          value={`${userProfile?.max_streak ?? 0} ngày`}
        />
        <MiniStat
          icon={<FontAwesome5 name="shield-alt" size={11} color={theme.info} />}
          label="Khiên"
          value={habit?.shield_snap ?? 0}
        />
        <MiniStat
          icon={<Ionicons name="sparkles" size={13} color={theme.primary} />}
          label="Thói quen"
          value={`${Math.round(habit?.habit_snap ?? 0)}%`}
        />
      </View>
    </LinearGradient>
  );
};
