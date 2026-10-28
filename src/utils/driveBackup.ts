import * as LegacyFS from "expo-file-system/legacy";
import { File, Paths } from "expo-file-system";
import { SQLiteDatabase } from "expo-sqlite";
import {
  BackupFile,
  buildBackup,
  getReferencedImages,
  parseBackup,
  restoreBackup,
} from "./backup";
import { getGoogleAccessToken, invalidateGoogleAccessToken } from "./googleAuth";
import { getImagesDir, toImageName } from "./image";

/**
 * Sao lưu lên thư mục ẩn của app trên Google Drive người dùng (appDataFolder).
 * Không đồng bộ: mỗi lần sao lưu ghi đè một file JSON và tải lên ảnh còn thiếu.
 */

const DRIVE_API = "https://www.googleapis.com/drive/v3";
const DRIVE_UPLOAD = "https://www.googleapis.com/upload/drive/v3";
const BACKUP_NAME = "fastfast-backup.json";

type DriveFile = { id: string; name: string; modifiedTime: string };

class DriveAuthError extends Error {}

const ensureOk = (status: number, action: string) => {
  if (status === 401) throw new DriveAuthError(action);
  if (status < 200 || status >= 300) {
    throw new Error(`Drive ${action} failed (${status})`);
  }
};

/** Chạy với access token; token bị từ chối thì lấy token mới và thử lại một lần. */
const withToken = async <T>(run: (token: string) => Promise<T>): Promise<T> => {
  const token = await getGoogleAccessToken();
  try {
    return await run(token);
  } catch (error) {
    if (!(error instanceof DriveAuthError)) throw error;
    await invalidateGoogleAccessToken(token);
    return run(await getGoogleAccessToken());
  }
};

const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });

const mimeOf = (name: string) => {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "json") return "application/json";
  if (ext === "png") return "image/png";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  return "image/webp";
};

const listFiles = async (token: string): Promise<DriveFile[]> => {
  const files: DriveFile[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      spaces: "appDataFolder",
      fields: "nextPageToken,files(id,name,modifiedTime)",
      pageSize: "1000",
      ...(pageToken ? { pageToken } : {}),
    });
    const res = await fetch(`${DRIVE_API}/files?${params}`, {
      headers: authHeader(token),
    });
    ensureOk(res.status, "list");
    const data = await res.json();
    files.push(...data.files);
    pageToken = data.nextPageToken;
  } while (pageToken);

  return files;
};

/** Ghi nội dung file local lên Drive: cập nhật file có sẵn hoặc tạo mới. */
const uploadFile = async (
  token: string,
  name: string,
  localUri: string,
  existingId?: string,
) => {
  let id = existingId;

  if (!id) {
    const res = await fetch(`${DRIVE_API}/files?fields=id`, {
      method: "POST",
      headers: { ...authHeader(token), "Content-Type": "application/json" },
      body: JSON.stringify({ name, parents: ["appDataFolder"] }),
    });
    ensureOk(res.status, "create");
    id = (await res.json()).id as string;
  }

  const result = await LegacyFS.uploadAsync(
    `${DRIVE_UPLOAD}/files/${id}?uploadType=media`,
    localUri,
    {
      httpMethod: "PATCH",
      uploadType: LegacyFS.FileSystemUploadType.BINARY_CONTENT,
      headers: { ...authHeader(token), "Content-Type": mimeOf(name) },
    },
  );
  ensureOk(result.status, "upload");
};

const downloadFile = async (token: string, id: string, localUri: string) => {
  const result = await LegacyFS.downloadAsync(
    `${DRIVE_API}/files/${id}?alt=media`,
    localUri,
    { headers: authHeader(token) },
  );
  ensureOk(result.status, "download");
};

const deleteFile = async (token: string, id: string) => {
  const res = await fetch(`${DRIVE_API}/files/${id}`, {
    method: "DELETE",
    headers: authHeader(token),
  });
  if (res.status !== 404) ensureOk(res.status, "delete");
};

/** Thời điểm bản sao lưu gần nhất trên Drive, null nếu chưa có. */
export const getDriveBackupTime = () =>
  withToken(async (token) => {
    const backup = (await listFiles(token)).find((f) => f.name === BACKUP_NAME);
    return backup ? new Date(backup.modifiedTime) : null;
  });

/**
 * Sao lưu lên Drive: ghi đè file JSON, tải lên ảnh chưa có,
 * xoá ảnh trên Drive không còn được dữ liệu dùng tới.
 */
export const backupToDrive = (db: SQLiteDatabase) =>
  withToken(async (token) => {
    const remote = await listFiles(token);
    const remoteByName = new Map(remote.map((f) => [f.name, f]));

    const images = new Set((await getReferencedImages(db)).map(toImageName));
    const imagesDir = getImagesDir();

    let uploadedImages = 0;
    for (const name of images) {
      if (remoteByName.has(name)) continue;
      const local = new File(imagesDir, name);
      if (!local.exists) continue;
      await uploadFile(token, name, local.uri);
      uploadedImages++;
    }

    // JSON ghi sau ảnh: bản sao lưu chỉ trỏ tới ảnh đã có trên Drive
    const json = new File(Paths.cache, BACKUP_NAME);
    json.create({ overwrite: true });
    json.write(JSON.stringify(await buildBackup(db)));
    await uploadFile(token, BACKUP_NAME, json.uri, remoteByName.get(BACKUP_NAME)?.id);

    for (const file of remote) {
      if (file.name !== BACKUP_NAME && !images.has(file.name)) {
        await deleteFile(token, file.id);
      }
    }

    return { uploadedImages };
  });

/** Tải bản sao lưu từ Drive (chưa ghi vào máy). Null nếu Drive chưa có bản nào. */
export const fetchDriveBackup = () =>
  withToken(async (token): Promise<BackupFile | null> => {
    const backup = (await listFiles(token)).find((f) => f.name === BACKUP_NAME);
    if (!backup) return null;

    const json = new File(Paths.cache, BACKUP_NAME);
    await downloadFile(token, backup.id, json.uri);
    return parseBackup(await json.text());
  });

/** Ghi bản sao lưu vào máy rồi tải về các ảnh máy chưa có. */
export const restoreFromDrive = async (
  db: SQLiteDatabase,
  backup: BackupFile,
) => {
  await restoreBackup(db, backup);

  return withToken(async (token) => {
    const remoteByName = new Map(
      (await listFiles(token)).map((f) => [f.name, f]),
    );
    const imagesDir = getImagesDir();
    if (!imagesDir.exists) imagesDir.create({ intermediates: true, idempotent: true });

    let missingImages = 0;
    for (const name of (await getReferencedImages(db)).map(toImageName)) {
      const local = new File(imagesDir, name);
      if (local.exists) continue;

      const remote = remoteByName.get(name);
      if (!remote) {
        missingImages++;
        continue;
      }
      await downloadFile(token, remote.id, local.uri);
    }

    return { missingImages };
  });
};
