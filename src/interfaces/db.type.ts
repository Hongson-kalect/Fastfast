// @/interfaces/db.type.ts

export type SyncStatus = 'synced' | 'pending' | 'failed';
export type AccountType = 'free' | 'premium';
export type MoodLevel = 1 | 2 | 3 | 4 | 5; // 1: Tired -> 5: Happy

// 1. Interface cho bảng app_settings
export interface AppSettings {
  [key: string]: string | number|boolean
}

// 2. Interface cho bảng user_profile
export interface UserProfile {
  id: string; // UUID v7
  name: string | null;
  account_type: AccountType;
  image_uri: string | null; // Đường dẫn ảnh local
  upload_url: string | null;
  backup_url: string | null;
  sync_status: SyncStatus;
  created_at: number; // Epoch timestamp (giây)
  updated_at: number; // Epoch timestamp (giây)
}

// 3. Interface cho bảng fast_sessions
export interface FastSession {
  id: string; // UUID v7
  user_id: string;
  start_time: number; // Epoch timestamp (giây)
  end_time: number | null; // NULL nếu phiên đang chạy real-time
  target_duration: number; // Mục tiêu nhịn (16, 18, 20, 48...)
  home_data_snapshot: string | null; // JSON.stringify() của các chỉ số sinh học lúc kết thúc
  rating: string | null; // Đánh giá phiên ('Excellent', 'Good', 'Failed')
  is_deleted: 0 | 1; // SQLite không có BOOLEAN, dùng 0 (false) và 1 (true)
  sync_status: SyncStatus;
  created_at: number;
  updated_at: number;
}

// 4. Interface cho bảng daily_logs
export interface DailyLog {
  log_date: string; // Định dạng 'YYYY-MM-DD'
  user_id: string;
  fast_id: string; // ID của phiên gốc đóng góp giờ lớn nhất ngày hôm đó
  hours_in_day: number; // Số giờ nhịn thực tế trong ngày (<= 24)
  hours_in_fast: number; // Số giờ nhịn thực tế trong ngày (<= 24)
  is_deleted: 0 | 1;
  sync_status: SyncStatus;
  created_at: number;
  updated_at: number;
}

// 4. Interface cho bảng daily_logs
export interface DailyNote {
  log_date: string; // Định dạng 'YYYY-MM-DD'
  mood_level: MoodLevel | null;
  note: string | null;
  image_uri: string | null; // Ảnh gắn kèm note ngày hôm đó
  sync_status: SyncStatus;
  created_at: number;
  updated_at: number;
}


export interface Theme {
  id: string;
  name: string;
  color_palette: string; // JSON string
  font: string | null;
  priority: number;
  is_deleted: number;
  created_at: string;
  updated_at: string;
}

// 💡 Gợi ý thêm các Type Utility phục vụ lúc INSERT (không cần truyền các trường tự sinh)
export type InsertFastSessionInput = Omit<FastSession, 'created_at' | 'updated_at' | 'is_deleted' | 'sync_status'>;
export type InsertDailyLogInput = Omit<DailyLog, 'created_at' | 'updated_at' | 'is_deleted' | 'sync_status'>;