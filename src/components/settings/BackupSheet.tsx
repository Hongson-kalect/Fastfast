import { useDBService } from "@/hooks/useDBService";
import { reloadAppData } from "@/stores/appAction";
import { useAppStore } from "@/stores/appStore";
import { useT } from "@/providers/Language";
import i18n from "i18next";
import useModalStore from "@/stores/modalStore";
import {
  BackupFile,
  exportBackup,
  pickBackup,
  restoreBackup,
} from "@/utils/backup";
import {
  DriveQuotaError,
  backupToDrive,
  fetchDriveBackup,
  getDriveBackupTime,
  restoreFromDrive,
} from "@/utils/driveBackup";
import { feedback } from "@/utils/feedback";
import {
  GoogleAccount,
  getSignedInAccount,
  signInWithGoogle,
  signOutGoogle,
} from "@/utils/googleAuth";
import { setDailyReminder } from "@/utils/notifications";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { ThemedText } from "../themed-text";
import { SettingsItem } from "./SettingsItem";
import { SettingsSection } from "./SettingsSection";

type Props = {
  /** Báo Settings cập nhật thẻ Account và dòng Backup & Restore */
  onAccountChange: (account: GoogleAccount | null) => void;
  onBackupTimeChange: (time: Date | null) => void;
  /** Gọi sau khi khôi phục xong để Settings đồng bộ state cục bộ */
  onRestored: () => void;
};

type Busy = "signin" | "backup" | "restore" | "export" | "import" | null;

/**
 * Sheet gom mọi thao tác sao lưu: Google Drive (tài khoản, sao lưu, khôi phục)
 * và file (xuất / nhập). Tự giữ state vì sheet render ngoài cây của màn Settings.
 */
