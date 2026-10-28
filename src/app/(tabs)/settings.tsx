import { TAB_BAR_SPACE } from "@/constants/design";
import { Linking, Pressable, ScrollView, View } from "react-native";

import { SettingsItem } from "@/components/settings/SettingsItem";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { SettingsSwitchItem } from "@/components/settings/SettingsSwitchItem";
import { SettingsValueItem } from "@/components/settings/SettingsValueItem";
import { ThemedText } from "@/components/themed-text";

import AchievementBadge, {
  achievementItemTitle,
  achievementName,
} from "@/components/AchievementBadge";
import AchievementShowcase, {
  SHOWCASE_LIMIT,
} from "@/components/AchievementShowcase";
import { SettingsAccountCard } from "@/components/settings/SettingsAccountCard";
import { BackupSheet } from "@/components/settings/BackupSheet";
import { ACHIEVEMENTS } from "@/constants/achievements";
import ThemeBottomSheet from "@/components/settings/ThemeBottomSheet";
import { ThemeKey, themes } from "@/constants/themes";
import { useDBService } from "@/hooks/useDBService";
import { AppSettings } from "@/interfaces/db.type";
import { useBottomSheet } from "@/providers/BottomSheet";
import { SUPPORTED_LANGUAGES, useT } from "@/providers/Language";
import { reloadAppData, toggleDarkMode, updateTheme } from "@/stores/appAction";
import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import { resetSettings } from "@/utils/backup";
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
import { getDriveBackupTime } from "@/utils/driveBackup";
import { GoogleAccount, getSignedInAccount } from "@/utils/googleAuth";
import DateTimePicker from "@react-native-community/datetimepicker";
import Constants from "expo-constants";
import * as StoreReview from "expo-store-review";
import { useSQLiteContext } from "expo-sqlite";
import i18n from "i18next";
import { useEffect, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useShallow } from "zustand/react/shallow";

// Điền email hỗ trợ trước khi phát hành; để trống thì người dùng tự nhập người nhận
const FEEDBACK_EMAIL = "";
const DEFAULT_REMINDER = { hour: 20, minute: 0 };


const WEEK_STARTS = ["monday", "sunday"] as const;

