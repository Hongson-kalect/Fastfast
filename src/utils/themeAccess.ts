import { getThemeAccess, themes } from "@/constants/themes";
import { createDBService } from "@/database";
import { updateTheme } from "@/stores/appAction";
import { useAppStore } from "@/stores/appStore";
import { SQLiteDatabase } from "expo-sqlite";

/** Theme có dùng được lúc này không (đã mua, miễn phí trong dịp sự kiện, Pro với theme premium) */
const canUseTheme = (
  themeId: string,
  ownedIds: Set<string>,
  isPremium: boolean,
  now = new Date(),
) => {
  const theme = themes[themeId];
  if (!theme) return false;
  const access = getThemeAccess(theme, ownedIds.has(themeId), now);
  return access === "available" || access === "free" || (access === "premium" && isPremium);
};

/**
 * Theme đang dùng hết hạn (theme limited đã qua dịp mà chưa mua) thì đổi về theme
 * trước đó nếu còn dùng được, không thì về mặc định. Trả về theme cũ/mới để báo
 * cho người dùng; null khi không phải đổi.
 */
export const enforceThemeAccess = async (
  db: SQLiteDatabase,
): Promise<{ from: string; to: string } | null> => {
  const { settings, userProfile } = useAppStore.getState();
  const current = settings?.theme || "default";
  // Chỉ theme limited mới hết hạn theo thời gian
  if (themes[current]?.type !== "limited") return null;

  const dbService = createDBService(db);
  const assets = userProfile ? await dbService.getUserAssets(userProfile.id, "theme") : [];
  const ownedIds = new Set(assets.map((item) => item.asset_id));
  const isPremium = userProfile?.account_type === "premium";

  if (canUseTheme(current, ownedIds, isPremium)) return null;

  const previous = settings?.previous_theme;
  const fallback =
    previous && previous !== current && canUseTheme(previous, ownedIds, isPremium)
      ? previous
      : "default";

  await updateTheme(db, fallback);
  return { from: current, to: fallback };
};
