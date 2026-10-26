import { AppSettings, Theme } from "@/interfaces/db.type";
import { SQLiteDatabase } from "expo-sqlite";

export const generateString = /*sql*/ `
CREATE TABLE IF NOT EXISTS theme (
    id TEXT PRIMARY KEY,

    name TEXT NOT NULL UNIQUE,

    color_palette TEXT NOT NULL DEFAULT '{}',

    font TEXT NOT NULL DEFAULT 'System',

    priority REAL NOT NULL DEFAULT 1.0,
    -- is_default INTEGER NOT NULL DEFAULT 0,
    -- is_active INTEGER NOT NULL DEFAULT 0,

    expired_at TEXT DEFAULT NULL,
    is_delete_on_expired INTEGER NOT NULL DEFAULT 0,

    is_deleted INTEGER NOT NULL DEFAULT 0,

    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    updated_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_theme_single_default
ON theme(priority);

CREATE UNIQUE INDEX IF NOT EXISTS idx_theme_single_active
ON theme(is_deleted);
`;

export const getThemes = async (db: SQLiteDatabase): Promise<ThemeType[]> => {
  try{

    const rows = await db.getAllAsync<Theme & { color_palette: string }>(
      `SELECT * FROM theme WHERE is_deleted = 0 ORDER BY priority DESC;`,
    );
  return rows.map((row) => ({
    ...row,
    color_palette: JSON.parse(row.color_palette || "{}"),
  }));
}catch(e){console.log('error on getThemes', e); return [];}
};

export const getActiveTheme = async (
  db: SQLiteDatabase,
): Promise<ThemeType | null> => {
  try{

    const now = new Date().toISOString();
    const row = await db.getFirstAsync<Theme & { color_palette: string }>(
      `SELECT * FROM theme WHERE (expired_at IS NULL OR expired_at > "${now}") AND is_deleted = 0 ORDER BY priority DESC LIMIT 1;`,
    );
    if (!row) return null;
  
    return {
      ...row,
      color_palette: JSON.parse(row.color_palette || "{}"),
    };
  }catch(e){console.log('error on getActiveTheme', e); return null;}
};

const lightTheme = {
  primary: "#ff0000",
  secondary: "#FF7700",
  tertiary: "#BBDEFB",
  title: "#0D47A1",
  success: "#4CAF50",
  error: "#E60000",
  warning: "#FF9800",
  disabled: "#BDBDBD",
  link: "#3F51B5",
  text: "#212121",
  subText1: "#424242",
  subText2: "#757575",
  subText3: "#BDBDBD",
  background: "#FFFFFF",
  background2: "#f8f8f8",
  constract: "#FFFFFF",
  card: "#F5F5F5",
  white: "#FFFFFF",

  // primary: "#60A5FA", // Xanh chủ đạo (Nút bấm chính)
  // secondary: "#7EF9FF", // Xanh phụ
  // title: "#F8FAFC", // Chữ tiêu đề lớn
  // text: "#94A3B8", // Chữ nội dung
  textSecondary: "#B0B4BA",
  // background: "#0B1528", // Nền sâu nhất
  backgroundSecondary: "#16223F", // Nền thẻ card
  backgroundElement: "#212225",
  backgroundSelected: "#2E3135",
  // error: "#EF4444",
  // success: "#22C55E",
  // white: "#ffffff",
  black: "#000000",
};

export const darkTheme = {
  primary: "#3B82F6", // Xanh da trời sáng hơn (trên nền tối)
  secondary: "#64B5F6", // Xanh phụ giống theme sáng
  tertiary: "#BBDEFB", // Xanh phụ nhạt nhất
  title: "#E3F2FD", // Màu tiêu đề sáng hơn

  success: "#81C784", // Xanh thành công dịu hơn
  error: "#E60000", // Đỏ nhẹ cho lỗi
  warning: "#FFB74D", // Cam cảnh báo mềm
  disabled: "#BDBDBD", // Màu vô hiệu hóa
  link: "#3F51B5", // Màu liên kết

  text: "#FFFFFF", // Text chính – trắng
  subText1: "#EEEEEE", // Text phụ cấp 1
  subText2: "#BDBDBD", // Text phụ cấp 2
  subText3: "#9E9E9E", // Text phụ cấp 3

  background: "#121212", // Nền tối
  background2: "#18181b",
  constract: "#1E1E1E", // Màu cho nút, tương phản với nền sáng
  card: "#1E1E1E", // Nền thẻ dạng tối
  white: "#FFFFFF",

  // primary: "#3B82F6", // Xanh chủ đạo (Nút bấm chính)
  // secondary: "#10B981", // Xanh phụ
  // title: "#F8FAFC", // Chữ tiêu đề lớn
  // text: "#000000",
  textSecondary: "#60646C",
  // background: "#ffffff",
  backgroundSecondary: "#f5f5f5",
  backgroundElement: "#F0F0F3",
  backgroundSelected: "#E0E1E6",
  // error: "#EF4444",
  // success: "#22C55E",
  // white: "#ffffff",
  black: "#000000",
};

export type ColorPalette = typeof lightTheme;

export const defaultTheme = {
  id: "default_theme",
  name: "default",
  color_palette: {
    light: lightTheme,
    dark: darkTheme,
  },
};

export type ThemeType = typeof defaultTheme;

export const extractTheme = (
  themes: (typeof defaultTheme)[],
  settings: AppSettings | null,
): {
  themeObj: typeof defaultTheme;
  theme: typeof lightTheme;
  is_dark_mode: boolean;
} => {
  const theme =
    themes.find((t) => t.id === settings?.theme) || themes[0] || defaultTheme;
  const is_dark_mode = settings?.is_dark_mode || true;

  return {
    themeObj: {
      id: theme.id,
      name: theme.name,
      color_palette: theme.color_palette,
    },
    theme: is_dark_mode ? theme.color_palette.dark : theme.color_palette.light,
    is_dark_mode: is_dark_mode,
  };
};

const themes = [
  {
    id: "018f0000-0000-7000-8000-000000000001",
    name: "Default Light",
    palette: lightTheme,
  },
  {
    id: "018f0000-0000-7000-8000-000000000002",
    name: "Default Dark",
    palette: darkTheme,
  },
];

const values = themes
  .map(
    (t) => `(
      '${t.id}',
      '${t.name.replace(/'/g, "''")}',
      '${JSON.stringify(t.palette).replace(/'/g, "''")}',
      'System',
      0.5
    )`,
  )
  .join(",");

export const seedData = `
INSERT OR IGNORE INTO theme (
  id,
  name,
  color_palette,
  font,
  priority
)
VALUES ${values};
`;
