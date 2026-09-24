import { ScrollView, StatusBar, View } from "react-native";

import { SettingsItem } from "@/components/settings/SettingsItem";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { SettingsSwitchItem } from "@/components/settings/SettingsSwitchItem";
import { SettingsValueItem } from "@/components/settings/SettingsValueItem";
import { ThemedText } from "@/components/themed-text";

import { SettingsAccountCard } from "@/components/settings/SettingsAccountCard";
import ThemeBottomSheet from "@/components/settings/ThemeBottomSheet";
import { useDBService } from "@/hooks/useDBService";
import { useBottomSheet } from "@/provider/BottomSheet";
import { useAppStore } from "@/stores/appStore";
import { capitalize } from "@/util/text";
import { useState } from "react";

export default function SettingsScreen() {
  const { theme, settings, updateSetting, toggleDarkMode, updateTheme } =
    useAppStore();
  const { present } = useBottomSheet();

  const [darkMode, setDarkMode] = useState(settings?.is_dark_mode ?? true);
  const dbService = useDBService();

  const openThemeModal = () => {
    present(
      <ThemeBottomSheet
        currentThemeId={settings?.theme || "default"}
        isDarkMode={darkMode}
        onSelect={(themeId: string) => {
          updateTheme(dbService, themeId);
        }}
      />,
      {
        snapPoints: ["100%"],
      },
    );
  };

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingTop: StatusBar.currentHeight || 0 }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 10,
          //   paddingTop: 20,
          paddingBottom: 40,
        }}
      >
        {/* Header */}
        <View className="pb-6">
          <View className="flex-row items-center">
            {/* <Feather name="settings" size={22} color={theme.primary} /> */}

            <ThemedText size="xxxl" weight="semibold">
              Settings
            </ThemedText>
          </View>
        </View>

        {/* Account */}
        <SettingsAccountCard
          name={undefined}
          email={undefined}
          onPress={() => {
            // TODO: account screen
          }}
        />

        {/* Appearance */}
        <SettingsSection title="Appearance">
          <SettingsSwitchItem
            icon="moon"
            title="Dark mode"
            description="Use dark appearance throughout the app"
            value={darkMode}
            onChange={(value) => {
              setDarkMode(value);
              toggleDarkMode(dbService);
            }}
          />

          <SettingsValueItem
            icon="droplet"
            title="Theme"
            value={capitalize(settings?.theme || "default")}
            onPress={() => {
              openThemeModal();
              // TODO: open Theme BottomSheet
            }}
          />

          <SettingsValueItem
            icon="zap"
            title="Effects"
            value="Default"
            onPress={() => {
              // TODO: open Effects BottomSheet
            }}
          />

          <SettingsValueItem
            icon="type"
            title="Font family"
            value="System"
            onPress={() => {
              // TODO
            }}
          />
        </SettingsSection>

        {/* General */}
        <SettingsSection title="General">
          <SettingsValueItem
            icon="globe"
            title="Language"
            value="Tiếng Việt"
            onPress={() => {
              // TODO
            }}
          />

          <SettingsValueItem
            icon="calendar"
            title="Week starts on"
            value="Monday"
            onPress={() => {
              // TODO
            }}
          />
        </SettingsSection>

        {/* Sound */}
        <SettingsSection title="Sound & Haptics">
          <SettingsSwitchItem
            icon="smartphone"
            title="Vibration"
            value={true}
            onChange={() => {}}
          />

          <SettingsSwitchItem
            icon="volume-2"
            title="Sound"
            description="Enable app sounds"
            value={true}
            onChange={() => {}}
          />

          <SettingsValueItem
            icon="music"
            title="Background music"
            value="Default"
            onPress={() => {}}
          />

          <SettingsValueItem
            icon="bell"
            title="Notification sound"
            value="Chime"
            onPress={() => {}}
          />

          <SettingsSwitchItem
            icon="mouse-pointer"
            title="Touch sound"
            value={true}
            onChange={() => {}}
          />
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection title="Notifications">
          <SettingsSwitchItem
            icon="check-circle"
            title="Target reached"
            description="Notify when your fasting target is reached"
            value={true}
            onChange={() => {}}
          />

          <SettingsValueItem
            icon="clock"
            title="Daily reminder"
            value="Off"
            onPress={() => {}}
          />
        </SettingsSection>

        {/* Data */}
        <SettingsSection title="Data">
          <SettingsValueItem
            icon="database"
            title="Backup & Restore"
            description="Export or import your data"
            value=""
            onPress={() => {}}
          />

          <SettingsItem
            icon="refresh-cw"
            title="Reset settings"
            description="Restore app settings to default"
            danger
            showChevron
            onPress={() => {}}
          />
        </SettingsSection>

        {/* Privacy */}
        <SettingsSection title="Privacy">
          <SettingsValueItem
            icon="lock"
            title="Privacy"
            description="Privacy and data permissions"
            value=""
            onPress={() => {}}
          />
        </SettingsSection>

        {/* About */}
        <SettingsSection title="About">
          <SettingsValueItem
            icon="star"
            title="Rate the app"
            description="Enjoying the app? Leave a rating"
            value=""
            onPress={() => {
              // TODO: open store rating
            }}
          />

          <SettingsValueItem
            icon="message-circle"
            title="Feedback"
            description="Tell us what you think or report a problem"
            value=""
            onPress={() => {
              // TODO: open feedback
            }}
          />

          <SettingsValueItem
            icon="info"
            title="About us"
            value=""
            onPress={() => {}}
          />

          <View className="items-center border-t border-text-base/5 py-4">
            <ThemedText size="xs" color="text" opacity="low">
              Version 1.0.0
            </ThemedText>
          </View>
        </SettingsSection>
      </ScrollView>
    </View>
  );
}
