import { Alert, Linking, ScrollView, View } from "react-native";

import { SettingsItem } from "@/components/settings/SettingsItem";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { SettingsSwitchItem } from "@/components/settings/SettingsSwitchItem";
import { SettingsValueItem } from "@/components/settings/SettingsValueItem";
import { ThemedText } from "@/components/themed-text";

import { SettingsAccountCard } from "@/components/settings/SettingsAccountCard";
import ThemeBottomSheet from "@/components/settings/ThemeBottomSheet";
import { ThemeKey } from "@/constants/themes";
import { useDBService } from "@/hooks/useDBService";
import { AppSettings } from "@/interfaces/db.type";
import { useBottomSheet } from "@/providers/BottomSheet";
import { useT } from "@/providers/Language";
import { reloadAppData, toggleDarkMode, updateTheme } from "@/stores/appAction";
import { useAppStore } from "@/stores/appStore";
import {
  exportBackup,
  pickBackup,
  resetSettings,
  restoreBackup,
} from "@/utils/backup";
import { feedback } from "@/utils/feedback";
import {
  cancelTargetReached,
  ensureNotificationPermission,
  formatReminderTime,
  isNotificationSupported,
  scheduleTargetReached,
  setDailyReminder,
} from "@/utils/notifications";
import { capitalize } from "@/utils/text";
import DateTimePicker from "@react-native-community/datetimepicker";
import Constants from "expo-constants";
import * as StoreReview from "expo-store-review";
import { useSQLiteContext } from "expo-sqlite";
import i18n from "i18next";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Điền email hỗ trợ trước khi phát hành; để trống thì người dùng tự nhập người nhận
const FEEDBACK_EMAIL = "";
const DEFAULT_REMINDER = { hour: 20, minute: 0 };

const LANGUAGES = [
  { value: "vi", label: "Tiếng Việt" },
  { value: "en", label: "English" },
];

const WEEK_STARTS = [
  { value: "monday", label: "Monday" },
  { value: "sunday", label: "Sunday" },
] as const;

