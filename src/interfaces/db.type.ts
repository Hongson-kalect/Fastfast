// @/interfaces/db.type.ts

import { ChartRangeKey } from "@/constants/data";
import { ColorPalette } from "@/database/shema/theme";

export type SyncStatus = "synced" | "pending" | "failed";
export type AccountType = "free" | "premium";
export type MoodLevel = 1 | 2 | 3 | 4 | 5; // 1: Tired -> 5: Happy

// 1. Interface cho bảng app_settings
export interface AppSettings {
  target?: number;
  weight_target?: number;
  chart_range?: ChartRangeKey;
  is_dark_mode?: boolean;
  theme?: string;
  language?: string;
}

// 2. Interface cho bảng user_profile
export interface UserProfile {
  id: string; // UUID v7
  name: string | null;
  account_type: AccountType;
  image_uri: string | null; // Đường dẫn ảnh local
  current_streak: number;
  streak_date: string;
  max_streak: number;
  last_fast_completed_at: number;
  rest_point: number;
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
  status: 'active'|'completed'|'failed';
  created_at: number;
  updated_at: number;
}

// 4. Interface cho bảng daily_logs
export interface DailyLog {
  log_date: string; // Định dạng 'YYYY-MM-DD'
  user_id: string;
  fast_id: string; // ID của phiên gốc đóng góp giờ lớn nhất ngày hôm đó
  hours_in_day: number; // Số giờ nhịn thực tế trong ngày (<= 24)
  elapsed_hours: number; // Số giờ nhịn thực tế trong ngày (<= 24)
  hours_in_fast: number; // Số giờ nhịn thực tế trong ngày (<= 24)
  is_deleted: 0 | 1;
  sync_status: SyncStatus;
  created_at: number;
  updated_at: number;
}

// 4. Interface cho bảng daily_logs
export interface DailyNote {
  log_date: string; // Định dạng 'YYYY-MM-DD'
  mood_level?: MoodLevel;
  note?: string;
  image_uri?: string; // Ảnh gắn kèm note ngày hôm đó
  sync_status: SyncStatus;
  created_at: number;
  updated_at: number;
}

export interface WeightLog {
  id: string; // UUID v7
  weight: number;
  log_date: string;
  sync_status: SyncStatus;
  created_at: string;
  updated_at: string;
}

// Dynamic type definition cho Target Goal
export type TargetStatus = "active" | "completed" | "abandoned";

export interface WeightTarget {
  id: string; // UUID v7 hoặc string ID duy nhất
  start_weight: number;
  target_weight: number;
  start_date: string; // YYYY-MM-DD
  target_date?: string | null; // YYYY-MM-DD (nullable)
  status: TargetStatus;
  is_active: number;
  is_completed: number;
  sync_status: "synced" | "pending";
  created_at: number;
  updated_at: number;
}

export interface Theme {
  id: string;
  name: string;
  color_palette: {
    light: ColorPalette;
    dark: ColorPalette;
  };
  font?: string | null;
  priority?: number;
  is_deleted: number;
  created_at: string;
  updated_at: string;
}

// 💡 Gợi ý thêm các Type Utility phục vụ lúc INSERT (không cần truyền các trường tự sinh)
export type InsertFastSessionInput = Omit<
  FastSession,
  "created_at" | "updated_at" | "is_deleted" | "sync_status"
>;
export type InsertDailyLogInput = Omit<
  DailyLog,
  "created_at" | "updated_at" | "is_deleted" | "sync_status"
>;
