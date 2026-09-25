import { UserAsset } from "@/interfaces/db.type";
import { uuidv7 } from "@/util/uuidv7";
import { SQLiteDatabase } from "expo-sqlite";

export const generateString = /*sql*/ `
CREATE TABLE IF NOT EXISTS user_asset (
    id TEXT PRIMARY KEY,

    user_id TEXT NOT NULL,

    asset_id TEXT NOT NULL,
    type TEXT NOT NULL,
    token TEXT NOT NULL,

    source TEXT NOT NULL DEFAULT 'purchase',

    purchased_at TEXT DEFAULT NULL,
    expires_at TEXT DEFAULT NULL,

    is_deleted INTEGER DEFAULT 0, 
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    updated_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);
`;
export const createUserAsset = async (
  db: SQLiteDatabase,
  data: Omit<
    UserAsset,
    | "created_at"
    | "updated_at"
    | "is_deleted"
    | "id"
    | "purchased_at"
    | "expires_at"
  >,
) => {
  const id = uuidv7();
  const userId = await db.runAsync(
    `
      INSERT INTO user_asset (
        id,
        user_id,
        type,
        asset_id,
        token,
        source
      )
      VALUES (?, ?,?, ?, ?,?)
    `,
    [id, data.user_id, data.type, data.asset_id, data.token, data.source],
  );

  return await getUserAsset(db, id);
};

export const getUserAsset = async (
  db: SQLiteDatabase,
  id: string,
): Promise<UserAsset | null> => {
  return db.getFirstAsync<UserAsset>(
    `
      SELECT *
      FROM user_asset
      WHERE id = ?
        AND is_deleted = 0
      LIMIT 1
    `,
    [id],
  );
};

export const removeUserAsset = async (db: SQLiteDatabase, id: string) => {
  await db.runAsync(
    `
      delete from user_asset
      WHERE asset_id = ?
    `,
    [id],
  );
};

export const getUserAssets = async (
  db: SQLiteDatabase,
  userId: string,
  type?: string,
): Promise<UserAsset[]> => {
  if (type) {
    return db.getAllAsync<UserAsset>(
      `
        SELECT *
        FROM user_asset
        WHERE user_id = ?
          AND type = ?
          AND is_deleted = 0
        ORDER BY created_at DESC
      `,
      [userId, type],
    );
  }
  return db.getAllAsync<UserAsset>(
    `
      SELECT *
      FROM user_asset
      WHERE user_id = ?
        AND is_deleted = 0
      ORDER BY created_at DESC
    `,
    [userId],
  );
};

export const updateUserAsset = async (
  db: SQLiteDatabase,
  id: string,
  data: Partial<Pick<UserAsset, "source" | "purchased_at" | "expires_at">>,
) => {
  await db.runAsync(
    `
      UPDATE user_asset
      SET
        source = COALESCE(?, source),
        purchased_at = COALESCE(?, purchased_at),
        expires_at = COALESCE(?, expires_at),
        updated_at = DATETIME('now')
      WHERE id = ?
        AND is_deleted = 0
    `,
    [
      data.source ?? null,
      data.purchased_at ?? null,
      data.expires_at ?? null,
      id,
    ],
  );
};

export const deleteUserAsset = async (db: SQLiteDatabase, id: string) => {
  await db.runAsync(
    `
      UPDATE user_asset
      SET
        is_deleted = 1,
        updated_at = DATETIME('now')
      WHERE id = ?
        AND is_deleted = 0
    `,
    [id],
  );
};
