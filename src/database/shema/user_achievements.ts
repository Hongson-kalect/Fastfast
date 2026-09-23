import { Achievement, AchievementItem } from "@/constants/achievements";
import { UserAchievement, UserAchievementMilestone } from "@/interfaces/db.type";
import { uuidv7 } from "@/util/uuidv7";
import { SQLiteDatabase } from "expo-sqlite";

export const generateString = /*sql*/ `
CREATE TABLE IF NOT EXISTS user_achievement (
    id TEXT PRIMARY KEY,

    user_id TEXT NOT NULL,

    achievement_id TEXT NOT NULL,

    current_value REAL NOT NULL DEFAULT 0,

    unlocked_at TEXT DEFAULT NULL,
    is_deleted INTEGER DEFAULT 0, 

    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    updated_at TEXT NOT NULL DEFAULT (DATETIME('now')),

    UNIQUE (user_id, achievement_id)
);
`;

export const itemGenerateString = /*sql*/ `
CREATE TABLE IF NOT EXISTS user_achievement_milestone (
    id TEXT PRIMARY KEY,

    user_id TEXT NOT NULL,

    achievement_id TEXT NOT NULL,
    achievement_item_id TEXT NOT NULL,

    value REAL DEFAULT NULL,

    is_deleted INTEGER DEFAULT 0, 
    unlocked_at TEXT NOT NULL DEFAULT (DATETIME('now')),

    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    updated_at TEXT NOT NULL DEFAULT (DATETIME('now')),

    UNIQUE (user_id, achievement_item_id)
);
`;

export const getUserArchievements = async (
  db: SQLiteDatabase,
  userId: string
): Promise<UserAchievement[]> => {
  return db.getAllAsync<UserAchievement>(
    `
      SELECT *
      FROM user_achievement
      WHERE user_id = ?
        AND is_deleted = 0
      ORDER BY created_at DESC
    `,
    [userId]
  );
};

export const getUserArchievement = async (
  db: SQLiteDatabase,
  userId: string,
  achievementId: string
): Promise<UserAchievement| null> => {
  return db.getFirstAsync<UserAchievement>(
    `
      SELECT *
      FROM user_achievement
      WHERE user_id = ?
        AND achievement_id = ?
        AND is_deleted = 0
        LIMIT 1
    `,
    [userId, achievementId]
  );
};

export type UpdateAchievementResult = {
  achievement: UserAchievement|null;
  milestones: UserAchievementMilestone[];
};export const unlockMilestone = async (
  db: SQLiteDatabase,
  userId: string,
  achievementItemId: string,
  value: number | null
): Promise<UserAchievementMilestone | null> => {
  const id = uuidv7();

  const result = await db.runAsync(
    `
      INSERT OR IGNORE INTO user_achievement_milestone (
        id,
        user_id,
        achievement_item_id,
        value
      )
      VALUES (?, ?, ?, ?)
    `,
    [id, userId, achievementItemId, value]
  );

  if (result.changes === 0) {
    return null;
  }

  return await db.getFirstAsync<UserAchievementMilestone>(
    `
      SELECT *
      FROM user_achievement_milestone
      WHERE user_id = ?
        AND achievement_item_id = ?
        AND is_deleted = 0
      LIMIT 1
    `,
    [userId, achievementItemId]
  );
};

export const updateUserAchievement = async (
  db: SQLiteDatabase,
  userId: string,
  achievementId: string,
  value: number | boolean,
  milestonesFromJson: AchievementItem[]
): Promise<UpdateAchievementResult> => {
  let achievement!: UserAchievement | null;
  let newMilestones: UserAchievementMilestone[] = [];

  await db.withTransactionAsync(async () => {
    const current = await db.getFirstAsync<UserAchievement>(
      `
        SELECT *
        FROM user_achievement
        WHERE user_id = ?
          AND achievement_id = ?
          AND is_deleted = 0
        LIMIT 1
      `,
      [userId, achievementId]
    );

    const isBooleanAchievement =
      typeof value === "boolean";

    /*
     * Boolean achievement:
     * - đã hoàn thành -> không cần xử lý nữa
     *
     * Numeric achievement:
     * - luôn update current_value vì nó còn được dùng
     *   như một statistic hiện tại.
     */
    if (current && isBooleanAchievement && current.current_value >= 1) {
      achievement = current;
      return;
    }

    const dbValue =
      typeof value === "boolean"
        ? value
          ? 1
          : 0
        : value;

    /*
     * Upsert achievement
     */
    await db.runAsync(
      `
        INSERT INTO user_achievement (
          id,
          user_id,
          achievement_id,
          current_value
        )
        VALUES (?, ?, ?, ?)
        ON CONFLICT(user_id, achievement_id)
        DO UPDATE SET
          current_value = excluded.current_value,
          updated_at = DATETIME('now')
      `,
      [
        current?.id ?? uuidv7(),
        userId,
        achievementId,
        dbValue,
      ]
    );

    /*
     * Lấy lại achievement sau khi update
     */
    achievement = await db.getFirstAsync<UserAchievement>(
      `
        SELECT *
        FROM user_achievement
        WHERE user_id = ?
          AND achievement_id = ?
          AND is_deleted = 0
        LIMIT 1
      `,
      [userId, achievementId]
    );

    if (!achievement || milestonesFromJson.length === 0) {
      return;
    }

    /*
     * Lấy các milestone đã unlock.
     */
    const milestonesFromItem =
      await db.getAllAsync<UserAchievementMilestone>(
        `
          SELECT *
          FROM user_achievement_milestone
          WHERE user_id = ?
            AND achievement_item_id IN (
              ${milestonesFromJson.map(() => "?").join(", ")}
            )
            AND is_deleted = 0
        `,
        [
          userId,
          ...milestonesFromJson.map(item => item.id),
        ]
      );

    const unlockedIds = new Set(
      milestonesFromItem.map(item => item.achievement_item_id)
    );

    /*
     * Kiểm tra milestone dựa trên giá trị MỚI.
     */
    for (const milestone of milestonesFromJson) {
      if (unlockedIds.has(milestone.id)) {
        continue;
      }

      let shouldUnlock = false;

      if (typeof milestone.target === "number") {
        if (typeof value === "number") {
          shouldUnlock =
            value >= milestone.target;
        }
      } else if (typeof milestone.target === "boolean") {
        if (typeof value === "boolean") {
          shouldUnlock =
            value === milestone.target;
        }
      }

      if (!shouldUnlock) {
        continue;
      }

      const unlocked = await unlockMilestone(
        db,
        userId,
        milestone.id,
        typeof value === "number" ? value : null
      );

      if (unlocked) {
        newMilestones.push(unlocked);
      }
    }
  });

  return {
    achievement,
    milestones: newMilestones,
  };
};