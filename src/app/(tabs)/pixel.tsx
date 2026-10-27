import {
  TAB_BAR_BOTTOM_GAP,
  TAB_BAR_HEIGHT,
  TAB_BAR_SPACE,
} from "@/constants/design";
import NoteModal from "@/components/home/NoteModal";
import PixelHeader from "@/components/pixel/Header";
import PixelDetailSheet from "@/components/pixel/PixelDetailSheet";
import { generateYearGrid } from "@/components/pixel/PixelInYear";
import MonthPixel, {
  generateMonthGrid,
  MONTH_LABELS,
  MonthDayItem,
} from "@/components/pixel/MonthPixel";
import PixelLayoutSheet from "@/components/pixel/PixelLayoutSheet";
import WeekPixel from "@/components/pixel/WeekPixel";
import YearExportView from "@/components/pixel/YearExportView";
import { ThemedText } from "@/components/themed-text";
import { useDBService } from "@/hooks/useDBService";
import { DailyNote, MoodLevel } from "@/interfaces/db.type";
import { WeekItem } from "@/interfaces/pixel";
import { useBottomSheet } from "@/providers/BottomSheet";
import { useAppStore } from "@/stores/appStore";
import {
  loadPixelYear,
  updatePixelNote,
  updatePixelViewMode,
} from "@/stores/pixelAction";
import { usePixelStore } from "@/stores/pixelStore";
import { getContrastTextColor } from "@/utils/color";
import { runDbTask } from "@/utils/dbError";
import { saveToGallery } from "@/utils/image";
import { getLocalTodayStr } from "@/utils/timer";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ViewShot, { ViewShotRef } from "react-native-view-shot";
import { useShallow } from "zustand/react/shallow";

// Khoảng cách giữa các ô, phải khớp gap-1 trong WeekPixel/MonthPixel
const CELL_GAP = 4;
const H_PADDING = 20;
// Cột nhãn bên trái (nút Week, w-15)
const LABEL_WIDTH = 60;
// Số hàng hiển thị trước hàng hiện tại khi cuộn tới
const ROWS_BEFORE_CURRENT = 3;
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Hướng của hàng hôm nay so với vùng đang nhìn thấy; null = đang thấy
type ScrollButton = "back" | "forward" | null;
type GridItem = WeekItem | MonthDayItem;

// Chia đều chiều dài còn lại cho `count` ô vuông
const fitCells = (length: number, count: number) =>
  Math.floor((length - CELL_GAP * (count - 1)) / count);

