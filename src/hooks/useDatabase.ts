import { uuidv7 } from "@/utils/uuidv7";
import { useSQLiteContext } from "expo-sqlite";
export const useDatabase = () => {
  const db = useSQLiteContext();

  const findOneById = async (tableName: string, id: string) => {
    return await db.getFirstAsync(`SELECT * FROM ${tableName} WHERE id = ?`, [
      id,
    ]);
  };

  const findOne = async <T>(tableName: string, where: Record<string, any>) => {
    let sql = `SELECT * FROM ${tableName} WHERE is_deleted = 0 and is_active = 1`; // Luôn lọc bỏ hàng đã xóa mềm

    const params: any[] = [];

    if (where) {
      const keys = Object.keys(where);
      keys.forEach((key) => {
        sql += ` AND ${key} = ?`;
        params.push(where[key]);
      });
    }

    return await db.getFirstAsync<T>(sql, params);
  };

  const findAll = async <T>(tableName: string, where?: Record<string, any>) => {
    let sql = `SELECT * FROM ${tableName} WHERE is_deleted = 0`; // Luôn lọc bỏ hàng đã xóa mềm
    const params: any[] = [];

    if (where) {
      const keys = Object.keys(where);
      keys.forEach((key) => {
        sql += ` AND ${key} = ?`;
        params.push(where[key]);
      });
    }

    return await db.getAllAsync<T>(sql, params);
  };
  const findAllActive = async <T>(
    tableName: string,
    where?: Record<string, any>
  ) => {
    let sql = `SELECT * FROM ${tableName} WHERE is_deleted = 0 AND is_active = 1`; // Luôn lọc bỏ hàng đã xóa mềm
    const params: any[] = [];

    if (where) {
      const keys = Object.keys(where);
      keys.forEach((key) => {
        sql += ` AND ${key} = ?`;
        params.push(where[key]);
      });
    }

    return await db.getAllAsync<T>(sql, params);
  };

  const create = async (tableName: string, data: Record<string, any>) => {
    if (tableName !== "server_pendings") {
      if (!data.id) {
        const id = uuidv7();
        data.id = id;
      }
    }

    const keys = Object.keys(data);
    const sql = `INSERT INTO ${tableName} (${keys.join(", ")}) VALUES (${keys
      .map(() => "?")
      .join(", ")});`;
    return await db.runAsync(sql, Object.values(data));
  };

  /**
   * 2. Tạo hàng loạt (bulkCreate)
   * Sử dụng Transaction để đảm bảo tốc độ cực nhanh
   */
  const bulkCreate = async (
    tableName: string,
    dataArray: Record<string, any>[]
  ) => {
    if (dataArray.length === 0) return;

    const keys = Object.keys(dataArray[0]);
    const columns = keys.join(", ");
    const placeholders = keys.map(() => "?").join(", ");
    const sql = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders});`;

    await db.withTransactionAsync(async () => {
      for (const data of dataArray) {
        await db.runAsync(sql, Object.values(data));
      }
    });
  };

  /**
   * 3. Xóa mềm (softDelete)
   * Thay đổi flag is_deleted thay vì xóa hẳn khỏi ổ cứng
   */
  const softDelete = async (tableName: string, id: string | string[]) => {
    if (typeof id === "string") {
      const sql = `UPDATE ${tableName} SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE id = ?`;
      return await db.runAsync(sql, [id]);
    } else {
      const ids = id.map((id) => `'${id}'`).join(", ");
      const sql = `UPDATE ${tableName} SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE id in (${ids}`;
      return await db.runAsync(sql);
    }
  };

  /**
   * 4. Xóa vĩnh viễn (delete)
   */
  const hardDelete = async (tableName: string, id: string | string[]) => {
    if (typeof id === "string") {
      const sql = `DELETE FROM ${tableName} WHERE id = ?`;
      return await db.runAsync(sql, [id]);
    } else {
      const ids = id.map((id) => `'${id}'`).join(", ");
      const sql = `DELETE FROM ${tableName} WHERE id in (${ids}`;
      return await db.runAsync(sql);
    }
  };

  const softDeleteAll = async (tableName: string) => {
    const sql = `UPDATE ${tableName} SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP`;
    return await db.runAsync(sql);
  };

  const deleteAll = async (tableName: string) => {
    const sql = `DELETE FROM ${tableName};`;
    return await db.runAsync(sql);
  };

  const updateById = async (
    tableName: string,
    id: string,
    data: Record<string, any>
  ) => {
    // 1. Loại bỏ id và các trường không nên update thủ công nếu có
    const { id: _, created_at: __, ...updateData } = data;

    const keys = Object.keys(updateData);
    if (keys.length === 0) return;

    // 2. Build SQL: UPDATE table SET col1 = ?, col2 = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    const setClause = keys.map((key) => `${key} = ?`).join(", ");
    const sql = `UPDATE ${tableName} SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;

    const values = [...Object.values(updateData), id];
    return await db.runAsync(sql, values);
  };

  const update = async (
    tableName: string,
    where: Record<string, any>,
    data: Record<string, any>
  ) => {
    // 1. Loại bỏ id và các trường không nên update thủ công nếu có
    const { id: _, created_at: __, ...updateData } = data;

    const keys = Object.keys(updateData);
    if (keys.length === 0) return;

    // 2. Build SQL: UPDATE table SET col1 = ?, col2 = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    const setClause = keys.map((key) => `${key} = ?`).join(", ");
    let sql = `UPDATE ${tableName} SET ${setClause}, updated_at = CURRENT_TIMESTAMP`;

    const params: any[] = [];
    const whereKeys = Object.keys(where);
    whereKeys.forEach((whereKey) => {
      sql += ` WHERE ${whereKey} = ?`;
      params.push(where[whereKey]);
    });

    const values = [...Object.values(updateData), params];
    return await db.runAsync(sql, values);
  };

  const count = async (tableName: string, where?: Record<string, any>) => {
    let sql = `SELECT COUNT(*) as total FROM ${tableName} WHERE is_deleted = 0`;
    const params: any[] = [];

    if (where) {
      const keys = Object.keys(where);
      keys.forEach((key) => {
        sql += ` AND ${key} = ?`;
        params.push(where[key]);
      });
    }

    const result = await db.getFirstAsync<{ total: number }>(sql, params);
    return result?.total ?? 0;
  };

  const addPending = async (
    tableName: string,
    targetId: string,
    action: "CREATE" | "UPDATE" | "DELETE",
    data: any
  ) => {
    try {
      await db.runAsync(
        `INSERT INTO server_pendings (table_name, target_id, action, data) VALUES (?, ?, ?, ?)`,
        [tableName, targetId, action, JSON.stringify(data)]
      );
      // Sau khi thêm vào hàng chờ, kích hoạt worker đẩy lên luôn
      syncPendingToRemote();
    } catch (error) {
      console.error("Failed to add pending sync:", error);
    }
  };

  const syncPendingToRemote = async () => {
    // 1. Kiểm tra trạng thái mạng trước khi bắt đầu
    // const state = await NetInfo.fetch();
    // if (!state.isConnected) return;

    // Lấy ra tối đa 50 bản ghi đang chờ
    const batchSize = 50;
    const pendings = await db.getAllAsync<any>(
      `SELECT * FROM server_pendings 
     WHERE status != 'syncing' AND retry_count < 5 
     ORDER BY id ASC LIMIT ?`,
      [batchSize]
    );

    if (pendings.length === 0) return;

    // Đánh dấu các bản ghi này là đang xử lý để tránh gửi trùng
    const ids = pendings.map((p) => p.id);
    const placeholders = ids.map(() => "?").join(",");
    await db.runAsync(
      `UPDATE server_pendings SET status = 'syncing' WHERE id IN (${placeholders})`,
      ids
    );

    try {
      // 2. Gửi lên server (Giả sử bạn dùng axios hoặc fetch)
      const response = await fetch("https://your-api.com/v1/sync/upstream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: pendings }),
      });

      if (response.ok) {
        // 3. Nếu thành công: Xóa bỏ khỏi hàng chờ
        await db.runAsync(
          `DELETE FROM server_pendings WHERE id IN (${placeholders})`,
          ids
        );

        // Đệ quy: Tiếp tục kiểm tra và gửi lượt tiếp theo
        syncPendingToRemote();
      } else {
        throw new Error("Server rejected batch");
      }
    } catch (error: any) {
      // 4. Nếu lỗi: Chuyển lại trạng thái error và tăng retry_count
      await db.runAsync(
        `UPDATE server_pendings 
       SET status = 'error', 
           retry_count = retry_count + 1,
           error_message = ? 
       WHERE id IN (${placeholders})`,
        [error.message, ...ids]
      );
    }
  };

  return {
    findOne,
    findOneById,
    findAll,
    findAllActive,

    create,
    bulkCreate,
    update,
    updateById,

    softDelete,
    hardDelete,
    softDeleteAll,
    deleteAll,
    count,

    addPending,
    syncPendingToRemote,
    db,
  }; // Trả về cả db nếu cần dùng query phức tạp
};