export const BackupSheet = ({
  onAccountChange,
  onBackupTimeChange,
  onRestored,
}: Props) => {
  const db = useSQLiteContext();
  const dbService = useDBService();
  const addModal = useModalStore((state) => state.addModal);
  const t = useT();

  const [account, setAccount] = useState<GoogleAccount | null>(null);
  const [lastBackup, setLastBackup] = useState<Date | null>(null);
  const [busy, setBusy] = useState<Busy>(null);

  const updateAccount = (next: GoogleAccount | null) => {
    setAccount(next);
    onAccountChange(next);
  };

  const updateLastBackup = (next: Date | null) => {
    setLastBackup(next);
    onBackupTimeChange(next);
  };

  const loadBackupTime = () =>
    getDriveBackupTime()
      .then(updateLastBackup)
      .catch(() => updateLastBackup(null));

  useEffect(() => {
    getSignedInAccount().then((signedIn) => {
      setAccount(signedIn);
      if (signedIn) loadBackupTime();
    });
  }, []);

  const showError = (title: string, message: string) => {
    feedback("error");
    addModal({ type: "alert", title, message });
  };

  // Nạp lại dữ liệu sau khi khôi phục (từ Drive hoặc file)
  const afterRestore = async () => {
    await reloadAppData(db);
    // Id thông báo không được khôi phục → lên lịch lại
    const reminder = useAppStore.getState().settings?.daily_reminder;
    if (reminder) await setDailyReminder(dbService, reminder);
    onRestored();
    feedback("fastComplete");
  };

  // Giải thích trước khi Google hiện màn xin quyền, để người dùng không bất ngờ
  const confirmDriveAccess = () =>
    new Promise<boolean>((resolve) =>
      addModal({
        type: "confirm",
        title: t("backup.permTitle"),
        message: t("backup.permBody"),
        okText: t("backup.permContinue"),
        cancelText: t("backup.permLater"),
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
        onDismiss: () => resolve(false),
      }),
    );

  const signIn = async (): Promise<GoogleAccount | null> => {
    if (!(await confirmDriveAccess())) return null;
    setBusy("signin");
    try {
      const signedIn = await signInWithGoogle();
      if (signedIn) {
        updateAccount(signedIn);
        loadBackupTime();
      }
      return signedIn;
    } catch (e) {
      console.warn("google sign in error", e);
      showError(t("backup.signInFailedTitle"), t("backup.signInFailedBody"));
      return null;
    } finally {
      setBusy(null);
    }
  };

  const signOut = () =>
    addModal({
      type: "confirm",
      title: t("backup.signOutTitle"),
      message: t("backup.signOutBody"),
      okText: t("backup.signOut"),
      onOk: async () => {
        await signOutGoogle();
        updateAccount(null);
        updateLastBackup(null);
      },
    });

  const runDriveBackup = async () => {
    setBusy("backup");
    try {
      const { uploadedImages } = await backupToDrive(db);
      updateLastBackup(new Date());
      feedback("fastComplete");
      addModal({
        type: "alert",
        title: t("backup.doneTitle"),
        message: uploadedImages
          ? t("backup.doneWithPhotos", { count: uploadedImages })
          : t("backup.doneBody"),
      });
    } catch (e) {
      console.warn("drive backup error", e);
      if (e instanceof DriveQuotaError) {
        showError(t("backup.quotaTitle"), t("backup.quotaBody"));
      } else {
        showError(t("backup.failedTitle"), t("backup.failedBody"));
      }
    } finally {
      setBusy(null);
    }
  };

  const backUpToDrive = async () => {
    if (busy) return;
    if (!account && !(await signIn())) return;

    addModal({
      type: "confirm",
      title: t("backup.confirmTitle"),
      message: lastBackup
        ? t("backup.confirmReplace", { time: lastBackup.toLocaleString(i18n.language) })
        : t("backup.confirmFirst"),
      okText: t("backup.backUp"),
      // Đóng modal ngay, kết quả báo bằng modal khác khi xong
      onOk: () => {
        runDriveBackup();
      },
    });
  };

  const runDriveRestore = async (backup: BackupFile) => {
    setBusy("restore");
    try {
      const { missingImages } = await restoreFromDrive(db, backup);
      await afterRestore();
      addModal({
        type: "alert",
        title: t("backup.restoredTitle"),
        message: missingImages
          ? t("backup.restoredMissing", { count: missingImages })
          : t("backup.restoredBody"),
      });
    } catch (e) {
      console.warn("drive restore error", e);
      showError(t("backup.restoreFailedTitle"), t("backup.restoreFailedDrive"));
    } finally {
      setBusy(null);
    }
  };

  const restoreFromGoogleDrive = async () => {
    if (busy) return;
    if (!account && !(await signIn())) return;

    setBusy("restore");
    let backup: BackupFile | null = null;
    try {
      backup = await fetchDriveBackup();
    } catch (e) {
      console.warn("drive fetch error", e);
      showError(t("backup.restoreFailedTitle"), t("backup.readFailed"));
      return;
    } finally {
      setBusy(null);
    }

    if (!backup) {
      addModal({
        type: "alert",
        title: t("backup.noneTitle"),
        message: t("backup.noneBody"),
      });
      return;
    }

    const found = backup;
    addModal({
      type: "confirm",
      title: t("backup.restoreDriveTitle"),
      message: t("backup.restoreConfirm", {
        time: new Date(found.exportedAt).toLocaleString(i18n.language),
      }),
      okText: t("common.restore"),
      onOk: () => {
        runDriveRestore(found);
      },
    });
  };

  const exportFile = async () => {
    if (busy) return;
    setBusy("export");
    try {
      await exportBackup(db);
    } catch (e) {
      console.warn("export backup error", e);
      showError(t("backup.exportFailedTitle"), t("backup.exportFailedBody"));
    } finally {
      setBusy(null);
    }
  };

  const importFile = async () => {
    if (busy) return;
    let backup: BackupFile | null = null;
    try {
      backup = await pickBackup();
    } catch (e) {
      console.warn("import backup error", e);
      showError(t("backup.importFailedTitle"), t("backup.importFailedBody"));
      return;
    }
    if (!backup) return;

    const found = backup;
    addModal({
      type: "confirm",
      title: t("backup.restoreFileTitle"),
      message: t("backup.restoreFileConfirm", {
        time: new Date(found.exportedAt).toLocaleString(i18n.language),
      }),
      okText: t("common.restore"),
      onOk: async () => {
        setBusy("import");
        try {
          await restoreBackup(db, found);
          await afterRestore();
          addModal({
            type: "alert",
            title: t("backup.restoredTitle"),
            message: t("backup.restoredBody"),
          });
        } catch (e) {
          console.warn("file restore error", e);
          showError(t("backup.restoreFailedTitle"), t("backup.restoreFileFailed"));
        } finally {
          setBusy(null);
        }
      },
    });
  };

  const driveStatus = !account
    ? t("backup.notSignedIn")
    : lastBackup
      ? t("backup.lastBackup", { time: lastBackup.toLocaleString(i18n.language) })
      : t("backup.never");

  return (
    <View className="px-4 pb-8 pt-2">
      <ThemedText size="xl" weight="bold" color="title">
        {t("settings.backup")}
      </ThemedText>
      <ThemedText size="xs" color="text" opacity="medium" className="mb-5 mt-1">
        {t("backup.subtitle")}
      </ThemedText>

      <SettingsSection title={t("backup.drive")}>
        <SettingsItem
          icon="user"
          title={account ? (account.name ?? account.email) : t("backup.signIn")}
          description={account ? account.email : t("backup.signInDesc")}
          showChevron={!account}
          onPress={account ? undefined : signIn}
        />
        <SettingsItem
          icon="upload-cloud"
          title={busy === "backup" ? t("backup.backingUp") : t("backup.backUpNow")}
          description={driveStatus}
          onPress={backUpToDrive}
        />
        <SettingsItem
          icon="download-cloud"
          title={busy === "restore" ? t("backup.restoring") : t("backup.restoreDrive")}
          description={t("backup.restoreDriveDesc")}
          onPress={restoreFromGoogleDrive}
        />
        {account ? (
          <SettingsItem
            icon="log-out"
            title={t("backup.signOut")}
            danger
            showChevron={false}
            onPress={signOut}
          />
        ) : null}
      </SettingsSection>

      <SettingsSection title={t("backup.file")}>
        <SettingsItem
          icon="share"
          title={busy === "export" ? t("backup.exporting") : t("backup.exportFile")}
          description={t("backup.exportFileDesc")}
          onPress={exportFile}
        />
        <SettingsItem
          icon="file-plus"
          title={busy === "import" ? t("backup.restoring") : t("backup.restoreFile")}
          description={t("backup.restoreFileDesc")}
          onPress={importFile}
        />
      </SettingsSection>
    </View>
  );
};
