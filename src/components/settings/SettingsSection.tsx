import { View } from "react-native";
import { ThemedText } from "@/components/themed-text";

type Props = {
  title: string;
  children: React.ReactNode;
};

export function SettingsSection({ title, children }: Props) {
  return (
    <View className="mb-6">
      <ThemedText
        size="xs"
        weight="semibold"
        color="text"
        opacity="medium"
        className="mb-2 px-1"
      >
        {title.toUpperCase()}
      </ThemedText>

      <View className="overflow-hidden rounded-2xl border border-text-base/5 bg-background2">
        {children}
      </View>
    </View>
  );
}