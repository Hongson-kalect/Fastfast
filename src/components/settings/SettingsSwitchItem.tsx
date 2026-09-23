import { useAppStore } from "@/stores/appStore";
import { Switch } from "react-native";
import { SettingsItem } from "./SettingsItem";

type Props = {
  icon: React.ComponentProps<typeof SettingsItem>["icon"];
  title: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
};

export function SettingsSwitchItem({
  icon,
  title,
  description,
  value,
  onChange,
}: Props) {
  const { theme } = useAppStore();

  return (
    <SettingsItem
      icon={icon}
      title={title}
      description={description}
      showChevron={false}
      onPress={() => onChange(!value)}
    >
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{
          false: theme.text + "25",
          true: theme.primary + "80",
        }}
        thumbColor={value ? theme.primary : theme.text + "AA"}
      />
    </SettingsItem>
  );
}
