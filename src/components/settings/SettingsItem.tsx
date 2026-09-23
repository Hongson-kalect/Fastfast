import { ThemedText } from "@/components/themed-text";
import { useAppStore } from "@/stores/appStore";
import { Feather } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

type IconName = keyof typeof Feather.glyphMap;

type Props = {
  icon: IconName;
  title: string;
  description?: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  showChevron?: boolean;
  children?: React.ReactNode;
};

export function SettingsItem({
  icon,
  title,
  description,
  value,
  onPress,
  danger = false,
  showChevron = true,
  children,
}: Props) {
  const { theme } = useAppStore();

  const content = (
    <View className="min-h-14 flex-row items-center px-4 py-3">
      <View
        className={`mr-3 h-9 w-9 items-center justify-center rounded-xl ${
          danger ? "bg-error/10" : "bg-text-base/5"
        }`}
      >
        <Feather
          name={icon}
          size={16}
          color={danger ? theme.error : theme.text}
        />
      </View>

      <View className="min-w-0 flex-1">
        <ThemedText size="sm" weight="medium" color={danger ? "error" : "text"}>
          {title}
        </ThemedText>

        {description && (
          <ThemedText
            size="xs"
            color="text"
            opacity="low"
            numberOfLines={2}
            className="mt-0.5"
          >
            {description}
          </ThemedText>
        )}
      </View>

      {value && (
        <ThemedText
          size="sm"
          color="text"
          opacity="medium"
          numberOfLines={1}
          className="ml-2 max-w-[35%]"
        >
          {value}
        </ThemedText>
      )}

      {children}

      {showChevron && onPress && (
        <Feather
          name="chevron-right"
          size={18}
          color={theme.text + "55"}
          style={{ marginLeft: 8 }}
        />
      )}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{
        color: theme.primary + "20",
      }}
      style={({ pressed }) => ({
        opacity: pressed ? 0.75 : 1,
      })}
    >
      {content}
    </Pressable>
  );
}
