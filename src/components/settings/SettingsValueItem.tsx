import { SettingsItem } from "./SettingsItem";

type Props = {
  icon: React.ComponentProps<typeof SettingsItem>["icon"];
  title: string;
  description?: string;
  value: string;
  onPress: () => void;
};

export function SettingsValueItem(props: Props) {
  return <SettingsItem {...props} />;
}