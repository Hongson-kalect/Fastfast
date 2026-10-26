import { RADIUS } from "@/constants/design";
import { useAppStore } from "@/stores/appStore";
import React from "react";
import { View } from "react-native";
import { SectionTitle } from "../SectionTitle";

type Props = {
  title: string;
  children: React.ReactNode;
};

export function SettingsSection({ title, children }: Props) {
  const { theme } = useAppStore();
  const items = React.Children.toArray(children).filter(Boolean);

  return (
    <View className="mb-6">
      <SectionTitle title={title} />

      <View
        className="overflow-hidden bg-card"
        style={{
          borderRadius: RADIUS.lg,
          borderWidth: 1,
          borderColor: theme.text + "0F",
        }}
      >
        {items.map((child, index) => (
          <View key={index}>
            {index > 0 && (
              <View
                className="ml-16 h-px"
                style={{ backgroundColor: theme.text + "0D" }}
              />
            )}
            {child}
          </View>
        ))}
      </View>
    </View>
  );
}
