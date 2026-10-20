import { DBService } from "@/hooks/useDBService";
import { ViewMode } from "@/interfaces/pixel";
import { buildPixelYearData } from "@/util/dashboard/utils";
import { useAppStore } from "./appStore";
import { usePixelStore } from "./pixelStore";

const DEFAULT_VIEW_MODE: ViewMode = "fasting";

export const initializePixel = async (
  db: DBService,
  year: number,
  currentFastSession?: Parameters<
    typeof buildPixelYearData
  >[0]["currentFastSession"],
) => {
  const settings = useAppStore.getState().settings;

  const viewMode = settings?.pixel_view_mode || DEFAULT_VIEW_MODE;

  usePixelStore.getState().setIsLoading(true);

  const [logs, notes, shieldUsed] = await Promise.all([
    db.getPixelLogData(year),
    db.getPixelNoteData(year),
    db.getPixelShielLog(year),
  ]);

  const { yearMap, stats, counter } = buildPixelYearData({
    logs,
    notes,
    shieldUsed,
    currentFastSession,
  });

  usePixelStore.getState().hydratePixel({
    year,
    viewMode,
    yearPixelData: yearMap,
    stats,
    counter
  });

  console.log("=> [Pixel] Khởi tạo dữ liệu thành công!", {
    year,
    viewMode,
    logs: logs,
    stats,
  });

  return {
    yearPixelData: yearMap,
    stats,
    viewMode,
  };
};

export const loadPixelYear = async (
  db: DBService,
  year: number,
) => {
  const { setIsLoading, updatePixel } = usePixelStore.getState();
  const {currentFastSession} = useAppStore.getState();

  setIsLoading(true);

  try {
    const [logs, notes, shieldUsed] = await Promise.all([
      db.getPixelLogData(year),
      db.getPixelNoteData(year),
      db.getPixelShielLog(year),
    ]);

    const { yearMap, stats,counter } = buildPixelYearData({
      logs,
      notes,
      shieldUsed,
      currentFastSession,
    });

    updatePixel({ year, yearPixelData: yearMap, stats, counter });

    return {
      yearPixelData: yearMap,
      stats,
    };
  } finally {
    setIsLoading(false);
  }
};

// Thằng này chỉ update pixel year chủa 1 thằng
export const updatePixelNote = async (db: DBService, date: string) => {
  const { setYearPixelData, yearPixelData } = usePixelStore.getState();
  const note = await db.getDailyNote(date);
  const oldYearPixelData = yearPixelData[date];
  const newYearPixelData = {
    ...oldYearPixelData,
    note: note||undefined,
  };

  setYearPixelData({
    ...yearPixelData,
    [date]: newYearPixelData,
  });
};

export const updatePixelViewMode = async (
  db: DBService,
  viewMode: ViewMode,
) => {
  await db.setting("pixel_view_mode", viewMode);

  usePixelStore.getState().setViewMode(viewMode);
};
