
export const generateString = /*sql*/ `
CREATE TABLE IF NOT EXISTS weight_tracker (
    id TEXT PRIMARY KEY,               -- UUID v7 sinh từ Client cho từng lần leo lên cân
    weight REAL NOT NULL,              -- Số cân nặng lưu dạng số thực (ví dụ: 65.5)
    log_date TEXT NOT NULL,            -- Định dạng 'YYYY-MM-DD' để phục vụ việc nhóm (GROUP BY) khi vẽ chart
    sync_status TEXT DEFAULT 'pending', -- 'synced', 'pending'
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);
-- Tạo index trên log_date của bảng cân nặng để lúc GROUP BY lấy cân nặng cuối cùng chạy siêu nhanh
CREATE INDEX IF NOT EXISTS idx_weight_tracker_date ON weight_tracker(log_date);
`;