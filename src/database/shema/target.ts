import { WeightTarget } from "@/interfaces/db.type";
import { getLocalTodayStr } from "@/util/timer";
import { uuidv7 } from "@/util/uuidv7";
import { SQLiteDatabase } from "expo-sqlite";

export const generateString = /*sql*/ `
CREATE TABLE IF NOT EXISTS weight_targets (
    id TEXT PRIMARY KEY,
    start_weight REAL NOT NULL,
    target_weight REAL NOT NULL,
    start_date TEXT NOT NULL,                  -- 'YYYY-MM-DD'
    target_date TEXT,                          -- 'YYYY-MM-DD'
    
    -- Tách thành 2 trạng thái riêng biệt
    is_active INTEGER DEFAULT 1,              -- 1: Đang chọn hiển thị, 0: Đã lưu vào lịch sử
    is_completed INTEGER DEFAULT 0,           -- 0: Chưa đạt, 1: Đã đạt
    completed_at INTEGER,                     -- Timestamp thời điểm cán đích (Nullable)
    
    sync_status TEXT DEFAULT 'pending',
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);
`;

export const getActiveWeightTarget = async (
  db: SQLiteDatabase,
): Promise<WeightTarget | null> => {
  // Lấy target đang active (kể cả nó đã is_completed = 1 hay chưa)
  try{

    const row = await db.getFirstAsync<WeightTarget>(
      `SELECT * FROM weight_targets WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1;`,
    );
    return row;
  }
  catch (error) {
    console.log("error on getActiveWeightTarget", error);
    return null;
  }
};

export const checkAndUpdateActiveTarget = async (
  db: SQLiteDatabase,
  newWeight: number,
) => {
  try{

    const activeTarget = await getActiveWeightTarget(db);
    
    // Nếu không có target active hoặc target active này ĐÃ COMPLETE RỒI thì bỏ qua
    if (!activeTarget || activeTarget.is_completed === 1) return false;
    
    const isLosing = activeTarget.start_weight > activeTarget.target_weight;
    const isAchieved = isLosing
    ? newWeight <= activeTarget.target_weight
    : newWeight >= activeTarget.target_weight;

    if (isAchieved) {
      // Chỉ bật is_completed = 1, VẪN GIỮ is_active = 1 để UI tiếp tục hiển thị trạng thái hoàn thành
      await db.runAsync(
        `UPDATE weight_targets 
        SET is_completed = 1, 
        completed_at = strftime('%s', 'now'),
        sync_status = 'pending', 
        updated_at = strftime('%s', 'now') 
        WHERE id = ?;`,
        [activeTarget.id],
      );
      return true; // Trigger hiệu ứng ăn mừng 🎉 ở UI
    }
    
    return false;
  }
  catch (error) {
    console.log("error on checkAndUpdateActiveTarget", error);
    return false;
  }
};

export const createWeightTarget = async (
  db: SQLiteDatabase,
  target: {
    startWeight: number;
    targetWeight: number;
    startDate?: string;
    // targetDate?: string;
  },
) => {
  try{

    const startDate = target.startDate || getLocalTodayStr();
    const id = uuidv7();
    
    await db.withTransactionAsync(async () => {
    // Chỉ cần tắt cờ is_active của tất cả target cũ
    await db.runAsync(
      `UPDATE weight_targets 
      SET is_active = 0, 
      sync_status = 'pending', 
      updated_at = strftime('%s', 'now') 
      WHERE is_active = 1;`,
    );
    
    // Chèn Target mới với is_active = 1, is_completed = 0
    const query = /*sql*/ `
    INSERT INTO weight_targets (
      id, start_weight, target_weight, start_date, 
      is_active, is_completed, sync_status, updated_at
    )
    VALUES (?, ?, ?, ?, 1, 0, 'pending', strftime('%s', 'now'));
    `;
    
    await db.runAsync(query, [
      id,
      target.startWeight,
      target.targetWeight,
      startDate,
      // target.targetDate || null,
    ]);
  });
}
catch (error) {
  console.log("error on createWeightTarget", error);
}
};
/**
 * Lấy danh sách toàn bộ lịch sử các mục tiêu (cho trang Traceback / History)
*/
export const getAllWeightTargets = async (
  db: SQLiteDatabase,
): Promise<WeightTarget[]> => {
  try{

    const rows = await db.getAllAsync<WeightTarget>(
      `SELECT * FROM weight_targets ORDER BY created_at DESC;`,
    );
    return rows;
  }catch (error) {
    console.log("error on getAllWeightTargets", error);
    return [];

  }
};
