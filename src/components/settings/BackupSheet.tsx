import { useDBService } from "@/hooks/useDBService";
import { reloadAppData } from "@/stores/appAction";
import { useAppStore } from "@/stores/appStore";
import { useT } from "@/providers/Language";
import i18n from "i18next";
import useModalStore from "@/stores/modalStore";
import {
  BackupFile,
  deleteRestoreSnapshot,
  exportBackup,
  pickBackup,
  readRestoreSnapshot,
  restoreBackup,
  saveRestoreSnapshot,
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
  // Thời điểm của bản chụp dữ liệu trước lần khôi phục gần nhất (để hoàn tác)
  const [snapshotAt, setSnapshotAt] = useState<Date | null>(null);

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

  const loadSnapshot = () =>
    readRestoreSnapshot().then((snapshot) =>
      setSnapshotAt(snapshot ? new Date(snapshot.exportedAt) : null),
    );

  useEffect(() => {
    getSignedInAccount().then((signedIn) => {
      setAccount(signedIn);
      if (signedIn) loadBackupTime();
    });
    loadSnapshot();
  }, []);

  // Ghi nhớ tài khoản Drive gắn với dữ liệu trên máy; null = chưa gắn (VD vừa nhập từ file)
  const linkAccount = async (email: string | null) => {
    useAppStore.getState().updateSetting({ backup_account: email });
    await dbService.setting("backup_account", email);
  };

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

  // Đăng nhập tài khoản khác với tài khoản đang gắn dữ liệu: hỏi dùng dữ liệu nào
  const askAccountSwitch = (linked: string, email: string) =>
    new Promise<"restore" | "keep" | "cancel">((resolve) => {
      let chosen = false;
      addModal({
        type: "radio",
        title: t("backup.switchTitle"),
        message: t("backup.switchBody", { linked, email }),
        options: [
          {
            value: "restore",
            label: t("backup.switchRestore", { email }),
            description: t("backup.switchRestoreDesc"),
          },
          {
            value: "keep",
            label: t("backup.switchKeep"),
            description: t("backup.switchKeepDesc", { email }),
          },
          { value: "cancel", label: t("backup.switchCancel", { email }) },
        ],
        onSelect: (value) => {
          chosen = true;
          resolve(value as "restore" | "keep" | "cancel");
        },
        onDismiss: () => {
          if (!chosen) resolve("cancel");
        },
      });
    });

  /**
   * Đăng nhập Google. Trả về tài khoản khi có thể tiếp tục thao tác đang làm;
   * null khi huỷ, lỗi, hoặc người dùng chọn khôi phục dữ liệu của tài khoản mới
   * (luồng khôi phục chạy riêng).
   */
  const signIn = async (): Promise<GoogleAccount | null> => {
    if (!(await confirmDriveAccess())) return null;
    setBusy("signin");
    let signedIn: GoogleAccount | null = null;
    try {
      signedIn = await signInWithGoogle();
    } catch (e) {
      console.warn("google sign in error", e);
      showError(t("backup.signInFailedTitle"), t("backup.signInFailedBody"));
      return null;
    } finally {
      setBusy(null);
    }
    if (!signedIn) return null;

    const linked = useAppStore.getState().settings?.backup_account;
    const choice =
      linked && linked !== signedIn.email
        ? await askAccountSwitch(linked, signedIn.email)
        : "keep";

    if (choice === "cancel") {
      await signOutGoogle();
      return null;
    }

    updateAccount(signedIn);
    loadBackupTime();

    if (choice === "restore") {
      restoreFromGoogleDrive(signedIn);
      return null;
    }
    // Chọn giữ dữ liệu: gắn luôn tài khoản mới. Lần đăng nhập đầu chỉ gắn khi sao lưu / khôi phục xong
    if (linked) await linkAccount(signedIn.email);
    return signedIn;
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

  const runDriveBackup = async (email: string) => {
    setBusy("backup");
    try {
      const { uploadedImages } = await backupToDrive(db);
      await linkAccount(email);
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
    const current = account ?? (await signIn());
    if (!current) return;

    addModal({
      type: "confirm",
      title: t("backup.confirmTitle"),
      message: lastBackup
        ? t("backup.confirmReplace", { time: lastBackup.toLocaleString(i18n.language) })
        : t("backup.confirmFirst"),
      okText: t("backup.backUp"),
      // Đóng modal ngay, kết quả báo bằng modal khác khi xong
      onOk: () => {
        runDriveBackup(current.email);
      },
    });
  };

  const runDriveRestore = async (backup: BackupFile, email: string) => {
    setBusy("restore");
    try {
      // Giữ một bản dữ liệu hiện tại để hoàn tác nếu khôi phục nhầm
      await saveRestoreSnapshot(db);
      const { missingImages } = await restoreFromDrive(db, backup);
      await afterRestore();
      await linkAccount(email);
      loadSnapshot();
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

  /** `signedIn`: tài khoản vừa đăng nhập (state `account` chưa kịp cập nhật) */
  const restoreFromGoogleDrive = async (signedIn?: GoogleAccount) => {
    if (busy) return;
    const current = signedIn ?? account ?? (await signIn());
    if (!current) return;

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
        runDriveRestore(found, current.email);
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
          await saveRestoreSnapshot(db);
          await restoreBackup(db, found);
          await afterRestore();
          // Dữ liệu từ file không rõ thuộc tài khoản nào: bỏ gắn, lần sao lưu tới sẽ gắn lại
          await linkAccount(null);
          loadSnapshot();
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

  // Quay lại dữ liệu trước lần khôi phục gần nhất
  const undoRestore = async () => {
    if (busy || !snapshotAt) return;
    const snapshot = await readRestoreSnapshot();
    if (!snapshot) {
      setSnapshotAt(null);
      return;
    }
    addModal({
      type: "confirm",
      title: t("backup.undoTitle"),
      message: t("backup.undoBody", {
        time: new Date(snapshot.exportedAt).toLocaleString(i18n.language),
      }),
      okText: t("common.restore"),
      onOk: async () => {
        setBusy("import");
        try {
          await restoreBackup(db, snapshot);
          await afterRestore();
          await linkAccount(null);
          deleteRestoreSnapshot();
          setSnapshotAt(null);
          addModal({
            type: "alert",
            title: t("backup.undoneTitle"),
            message: t("backup.undoneBody"),
          });
        } catch (e) {
          console.warn("undo restore error", e);
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
          onPress={() => restoreFromGoogleDrive()}
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
        {snapshotAt ? (
          <SettingsItem
            icon="rotate-ccw"
            title={t("backup.undoRestore")}
            description={t("backup.undoRestoreDesc", {
              time: snapshotAt.toLocaleString(i18n.language),
            })}
            onPress={undoRestore}
          />
        ) : null}
      </SettingsSection>
    </View>
  );
};
