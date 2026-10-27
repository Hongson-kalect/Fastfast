import { useAppStore } from "@/stores/appStore";
import { feedback } from "@/utils/feedback";
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
  const theme = useAppStore((state) => state.theme);

  const handleChange = (next: boolean) => {
    onChange(next);
    feedback("toggle");
  };

  return (
    <SettingsItem
      icon={icon}
      title={title}
      description={description}
      showChevron={false}
      onPress={() => handleChange(!value)}
    >
      <Switch
        value={value}
        onValueChange={handleChange}
        trackColor={{
          false: theme.text + "25",
          true: theme.primary + "80",
        }}
        thumbColor={value ? theme.primary : theme.text + "AA"}
      />
    </SettingsItem>
  );
}
