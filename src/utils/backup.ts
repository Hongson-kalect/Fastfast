import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { SQLiteDatabase } from "expo-sqlite";
import { getLocalTodayStr } from "./timer";

/**
 * Sao lưu / khôi phục toàn bộ dữ liệu local ra một file JSON.
 * Không phụ thuộc server: file được chia sẻ qua share sheet (Drive, Zalo, email…).
 */

const BACKUP_APP = "fastfast";
const BACKUP_VERSION = 1;

// Id thông báo chỉ có nghĩa trên máy đã tạo ra chúng
const DEVICE_SETTING_KEYS = ["target_notification_id", "daily_reminder_id"];

type BackupFile = {
  app: string;
  version: number;
  exportedAt: number;
  tables: Record<string, Record<string, unknown>[]>;
};

const getTableNames = async (db: SQLiteDatabase) => {
  const rows = await db.getAllAsync<{ name: string }>(
    `SELECT name FROM sqlite_master
     WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'android_%';`,
  );
  return rows.map((row) => row.name);
};

const getColumns = async (db: SQLiteDatabase, table: string) => {
  const rows = await db.getAllAsync<{ name: string }>(
    `PRAGMA table_info("${table}");`,
  );
  return rows.map((row) => row.name);
};

/** Xuất dữ liệu ra file JSON trong cache rồi mở share sheet. */
export const exportBackup = async (db: SQLiteDatabase) => {
  const tables: BackupFile["tables"] = {};

  for (const table of await getTableNames(db)) {
    tables[table] = await db.getAllAsync<Record<string, unknown>>(
      `SELECT * FROM "${table}";`,
    );
  }

  const backup: BackupFile = {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: Date.now(),
    tables,
  };

  const file = new File(Paths.cache, `fastfast-backup-${getLocalTodayStr()}.json`);
  file.create({ overwrite: true });
  file.write(JSON.stringify(backup));

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("Sharing is not available on this device");
  }

  await Sharing.shareAsync(file.uri, {
    mimeType: "application/json",
    dialogTitle: "FastFast backup",
  });
};

/** Mở trình chọn file và đọc bản sao lưu. Trả về null nếu người dùng huỷ. */
export const pickBackup = async (): Promise<BackupFile | null> => {
  const picked = await File.pickFileAsync({
    mimeTypes: ["application/json", "text/plain", "application/octet-stream"],
  });
  if (picked.canceled) return null;

  const data = JSON.parse(await picked.result.text()) as BackupFile;

  if (data?.app !== BACKUP_APP || typeof data.tables !== "object") {
    throw new Error("Not a FastFast backup file");
  }

  return data;
};

/** Ghi đè dữ liệu hiện tại bằng bản sao lưu (chỉ các bảng/cột đang tồn tại). */
export const restoreBackup = async (db: SQLiteDatabase, backup: BackupFile) => {
  const existing = new Set(await getTableNames(db));

  await db.withExclusiveTransactionAsync(async (tx) => {
    for (const [table, rows] of Object.entries(backup.tables)) {
      if (!existing.has(table)) continue;

      const columns = new Set(await getColumns(tx, table));
      await tx.runAsync(`DELETE FROM "${table}";`);

      for (const row of rows) {
        if (table === "app_settings" && DEVICE_SETTING_KEYS.includes(String(row.key))) {
          continue;
        }

        const keys = Object.keys(row).filter((key) => columns.has(key));
        if (!keys.length) continue;

        await tx.runAsync(
          `INSERT INTO "${table}" (${keys.map((k) => `"${k}"`).join(", ")})
           VALUES (${keys.map(() => "?").join(", ")});`,
          keys.map((key) => row[key] as string | number | null),
        );
      }
    }
  });
};

/** Xoá toàn bộ cài đặt, giữ lại các cờ trạng thái (đã xem onboarding). */
export const resetSettings = async (db: SQLiteDatabase) => {
  await db.runAsync(
    `DELETE FROM app_settings WHERE key NOT IN ('onboarding_done');`,
  );
};