export default function SettingsScreen() {
  const { settings, updateSetting, currentFastSession, userProfile } = useAppStore(
    useShallow((state) => ({
      settings: state.settings,
      updateSetting: state.updateSetting,
      currentFastSession: state.currentFastSession,
      userProfile: state.userProfile,
    })),
  );
  const { present } = useBottomSheet();
  const addModal = useModalStore((state) => state.addModal);
  const t = useT();

  const [isDarkMode, setIsDarkMode] = useState(settings?.is_dark_mode ?? true);
  const [showReminderPicker, setShowReminderPicker] = useState(false);

  // Tài khoản Google và lần sao lưu Drive gần nhất, chỉ để hiển thị;
  // thao tác sao lưu nằm trong BackupSheet
  const [account, setAccount] = useState<GoogleAccount | null>(null);
  const [lastDriveBackup, setLastDriveBackup] = useState<Date | null>(null);

  useEffect(() => {
    getSignedInAccount().then((signedIn) => {
      setAccount(signedIn);
      if (signedIn) {
        getDriveBackupTime()
          .then(setLastDriveBackup)
          .catch(() => setLastDriveBackup(null));
      }
    });
  }, []);
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

  // Chọn một giá trị qua radio modal dùng chung
  const chooseOption = <T extends string>(
    title: string,
    options: readonly { value: T; label: string; description?: string }[],
    value: T,
    onSelect: (value: T) => void,
  ) => {
    addModal({
      type: "radio",
      title,
      options: [...options],
      value,
      onSelect: (selected) => onSelect(selected as T),
    });
  };

  // Theme có bộ icon riêng mà người dùng đang dùng bộ khác: hỏi có đổi theo không
  const offerThemeIcons = (themeId: ThemeKey) => {
    const packs = themes[themeId].iconPacks;
    if (!packs) return;

    const changes: Partial<AppSettings> = {};
    if (packs.emotion && packs.emotion !== (settings?.emotion_pack || "default")) {
      changes.emotion_pack = packs.emotion;
    }
    if (packs.target && packs.target !== (settings?.target_pack || "default")) {
      changes.target_pack = packs.target;
    }
    if (!Object.keys(changes).length) return;

    addModal({
      type: "confirm",
      title: t("theme.iconsTitle"),
      message: t("theme.iconsBody", { theme: capitalize(String(themeId)) }),
      okText: t("theme.iconsUse"),
      cancelText: t("theme.iconsKeep"),
      onOk: async () => {
        if (changes.emotion_pack) await saveSetting("emotion_pack", changes.emotion_pack);
        if (changes.target_pack) await saveSetting("target_pack", changes.target_pack);
      },
    });
  };

  const openThemeModal = () => {
    present(
      <ThemeBottomSheet
        currentThemeId={settings?.theme || "default"}
        isDarkMode={isDarkMode}
        onSelect={(themeId: ThemeKey) => {
          updateTheme(db, themeId);
          offerThemeIcons(themeId);
        }}
      />,
      {
        snapPoints: ["100%"],
      },
    );
  };

  const handleLanguage = () =>
    chooseOption(
      t("settings.language"),
      SUPPORTED_LANGUAGES,
      settings?.language || i18n.language,
      async (value) => {
        await saveSetting("language", value);
        await i18n.changeLanguage(value);
        // Thông báo đã lên lịch giữ chữ lúc tạo: lên lịch lại theo ngôn ngữ mới
        if (reminder) setDailyReminder(dbService, reminder);
        if (currentFastSession && !currentFastSession.end_time) {
          scheduleTargetReached(dbService, currentFastSession);
        }
      },
    );

  // Mỗi thành tựu chỉ đưa ra huy hiệu cao nhất đã nhận để chọn khoe
  const handleShowcase = async () => {
    const milestones = userProfile?.id
      ? await dbService.getUserMilestones(userProfile.id)
      : [];
    const confirmed = new Set(
      milestones
        .filter((item) => item.is_confirmed === 1)
        .map((item) => item.achievement_item_id),
    );

    const options = ACHIEVEMENTS.flatMap((achievement) => {
      const item = [...achievement.items]
        .reverse()
        .find((entry) => confirmed.has(entry.id));
      if (!item) return [];
      return [
        {
          value: item.id,
          label: achievementName(achievement),
          description: achievementItemTitle(achievement, item),
          icon: (
            <AchievementBadge achievement={achievement} item={item} size={40} />
          ),
        },
      ];
    });

    if (!options.length) {
      addModal({
        type: "alert",
        title: t("settings.section.showcase"),
        message: t("settings.showcaseEmpty"),
      });
      return;
    }

    addModal({
      type: "checkbox",
      title: t("settings.section.showcase"),
      message: t("settings.showcasePick", { max: SHOWCASE_LIMIT }),
      options,
      values: (settings?.showcase_achievements ?? []).filter((id) =>
        confirmed.has(id),
      ),
      max: SHOWCASE_LIMIT,
      okText: t("common.save"),
      onConfirm: (values) =>
        saveSetting("showcase_achievements", values as string[]),
    });
  };

  const handleWeekStart = () =>
    chooseOption(
      t("settings.weekStart"),
      WEEK_STARTS.map((value) => ({
        value,
        label: t(`settings.${value}`),
        description: t(`settings.${value}Desc`),
      })),
      settings?.week_starts_on ?? "monday",
      (value) => saveSetting("week_starts_on", value),
    );

  const showNotificationUnsupported = () =>
    addModal({
      type: "alert",
      title: t("settings.expoGoTitle"),
      message: t("settings.expoGoBody"),
    });

  const showNotificationsOff = () =>
    addModal({
      type: "confirm",
      title: t("settings.notifOffTitle"),
      message: t("settings.notifOffBody"),
      okText: t("settings.openSettings"),
      onOk: () => {
        Linking.openSettings();
      },
    });

  const handleTargetNotification = async (value: boolean) => {
    if (value && !isNotificationSupported) {
      showNotificationUnsupported();
      return;
    }

    if (value && !(await ensureNotificationPermission())) {
      showNotificationsOff();
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
    if (!ok) showNotificationsOff();
  };

  const handleReminderTime = (_event: unknown, date?: Date) => {
    setShowReminderPicker(false);
    if (!date) return;
    setDailyReminder(dbService, { hour: date.getHours(), minute: date.getMinutes() });
  };

  const openBackupSheet = () =>
    present(
      <BackupSheet
        onAccountChange={setAccount}
        onBackupTimeChange={setLastDriveBackup}
        onRestored={() =>
          setIsDarkMode(useAppStore.getState().settings?.is_dark_mode ?? true)
        }
      />,
    );

  const handleResetSettings = () =>
    addModal({
      type: "confirm",
      title: t("settings.resetConfirmTitle"),
      message: t("settings.resetConfirmBody"),
      okText: t("settings.resetOk"),
      onOk: async () => {
        await setDailyReminder(dbService, null);
        await cancelTargetReached(dbService);
        await resetSettings(db);
        await reloadAppData(db);
        setIsDarkMode(useAppStore.getState().settings?.is_dark_mode ?? true);
      },
    });

  const handleRate = async () => {
    try {
      if (await StoreReview.hasAction()) {
        await StoreReview.requestReview();
        return;
      }
    } catch (e) {
      console.warn("store review error", e);
    }
    addModal({
      type: "alert",
      title: t("settings.rateThanks"),
      message: t("settings.rateLater"),
    });
  };

  const handleFeedback = () => {
    const subject = encodeURIComponent(`FastFast ${version} feedback`);
    Linking.openURL(`mailto:${FEEDBACK_EMAIL}?subject=${subject}`).catch(() =>
      addModal({
        type: "alert",
        title: t("settings.noEmailTitle"),
        message: t("settings.noEmailBody"),
      }),
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
          paddingHorizontal: 20,
          paddingBottom: TAB_BAR_SPACE,
        }}
      >
        {/* Header */}
        <View className="pb-6">
          <View className="flex-row items-center">
            <ThemedText size="xxxl" weight="semibold">
              {t("settings.title")}
            </ThemedText>
          </View>
        </View>

        {/* Account */}
        <SettingsAccountCard
          name={account?.name ?? undefined}
          email={account?.email}
          onPress={openBackupSheet}
        />

        {/* Showcase */}
        <SettingsSection title={t("settings.section.showcase")}>
          <Pressable onPress={handleShowcase} className="px-4 py-4 active:opacity-80">
            <AchievementShowcase
              itemIds={settings?.showcase_achievements ?? []}
              showEmpty
            />
          </Pressable>

          <SettingsSwitchItem
            icon="image"
            title={t("settings.showcaseExport")}
            description={t("settings.showcaseExportDesc")}
            value={settings?.showcase_in_export ?? true}
            onChange={(value) => saveSetting("showcase_in_export", value)}
          />
        </SettingsSection>

        {/* Appearance */}
        <SettingsSection title={t("settings.section.appearance")}>
          <SettingsSwitchItem
            icon="moon"
            title={t("settings.darkMode")}
            description={t("settings.darkModeDesc")}
            value={isDarkMode}
            onChange={(value) => {
              setIsDarkMode(value);
              toggleDarkMode(db);
            }}
          />

          <SettingsValueItem
            icon="droplet"
            title={t("settings.theme")}
            value={capitalize(settings?.theme || "default")}
            onPress={openThemeModal}
          />
        </SettingsSection>

        {/* General */}
        <SettingsSection title={t("settings.section.general")}>
          <SettingsValueItem
            icon="globe"
            title={t("settings.language")}
            value={
              SUPPORTED_LANGUAGES.find((lang) => lang.value === (settings?.language || i18n.language))
                ?.label ?? "English"
            }
            onPress={handleLanguage}
          />

          <SettingsValueItem
            icon="calendar"
            title={t("settings.weekStart")}
            value={t(`settings.${settings?.week_starts_on === "sunday" ? "sunday" : "monday"}`)}
            onPress={handleWeekStart}
          />

          <SettingsSwitchItem
            icon="help-circle"
            title={t("settings.beginnerTips")}
            description={t("settings.beginnerTipsDesc")}
            value={settings?.beginner_tips ?? true}
            onChange={(value) => saveSetting("beginner_tips", value)}
          />
        </SettingsSection>

        {/* Sound */}
        <SettingsSection title={t("settings.section.sound")}>
          <SettingsSwitchItem
            icon="smartphone"
            title={t("settings.vibration")}
            value={settings?.vibration_enabled ?? true}
            onChange={(value) => saveSetting("vibration_enabled", value)}
          />

          <SettingsSwitchItem
            icon="volume-2"
            title={t("settings.sound")}
            description={t("settings.soundDesc")}
            value={settings?.sound_enabled ?? true}
            onChange={(value) => saveSetting("sound_enabled", value)}
          />

          <SettingsSwitchItem
            icon="mouse-pointer"
            title={t("settings.touchSound")}
            description={t("settings.touchSoundDesc")}
            value={settings?.touch_sound_enabled ?? true}
            onChange={(value) => saveSetting("touch_sound_enabled", value)}
          />
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection title={t("settings.section.notifications")}>
          <SettingsSwitchItem
            icon="check-circle"
            title={t("settings.targetReached")}
            description={t("settings.targetReachedDesc")}
            value={isNotificationSupported && (settings?.notify_target_reached ?? true)}
            onChange={handleTargetNotification}
          />

          <SettingsSwitchItem
            icon="bell"
            title={t("settings.dailyReminder")}
            description={t("settings.dailyReminderDesc")}
            value={!!reminder}
            onChange={handleDailyReminder}
          />

          {reminder && (
            <SettingsValueItem
              icon="clock"
              title={t("settings.reminderTime")}
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
        <SettingsSection title={t("settings.section.data")}>
          <SettingsValueItem
            icon="database"
            title={t("settings.backup")}
            description={t("settings.backupDesc")}
            value={lastDriveBackup ? lastDriveBackup.toLocaleDateString(i18n.language) : ""}
            onPress={openBackupSheet}
          />

          <SettingsItem
            icon="refresh-cw"
            title={t("settings.reset")}
            description={t("settings.resetDesc")}
            danger
            showChevron
            onPress={handleResetSettings}
          />
        </SettingsSection>

        {/* About */}
        <SettingsSection title={t("settings.section.about")}>
          <SettingsValueItem
            icon="lock"
            title={t("settings.privacy")}
            description={t("settings.privacyDesc")}
            value=""
            onPress={() =>
              addModal({
                type: "alert",
                title: t("settings.privacy"),
                message: t("settings.privacyBody"),
              })
            }
          />

          <SettingsValueItem
            icon="heart"
            title={t("settings.health")}
            value=""
            onPress={() =>
              addModal({
                type: "alert",
                title: t("onboarding.health.title"),
                message: t("onboarding.health.body"),
              })
            }
          />

          <SettingsValueItem
            icon="star"
            title={t("settings.rate")}
            description={t("settings.rateDesc")}
            value=""
            onPress={handleRate}
          />

          <SettingsValueItem
            icon="message-circle"
            title={t("settings.feedback")}
            description={t("settings.feedbackDesc")}
            value=""
            onPress={handleFeedback}
          />

          <SettingsValueItem
            icon="info"
            title={t("settings.about")}
            value=""
            onPress={() =>
              addModal({
                type: "alert",
                title: "FastFast",
                message: t("settings.aboutBody", { version }),
              })
            }
          />

          <View className="items-center border-t border-text-base/5 py-4">
            <ThemedText size="xs" color="text" opacity="low">
              {t("settings.version", { version })}
            </ThemedText>
          </View>
        </SettingsSection>
      </ScrollView>
    </View>
  );
}
