import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { SQLiteDatabase } from "expo-sqlite";
import { getLocalTodayStr } from "./timer";
import { normalizeImagePaths } from "@/database";

/**
 * Sao lưu / khôi phục toàn bộ dữ liệu local ra một file JSON.
 * Không phụ thuộc server: file được chia sẻ qua share sheet (Drive, Zalo, email…).
 */

const BACKUP_APP = "fastfast";
const BACKUP_VERSION = 1;

// Id thông báo chỉ có nghĩa trên máy đã tạo ra chúng
// backup_account: tài khoản Drive gắn với dữ liệu trên máy, đặt lại sau mỗi lần khôi phục
const DEVICE_SETTING_KEYS = ["target_notification_id", "daily_reminder_id", "backup_account"];

export type BackupFile = {
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

/** Đọc toàn bộ bảng thành một bản sao lưu (chưa ghi ra file). */
export const buildBackup = async (db: SQLiteDatabase): Promise<BackupFile> => {
  const tables: BackupFile["tables"] = {};

  for (const table of await getTableNames(db)) {
    tables[table] = await db.getAllAsync<Record<string, unknown>>(
      `SELECT * FROM "${table}";`,
    );
  }

  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: Date.now(),
    tables,
  };
};

/** Kiểm tra nội dung JSON có đúng là bản sao lưu FastFast. */
export const parseBackup = (text: string): BackupFile => {
  const data = JSON.parse(text) as BackupFile;

  if (data?.app !== BACKUP_APP || typeof data.tables !== "object") {
    throw new Error("Not a FastFast backup file");
  }

  return data;
};

/** Tên các file ảnh đang được dữ liệu tham chiếu (cần đi kèm bản sao lưu). */
export const getReferencedImages = async (db: SQLiteDatabase) => {
  const rows = await db.getAllAsync<{ image_uri: string }>(
    `SELECT image_uri FROM daily_notes WHERE image_uri IS NOT NULL AND image_uri != ''
     UNION
     SELECT image_uri FROM user_profile WHERE image_uri IS NOT NULL AND image_uri != '';`,
  );
  return rows.map((row) => row.image_uri);
};

/** Xuất dữ liệu ra file JSON trong cache rồi mở share sheet. */
export const exportBackup = async (db: SQLiteDatabase) => {
  const backup = await buildBackup(db);

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

  return parseBackup(await picked.result.text());
};

// Bản chụp dữ liệu ngay trước lần khôi phục gần nhất, để hoàn tác khi khôi phục nhầm
// (VD khôi phục bản sao lưu của tài khoản Google khác). Chỉ giữ 1 bản, không kèm ảnh
// (ảnh trên máy không bị xoá khi khôi phục).
const SNAPSHOT_NAME = "fastfast-before-restore.json";

export const saveRestoreSnapshot = async (db: SQLiteDatabase) => {
  const file = new File(Paths.document, SNAPSHOT_NAME);
  file.create({ overwrite: true });
  file.write(JSON.stringify(await buildBackup(db)));
};

/** Bản chụp trước lần khôi phục gần nhất, null nếu không có / hỏng. */
export const readRestoreSnapshot = async (): Promise<BackupFile | null> => {
  const file = new File(Paths.document, SNAPSHOT_NAME);
  if (!file.exists) return null;
  try {
    return parseBackup(await file.text());
  } catch {
    return null;
  }
};

export const deleteRestoreSnapshot = () => {
  const file = new File(Paths.document, SNAPSHOT_NAME);
  if (file.exists) file.delete();
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

    // Bản sao lưu cũ có thể còn đường dẫn ảnh tuyệt đối của máy khác
    await normalizeImagePaths(tx);
  });
};

/** Xoá toàn bộ cài đặt, giữ lại các cờ trạng thái (đã xem onboarding). */
export const resetSettings = async (db: SQLiteDatabase) => {
  await db.runAsync(
    `DELETE FROM app_settings WHERE key NOT IN ('onboarding_done');`,
  );
};