const PixelScreen = () => {
  const dbService = useDBService();
  const { present } = useBottomSheet();
  const { width } = useWindowDimensions();
  const { theme, weight, updateWeight, settings } = useAppStore(
    useShallow((state) => ({
      theme: state.theme,
      weight: state.weight,
      updateWeight: state.updateWeight,
      settings: state.settings,
    })),
  );
  const { stats, year, yearPixelData, viewMode } = usePixelStore(
    useShallow((state) => ({
      stats: state.stats,
      year: state.year,
      yearPixelData: state.yearPixelData,
      viewMode: state.viewMode,
    })),
  );

  const viewType = settings?.pixel_view_type ?? "week";
  const orientation = settings?.pixel_view_orientation ?? "vertical";
  const isHorizontal = orientation === "horizontal";

  const listRef = useRef<FlatList<GridItem>>(null);
  const todayStr = getLocalTodayStr();
  const isMonth = viewType === "month";

  // Ô vuông lấy layout dọc làm chuẩn: 7 ngày hoặc 12 tháng chia đều chiều rộng
  // (màn hình − padding − cột nhãn). Layout ngang dùng cùng kích thước cho nhất quán.
  const cellCount = isMonth ? 12 : 7;
  const pixelSize = fitCells(width - H_PADDING * 2 - LABEL_WIDTH, cellCount);
  // Chiều dài một hàng/cột theo trục cuộn
  const itemLength = pixelSize + CELL_GAP;

  const sundayFirst = settings?.week_starts_on === "sunday";
  const weekdays = sundayFirst
    ? ["Sun", ...WEEKDAYS.slice(0, 6)]
    : WEEKDAYS;

  const gridData = useMemo(() => {
    return generateYearGrid(year, sundayFirst);
  }, [year, sundayFirst]);
  const monthGrid = useMemo(() => generateMonthGrid(), []);
  const listData: GridItem[] = isMonth ? monthGrid : gridData;

  // Hàng/cột chứa hôm nay, năm khác thì neo về đầu năm
  const anchorIndex = useMemo(() => {
    const index = isMonth
      ? todayStr.startsWith(`${year}-`)
        ? Number(todayStr.slice(8)) - 1
        : -1
      : gridData.findIndex((week) =>
          week.days.some((day) => day.dateString === todayStr),
        );
    return Math.max(0, index);
  }, [isMonth, gridData, todayStr, year]);
  const scrollTargetIndex = Math.max(0, anchorIndex - ROWS_BEFORE_CURRENT);

  const [scrollButton, setScrollButton] = useState<ScrollButton>(null);

  // List mở ở initialScrollIndex mà không bắn onScroll → offset khởi đầu là vị trí đó
  const lastOffset = useRef(scrollTargetIndex * itemLength);
  const scrollButtonRef = useRef<ScrollButton>(null);
  // Chiều dài thật của vùng lưới theo trục cuộn (đo bằng onLayout)
  const listLength = useRef(0);

  // Chỉ hiện nút khi hàng neo nằm ngoài vùng nhìn thấy, mũi tên chỉ về phía nó
  const updateScrollButton = useCallback(
    (offset: number) => {
      lastOffset.current = offset;
      if (!listLength.current) return;

      const start = anchorIndex * itemLength;
      const end = start + itemLength;

      let nextButton: ScrollButton = null;
      if (end <= offset) nextButton = "back";
      else if (start >= offset + listLength.current) nextButton = "forward";

      if (nextButton !== scrollButtonRef.current) {
        scrollButtonRef.current = nextButton;
        setScrollButton(nextButton);
      }
    },
    [anchorIndex, itemLength],
  );

  const scrollToWeek = useCallback((index: number) => {
    listRef.current?.scrollToIndex({ index, animated: true });
  }, []);

  const [moodModalVisible, setMoodModalVisible] = useState(false);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dateNote, setDateNote] = useState<DailyNote | null>(null);

  const handleSelectMood = async (
    mood?: MoodLevel,
    note?: string,
    newWeight?: number,
    date?: string,
  ) => {
    if (!dbService) return console.log("db not ready");

    await dbService.setDailyNote(mood, note, undefined, date);
    await updatePixelNote(dbService, date || todayStr);

    if (date !== todayStr) {
      if (newWeight) await dbService.updateWeight(newWeight, date);
    } else {
      if (newWeight && weight !== newWeight) {
        await dbService.updateWeight(newWeight);
        updateWeight(newWeight);
      }
    }
  };

  const handleSelectDate = useCallback(
    async (date: string) => {
      setSelectedDate(date);
      setDateNote(yearPixelData[date]?.note ?? null);
      const data = yearPixelData[date];
      if (!data) {
        return setMoodModalVisible(true);
        // Chưa có dữ liệu - Mở modal add dữ liệu ngày
      }

      if (data.note || data.logs.length > 0) {
        present(
          <PixelDetailSheet
            dateString={date}
            note={data.note}
            log={data.logs}
          />,
          {
            snapPoints: ["100%"],
          },
        );
      } else if (data.shieldLog) {
        // TODO: Show shield log detail
      }
    },
    [yearPixelData, present],
  );

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { x, y } = e.nativeEvent.contentOffset;
      updateScrollButton(isHorizontal ? x : y);
    },
    [updateScrollButton, isHorizontal],
  );

  // List được remount khi đổi layout/năm nên trạng thái nút cuộn phải reset theo
  useEffect(() => {
    lastOffset.current = scrollTargetIndex * itemLength;
    scrollButtonRef.current = null;
    setScrollButton(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orientation, viewType, year, pixelSize, sundayFirst]);

  // Refetch data on screen focus
  useFocusEffect(
    useCallback(() => {
      const task = requestIdleCallback(() => {
        runDbTask("loadPixelYear", () => loadPixelYear(dbService, year));
      });

      return () => {
        cancelIdleCallback(task);
      };
      // dbService đổi khi SQLiteProvider mở lại kết nối → phải load bằng instance mới
    }, [year, dbService]),
  );

  const exportRef = useRef<ViewShotRef>(null);
  // Ảnh export vẽ cả năm nên chỉ mount khi bấm lưu, chụp xong thì gỡ ra
  const [isExporting, setIsExporting] = useState(false);
  const isCapturing = useRef(false);

  const handleExport = () => setIsExporting(true);

  const captureExport = async () => {
    if (isCapturing.current) return;
    isCapturing.current = true;
    try {
      // Chờ ảnh huy hiệu (expo-image) tải xong trước khi chụp
      await new Promise((resolve) => setTimeout(resolve, 300));

      const uri = await exportRef.current?.capture?.();
      if (!uri) return;

      await saveToGallery(uri);

      Alert.alert("Thành công", "Đã lưu ảnh vào thư viện ảnh.");
    } catch (error) {
      console.error("Export image error:", error);
      Alert.alert("Lỗi", "Không thể lưu ảnh. Vui lòng thử lại.");
    } finally {
      isCapturing.current = false;
      setIsExporting(false);
    }
  };

  const openPixelLayoutSheet = () => {
    present(<PixelLayoutSheet />, {
      snapPoints: ["80%"],
    });
  };

  const inset = useSafeAreaInsets();

  const weekButton = (
    <TouchableOpacity
      onPress={openPixelLayoutSheet}
      activeOpacity={0.7}
      hitSlop={25}
      style={{ borderTopLeftRadius: 4 }}
      className="w-15 h-12 bg-primary justify-center items-center"
    >
      <ThemedText
        size="xs"
        weight="bold"
        colorHex={getContrastTextColor(theme.primary)}
      >
        {isMonth ? "Day" : "Week"}
      </ThemedText>
    </TouchableOpacity>
  );

  const axisLabels = isMonth ? MONTH_LABELS : weekdays;

  const list = (
    <FlatList
      // Đổi trục cuộn / kiểu lưới trên cùng một instance làm hỏng offset và layout cache → remount
      key={`${viewType}-${orientation}-${year}-${pixelSize}-${sundayFirst}`}
      ref={listRef}
      data={listData}
      horizontal={isHorizontal}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={
        isHorizontal ? { paddingRight: 20 } : { paddingBottom: TAB_BAR_SPACE }
      }
      scrollEventThrottle={32}
      onScroll={handleScroll}
      onLayout={(e) => {
        const { width: w, height: h } = e.nativeEvent.layout;
        listLength.current = isHorizontal ? w : h;
        updateScrollButton(lastOffset.current);
      }}
      initialScrollIndex={scrollTargetIndex}
      getItemLayout={(_, index) => ({
        length: itemLength,
        offset: itemLength * index,
        index,
      })}
      keyExtractor={(item) =>
        "day" in item ? `d${item.day}` : `w${item.weekIndex}`
      }
      renderItem={({ item }) => (
        <View
          style={isHorizontal ? { width: itemLength } : { height: itemLength }}
        >
          {"day" in item ? (
            <MonthPixel
              size={pixelSize}
              orientation={orientation}
              item={item}
              year={year}
              todayStr={todayStr}
              viewMode={viewMode}
              yearPixelData={yearPixelData}
              onSelectDate={handleSelectDate}
            />
          ) : (
            <WeekPixel
              size={pixelSize}
              orientation={orientation}
              week={item}
              todayStr={todayStr}
              viewMode={viewMode}
              yearPixelData={yearPixelData}
              onSelectDate={handleSelectDate}
            />
          )}
        </View>
      )}
    />
  );

  return (
    <View
      style={{ paddingTop: inset.top, paddingBottom: inset.bottom }}
      className="flex-1 bg-background"
    >
      {isExporting && (
        <View
          style={{
            position: "absolute",
            left: -10000,
            top: 0,
          }}
          pointerEvents="none"
        >
          <ViewShot
            ref={exportRef}
            options={{ format: "png", quality: 1 }}
            onLayout={captureExport}
          >
            <YearExportView
              gridData={gridData}
              monthGrid={monthGrid}
              viewType={viewType}
              orientation={orientation}
              weekdays={weekdays}
            />
          </ViewShot>
        </View>
      )}
      <NoteModal
        dateStr={selectedDate ?? undefined}
        visible={moodModalVisible}
        setVisible={setMoodModalVisible}
        onSelectMood={handleSelectMood}
        note={dateNote?.note}
        mood={dateNote?.mood_level}
      />
      {scrollButton && (
        <Pressable
          onPress={() => scrollToWeek(scrollTargetIndex)}
          hitSlop={8}
          className="absolute right-5 z-10 h-12 w-12 items-center justify-center rounded-full bg-primary"
          style={{
            // Nằm ngay trên tab bar nổi
            bottom: inset.bottom + TAB_BAR_BOTTOM_GAP + TAB_BAR_HEIGHT + 12,
            boxShadow: `0px 4px 12px ${theme.primary}55`,
          }}
        >
          <Feather
            name={
              isHorizontal
                ? scrollButton === "back"
                  ? "arrow-left"
                  : "arrow-right"
                : scrollButton === "back"
                  ? "arrow-up"
                  : "arrow-down"
            }
            size={20}
            color={getContrastTextColor(theme.primary)}
          />
        </Pressable>
      )}

      <View style={{ paddingHorizontal: 20 }}>
        <PixelHeader
          onSaveImage={handleExport}
          stats={stats}
          year={year}
          setYear={async (year) => await loadPixelYear(dbService, year)}
          viewMode={viewMode}
          setViewMode={async (mode) => updatePixelViewMode(dbService, mode)}
        />
      </View>

      {isHorizontal ? (
        // Lịch ngang: cột thứ cố định bên trái, các tuần cuộn ngang bên phải
        <View className="flex-1 flex-row" style={{ paddingLeft: H_PADDING }}>
          <View className="bg-background">
            {weekButton}
            <View className="gap-1">
              {axisLabels.map((label) => (
                <View
                  key={label}
                  style={{ height: pixelSize }}
                  className="items-center justify-center w-15"
                >
                  <ThemedText size="xxs" color="text" opacity="medium">
                    {label}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>
          {list}
        </View>
      ) : (
        // Lịch dọc: hàng nhãn cố định phía trên, các hàng cuộn dọc bên dưới
        <View className="flex-1" style={{ paddingHorizontal: H_PADDING }}>
          <View className="flex-row items-end mb-2 border-b border-text-base/10">
            {weekButton}
            <View className="flex-row gap-1">
              {axisLabels.map((label) => (
                <View
                  key={label}
                  style={{ width: pixelSize }}
                  className="items-center justify-center pb-1"
                >
                  <ThemedText size="xxs" color="text" opacity="medium">
                    {isMonth ? label.charAt(0) : label}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>
          {list}
        </View>
      )}
    </View>
  );
};

export default PixelScreen;