export default function SettingsScreen() {
  const { settings, updateSetting, currentFastSession } = useAppStore();
  const { present } = useBottomSheet();
  const t = useT();

  const [isDarkMode, setIsDarkMode] = useState(settings?.is_dark_mode ?? true);
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const db = useSQLiteContext();
  const dbService = useDBService();

  const version = Constants.expoConfig?.version ?? "1.0.0";
  const reminder = settings?.daily_reminder ?? null;

  // Lưu một cài đặt vào DB + store
  const saveSetting = async <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K],
  ) => {
    updateSetting({ [key]: value } as Partial<AppSettings>);
    await dbService.setting(key, value);
  };

  const chooseOption = <T extends string>(
    title: string,
    options: readonly { value: T; label: string }[],
    onSelect: (value: T) => void,
  ) => {
    Alert.alert(title, undefined, [
      ...options.map((option) => ({
        text: option.label,
        onPress: () => onSelect(option.value),
      })),
      { text: "Cancel", style: "cancel" as const },
    ]);
  };

  const openThemeModal = () => {
    present(
      <ThemeBottomSheet
        currentThemeId={settings?.theme || "default"}
        isDarkMode={isDarkMode}
        onSelect={(themeId: ThemeKey) => {
          updateTheme(db, themeId);
        }}
      />,
      {
        snapPoints: ["100%"],
      },
    );
  };

  const handleLanguage = () =>
    chooseOption("Language", LANGUAGES, async (value) => {
      await saveSetting("language", value);
      i18n.changeLanguage(value);
    });

  const handleWeekStart = () =>
    chooseOption("Week starts on", WEEK_STARTS, (value) =>
      saveSetting("week_starts_on", value),
    );

  const showNotificationUnsupported = () =>
    Alert.alert(
      "Not available in Expo Go",
      "Notifications need a development or store build of FastFast.",
    );

  const handleTargetNotification = async (value: boolean) => {
    if (value && !isNotificationSupported) {
      showNotificationUnsupported();
      return;
    }

    if (value && !(await ensureNotificationPermission())) {
      Alert.alert(
        "Notifications are off",
        "Allow notifications for FastFast in system settings.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open settings", onPress: () => Linking.openSettings() },
        ],
      );
      return;
    }

    await saveSetting("notify_target_reached", value);

    // Áp dụng ngay cho phiên đang chạy
    if (value && currentFastSession && !currentFastSession.end_time) {
      scheduleTargetReached(dbService, currentFastSession);
    } else if (!value) {
      cancelTargetReached(dbService);
    }
  };

  const handleDailyReminder = async (value: boolean) => {
    if (value && !isNotificationSupported) {
      showNotificationUnsupported();
      return;
    }

    const ok = await setDailyReminder(dbService, value ? (reminder ?? DEFAULT_REMINDER) : null);
    if (!ok) {
      Alert.alert(
        "Notifications are off",
        "Allow notifications for FastFast in system settings.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open settings", onPress: () => Linking.openSettings() },
        ],
      );
    }
  };

  const handleReminderTime = (_event: unknown, date?: Date) => {
    setShowReminderPicker(false);
    if (!date) return;
    setDailyReminder(dbService, { hour: date.getHours(), minute: date.getMinutes() });
  };

  const handleExport = async () => {
    try {
      await exportBackup(db);
    } catch (e) {
      console.warn("export backup error", e);
      feedback("error");
      Alert.alert("Backup failed", "Could not create the backup file.");
    }
  };

  const handleImport = async () => {
    try {
      const backup = await pickBackup();
      if (!backup) return;

      Alert.alert(
        "Restore backup?",
        `Backup from ${new Date(backup.exportedAt).toLocaleString()}. All current data on this device will be replaced.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Restore",
            style: "destructive",
            onPress: async () => {
              await restoreBackup(db, backup);
              await reloadAppData(db);
              // Id thông báo không được khôi phục → lên lịch lại
              const restored = useAppStore.getState().settings?.daily_reminder;
              if (restored) await setDailyReminder(dbService, restored);
              feedback("fastComplete");
              Alert.alert("Restored", "Your data has been restored.");
            },
          },
        ],
      );
    } catch (e) {
      console.warn("import backup error", e);
      feedback("error");
      Alert.alert("Restore failed", "This file is not a valid FastFast backup.");
    }
  };

  const handleBackup = () =>
    Alert.alert("Backup & Restore", "Your data is stored only on this device.", [
      { text: "Export backup", onPress: handleExport },
      { text: "Restore from file", onPress: handleImport },
      { text: "Cancel", style: "cancel" },
    ]);

  const handleResetSettings = () =>
    Alert.alert(
      "Reset settings?",
      "Theme, layout, sound and notification settings go back to default. Your fasting data is kept.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            await setDailyReminder(dbService, null);
            await cancelTargetReached(dbService);
            await resetSettings(db);
            await reloadAppData(db);
            setIsDarkMode(useAppStore.getState().settings?.is_dark_mode ?? true);
          },
        },
      ],
    );

  const handleRate = async () => {
    try {
      if (await StoreReview.hasAction()) {
        await StoreReview.requestReview();
        return;
      }
    } catch (e) {
      console.warn("store review error", e);
    }
    Alert.alert("Thank you!", "Rating will be available once the app is on the store.");
  };

  const handleFeedback = () => {
    const subject = encodeURIComponent(`FastFast ${version} feedback`);
    Linking.openURL(`mailto:${FEEDBACK_EMAIL}?subject=${subject}`).catch(() =>
      Alert.alert("No email app", "Please install an email app to send feedback."),
    );
  };

  const inset = useSafeAreaInsets();

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingTop: inset.top, paddingBottom: inset.bottom }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 10,
          paddingBottom: 40,
        }}
      >
        {/* Header */}
        <View className="pb-6">
          <View className="flex-row items-center">
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
            value={isDarkMode}
            onChange={(value) => {
              setIsDarkMode(value);
              toggleDarkMode(db);
            }}
          />

          <SettingsValueItem
            icon="droplet"
            title="Theme"
            value={capitalize(settings?.theme || "default")}
            onPress={openThemeModal}
          />
        </SettingsSection>

        {/* General */}
        <SettingsSection title="General">
          <SettingsValueItem
            icon="globe"
            title="Language"
            value={
              LANGUAGES.find((lang) => lang.value === (settings?.language || i18n.language))
                ?.label ?? "English"
            }
            onPress={handleLanguage}
          />

          <SettingsValueItem
            icon="calendar"
            title="Week starts on"
            value={settings?.week_starts_on === "sunday" ? "Sunday" : "Monday"}
            onPress={handleWeekStart}
          />
        </SettingsSection>

        {/* Sound */}
        <SettingsSection title="Sound & Haptics">
          <SettingsSwitchItem
            icon="smartphone"
            title="Vibration"
            value={settings?.vibration_enabled ?? true}
            onChange={(value) => saveSetting("vibration_enabled", value)}
          />

          <SettingsSwitchItem
            icon="volume-2"
            title="Sound"
            description="Sounds for starting, finishing and rewards"
            value={settings?.sound_enabled ?? true}
            onChange={(value) => saveSetting("sound_enabled", value)}
          />

          <SettingsSwitchItem
            icon="mouse-pointer"
            title="Touch sound"
            description="Short clicks for taps and toggles"
            value={settings?.touch_sound_enabled ?? true}
            onChange={(value) => saveSetting("touch_sound_enabled", value)}
          />
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection title="Notifications">
          <SettingsSwitchItem
            icon="check-circle"
            title="Target reached"
            description="Notify when your fasting target is reached"
            value={isNotificationSupported && (settings?.notify_target_reached ?? true)}
            onChange={handleTargetNotification}
          />

          <SettingsSwitchItem
            icon="bell"
            title="Daily reminder"
            description="A reminder to start your fast every day"
            value={!!reminder}
            onChange={handleDailyReminder}
          />

          {reminder && (
            <SettingsValueItem
              icon="clock"
              title="Reminder time"
              value={formatReminderTime(reminder)}
              onPress={() => setShowReminderPicker(true)}
            />
          )}
        </SettingsSection>

        {showReminderPicker && (
          <DateTimePicker
            value={new Date(2000, 0, 1, reminder?.hour ?? 20, reminder?.minute ?? 0)}
            mode="time"
            is24Hour
            onValueChange={handleReminderTime}
          />
        )}

        {/* Data */}
        <SettingsSection title="Data">
          <SettingsValueItem
            icon="database"
            title="Backup & Restore"
            description="Export or import your data"
            value=""
            onPress={handleBackup}
          />

          <SettingsItem
            icon="refresh-cw"
            title="Reset settings"
            description="Restore app settings to default"
            danger
            showChevron
            onPress={handleResetSettings}
          />
        </SettingsSection>

        {/* Privacy */}
        <SettingsSection title="Privacy & Health">
          <SettingsValueItem
            icon="lock"
            title="Privacy"
            description="Privacy and data permissions"
            value=""
            onPress={() =>
              Alert.alert(
                "Privacy",
                "FastFast works offline. Your fasts, notes and weight are stored only on this device and are never sent to a server. Backups are files you export and keep yourself.",
              )
            }
          />

          <SettingsValueItem
            icon="heart"
            title="Health disclaimer"
            value=""
            onPress={() =>
              Alert.alert(t("onboarding.health.title"), t("onboarding.health.body"))
            }
          />
        </SettingsSection>

        {/* About */}
        <SettingsSection title="About">
          <SettingsValueItem
            icon="star"
            title="Rate the app"
            description="Enjoying the app? Leave a rating"
            value=""
            onPress={handleRate}
          />

          <SettingsValueItem
            icon="message-circle"
            title="Feedback"
            description="Tell us what you think or report a problem"
            value=""
            onPress={handleFeedback}
          />

          <SettingsValueItem
            icon="info"
            title="About"
            value=""
            onPress={() =>
              Alert.alert(
                "FastFast",
                `Version ${version}\n\nIntermittent fasting with streaks, shields and a year in pixels.`,
              )
            }
          />

          <View className="items-center border-t border-text-base/5 py-4">
            <ThemedText size="xs" color="text" opacity="low">
              Version {version}
            </ThemedText>
          </View>
        </SettingsSection>
      </ScrollView>
    </View>
  );
}
