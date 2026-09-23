import { Feather } from "@expo/vector-icons";
import { Pressable, View } from "react-native";
import { useAppStore } from "@/stores/appStore";
import { ThemedText } from "@/components/themed-text";

type Props = {
  name?: string;
  email?: string;
  onPress: () => void;
};

export function SettingsAccountCard({
  name,
  email,
  onPress,
}: Props) {
  const { theme } = useAppStore();

  const isGuest = !email;

  return (
    <Pressable
      onPress={onPress}
      className="mb-6 rounded-2xl border border-primary/20 bg-primary/10 p-4 active:opacity-80"
    >
      <View className="flex-row items-center">
        <View className="h-12 w-12 items-center justify-center rounded-full bg-primary/15">
          <Feather
            name="user"
            size={22}
            color={theme.primary}
          />
        </View>

        <View className="ml-3 flex-1">
          <ThemedText size="md" weight="semibold">
            {isGuest ? "Account" : name || "Account"}
          </ThemedText>

          <ThemedText
            size="xs"
            color="text"
            opacity="medium"
            className="mt-0.5"
          >
            {isGuest
              ? "Sign in to sync your data"
              : email}
          </ThemedText>
        </View>

        <Feather
          name="chevron-right"
          size={20}
          color={theme.text + "66"}
        />
      </View>
    </Pressable>
  );
}