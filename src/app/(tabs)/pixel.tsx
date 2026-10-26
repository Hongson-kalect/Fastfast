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

const EXPORT_WIDTH = 600;
// Khoảng cách giữa các ô, phải khớp gap-1 trong WeekPixel/MonthPixel
const CELL_GAP = 4;
const H_PADDING = 20;
// Cột nhãn bên trái (nút Week, w-15)
const LABEL_WIDTH = 60;
// Số hàng hiển thị trước hàng hiện tại khi cuộn tới
const ROWS_BEFORE_CURRENT = 3;
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type ScrollButton = "back" | "current" | null;
type GridItem = WeekItem | MonthDayItem;

// Chia đều chiều dài còn lại cho `count` ô vuông
const fitCells = (length: number, count: number) =>
  Math.floor((length - CELL_GAP * (count - 1)) / count);

const PixelScreen = () => {
  const dbService = useDBService();
  const { present } = useBottomSheet();
  const { width, height } = useWindowDimensions();
  const { updateSetting, theme, weight, updateWeight, settings } =
    useAppStore();
  const { stats, year, yearPixelData, viewMode } = usePixelStore();

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

  // Hàng/cột hiện tại lấy từ chính grid, năm khác thì về đầu năm
  const scrollTargetIndex = useMemo(() => {
    const index = isMonth
      ? todayStr.startsWith(`${year}-`)
        ? Number(todayStr.slice(8)) - 1
        : -1
      : gridData.findIndex((week) =>
          week.days.some((day) => day.dateString === todayStr),
        );
    return Math.max(0, index - ROWS_BEFORE_CURRENT);
  }, [isMonth, gridData, todayStr, year]);

  const [scrollButton, setScrollButton] = useState<ScrollButton>(null);

  const lastOffset = useRef(0);
  const scrollButtonRef = useRef<ScrollButton>(null);

  const updateScrollButton = useCallback(
    (offset: number) => {
      const viewport = isHorizontal ? width : height;
      const targetOffset = scrollTargetIndex * itemLength;
      const scrollingBack = offset < lastOffset.current;

      let nextButton: ScrollButton = null;

      if (scrollingBack && offset > viewport) {
        nextButton = "back";
      } else if (
        !scrollingBack &&
        offset > itemLength &&
        offset < targetOffset - viewport
      ) {
        nextButton = "current";
      }

      if (nextButton !== scrollButtonRef.current) {
        scrollButtonRef.current = nextButton;
        setScrollButton(nextButton);
      }

      lastOffset.current = offset;
    },
    [isHorizontal, width, height, scrollTargetIndex, itemLength],
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

  useEffect(() => {
    dbService.setting("pixel_view_mode", viewMode || "fasting");
    updateSetting({ pixel_view_mode: viewMode });
  }, [viewMode, dbService, updateSetting]);

  // List được remount khi đổi chiều/năm nên trạng thái nút cuộn phải reset theo
  useEffect(() => {
    lastOffset.current = 0;
    scrollButtonRef.current = null;
    setScrollButton(null);
  }, [orientation, viewType, year]);

  // Refetch data on screen focus
  useFocusEffect(
    useCallback(() => {
      const task = requestIdleCallback(() => {
        loadPixelYear(dbService, year);
      });

      return () => {
        cancelIdleCallback(task);
      };
    }, [year, loadPixelYear]),
  );

  const exportRef = useRef<ViewShotRef>(null);

  const handleExport = async () => {
    try {
      if (!exportRef.current) return;

      const uri = await exportRef.current.capture();
      if (!uri) return;

      await saveToGallery(uri);

      Alert.alert("Thành công", "Đã lưu ảnh vào thư viện ảnh.");
    } catch (error) {
      console.error("Export image error:", error);
      Alert.alert("Lỗi", "Không thể lưu ảnh. Vui lòng thử lại.");
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
        isHorizontal ? { paddingRight: 20 } : { paddingBottom: 40 }
      }
      scrollEventThrottle={32}
      onScroll={handleScroll}
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
      <View
        style={{
          position: "absolute",
          left: -10000,
          top: 0,
          width: EXPORT_WIDTH,
        }}
        pointerEvents="none"
      >
        <ViewShot ref={exportRef} options={{ format: "png", quality: 1 }}>
          <YearExportView gridData={gridData} />
        </ViewShot>
      </View>
      <NoteModal
        dateStr={selectedDate ?? undefined}
        visible={moodModalVisible}
        setVisible={setMoodModalVisible}
        onSelectMood={handleSelectMood}
        note={dateNote?.note}
        mood={dateNote?.mood_level}
      />
      <View className="absolute bottom-12 right-2 z-10">
        {scrollButton === "back" && (
          <Pressable
            onPress={() => scrollToWeek(0)}
            className="h-12 w-12 items-center justify-center rounded-full bg-primary/60"
          >
            <Feather
              name={isHorizontal ? "arrow-left" : "arrow-up"}
              size={20}
              color={theme.background}
            />
          </Pressable>
        )}

        {scrollButton === "current" && (
          <Pressable
            onPress={() => scrollToWeek(scrollTargetIndex)}
            className="h-12 w-12 items-center justify-center rounded-full bg-primary/60"
          >
            <Feather
              name={isHorizontal ? "arrow-right" : "arrow-down"}
              size={20}
              color={theme.background}
            />
          </Pressable>
        )}
      </View>

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
