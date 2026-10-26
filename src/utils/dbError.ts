/**
 * Lỗi truy vấn trên kết nối SQLite đã đóng.
 *
 * SQLiteProvider đóng database khi reload / Fast Refresh, các truy vấn async còn dở
 * (load dashboard, pixel, focus effect…) sẽ bị từ chối với "Access to closed resource".
 * Chỉ xảy ra khi dev, không làm hỏng dữ liệu → không coi là lỗi nghiêm trọng.
 */
export const isClosedDbError = (error: unknown): boolean => {
  const message =
    error instanceof Error
      ? `${error.message} ${String((error as { cause?: unknown }).cause ?? "")}`
      : String(error);

  return /closed resource|database is closed|already closed/i.test(message);
};

// Mỗi lần reload có hàng chục truy vấn dở dang → gộp thành một dòng log cho cả đợt
const CLOSED_LOG_WINDOW_MS = 2000;
let closedBurst: { count: number; scopes: Set<string> } | null = null;

/** Ghi nhận một truy vấn bị huỷ do DB đã đóng; chỉ in một dòng tổng kết mỗi đợt (dev). */
export const reportClosedDbQuery = (scope: string) => {
  if (!__DEV__) return;

  if (!closedBurst) {
    closedBurst = { count: 0, scopes: new Set() };
    setTimeout(() => {
      const burst = closedBurst!;
      closedBurst = null;
      const scopes = [...burst.scopes].slice(0, 3).join(", ");
      console.log(
        `[db] Bỏ qua ${burst.count} truy vấn còn dở do reload/Fast Refresh đóng kết nối (${scopes}${burst.scopes.size > 3 ? ", …" : ""}). Không ảnh hưởng dữ liệu.`,
      );
    }, CLOSED_LOG_WINDOW_MS);
  }

  closedBurst.count++;
  closedBurst.scopes.add(scope);
};

/** Log lỗi DB: lỗi "đã đóng" được gộp lại thành một dòng ngắn khi dev, lỗi khác vẫn warn đầy đủ. */
export const logDbError = (scope: string, error: unknown) => {
  if (isClosedDbError(error)) {
    reportClosedDbQuery(scope);
    return;
  }

  console.warn(`[db] ${scope} failed:`, error);
};

/** Chạy một tác vụ DB chạy nền (không ai await), nuốt lỗi sau khi log. */
export const runDbTask = <T>(scope: string, task: () => Promise<T>) =>
  task().catch((error) => {
    logDbError(scope, error);
    return undefined;
  });
