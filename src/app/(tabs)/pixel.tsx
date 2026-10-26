import NoteModal from "@/components/home/NoteModal";
import PixelHeader from "@/components/pixel/Header";
import PixelDetailSheet from "@/components/pixel/PixelDetailSheet";
import { generateYearGrid } from "@/components/pixel/PixelInYear";
import PixelLayoutSheet from "@/components/pixel/PixelLayoutSheet";
import WeekPixel from "@/components/pixel/WeekPixel";
import YearExportView from "@/components/pixel/YearExportView";
import { ThemedText } from "@/components/themed-text";
import { useDBService } from "@/hooks/useDBService";
import { DailyNote, MoodLevel } from "@/interfaces/db.type";
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
import { getWeek } from "date-fns";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  SectionList,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ViewShot, { ViewShotRef } from "react-native-view-shot";


const ITEM_HEIGHT = 40;
const HEADER_HEIGHT = 60;
const EXPORT_WIDTH = 600;

const PixelScreen = () => {
  const dbService = useDBService();
  const { present } = useBottomSheet();
  const { width, height } = useWindowDimensions();
  const { updateSetting, theme, weight, updateWeight, settings } =
    useAppStore();
  const { stats, year, yearPixelData, viewMode } = usePixelStore();

  const viewType = settings?.pixel_view_type ?? "week";
  const orientation = settings?.pixel_view_orientation ?? "vertical";

  const sectionListRef = useRef<SectionList>(null);
  const todayStr = getLocalTodayStr();

  type ScrollButton = "up" | "down" | null;

  const [scrollButton, setScrollButton] = useState<ScrollButton>(null);

  const lastScrollY = useRef(0);
  const scrollButtonRef = useRef<ScrollButton>(null);

  const currentWeekY = Math.max(0, getWeek(new Date()) - 4);

  const updateScrollButton = useCallback(
    (y: number) => {
      const scrollingUp = y < lastScrollY.current;

      let nextButton: ScrollButton = null;

      if (scrollingUp && y > height) {
        nextButton = "up";
      } else if (
        !scrollingUp &&
        y > ITEM_HEIGHT &&
        currentWeekY * ITEM_HEIGHT + HEADER_HEIGHT > height &&
        y < currentWeekY * ITEM_HEIGHT + HEADER_HEIGHT - height
      ) {
        nextButton = "down";
      }

      if (nextButton !== scrollButtonRef.current) {
        scrollButtonRef.current = nextButton;
        setScrollButton(nextButton);
      }

      lastScrollY.current = y;
    },
    [height, currentWeekY],
  );

  const scrollToSection = useCallback((sectionIndex: number, itemIndex = 0) => {
    sectionListRef.current?.scrollToLocation({
      sectionIndex,
      itemIndex,
      animated: true,
    });
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

    // animationProgress.value = 0;
    // setIsMenuOpen(false);
    // await dbService.setDailyNote(mood, note, todayData.image);

    await dbService.setDailyNote(mood, note, undefined, date);
    // await loadPixelYear(dbService, year);
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
      updateScrollButton(e.nativeEvent.contentOffset.y);
    },
    [updateScrollButton],
  );

  useEffect(() => {
    dbService.setting("pixel_view_mode", viewMode || "fasting");
    updateSetting({ pixel_view_mode: viewMode });
  }, [viewMode, dbService, updateSetting]);

  // Initial Auto Scroll to Current Week
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToSection(0, currentWeekY);
    }, 500);
    return () => clearTimeout(timer);
  }, [currentWeekY, scrollToSection]);

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

  const gridData = useMemo(() => {
    return generateYearGrid(year);
  }, [year]);
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

  const numberOfColumns = viewType === "week" ? 7 : 12;
  const pixelSize = (width - 40 - 60 - numberOfColumns) / numberOfColumns;

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
        {scrollButton === "up" && (
          <Pressable
            onPress={() => scrollToSection(0)}
            className="h-12 w-12 items-center justify-center rounded-full bg-primary/60"
          >
            <Feather name="arrow-up" size={20} color={theme.background} />
          </Pressable>
        )}

        {scrollButton === "down" && (
          <Pressable
            onPress={() => scrollToSection(0, currentWeekY)}
            className="h-12 w-12 items-center justify-center rounded-full bg-primary/60"
          >
            <Feather name="arrow-down" size={20} color={theme.background} />
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

      <SectionList
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ref={sectionListRef}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 40,
          gap: 2,
        }}
        scrollEventThrottle={32}
        onScroll={handleScroll}
        getItemLayout={(data, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
        sections={[{ key: "calendar", data: gridData }]}
        // ListHeaderComponent={
        //   <PixelHeader
        //     onSaveImage={handleExport}
        //     stats={stats}
        //     year={year}
        //     setYear={async (year) => await loadPixelYear(dbService, year)}
        //     viewMode={viewMode}
        //     setViewMode={async (mode) => updatePixelViewMode(dbService, mode)}
        //   />
        // }
        renderSectionHeader={() => (
          <View className="bg-background rounded-lg overflow-hidden">
            {orientation === "vertical" ? (
              // Header của lịch dọc
              <View className="flex-row items-center mb-2 pr-1 border-b border-text-base/10">
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
                    style={{ paddingVertical: 4 }}
                  >
                    Week
                  </ThemedText>
                </TouchableOpacity>

                <View className="flex-1 flex-row justify-between">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                    (day) => (
                      <View
                        key={day}
                        className="flex-1 items-center justify-center pt-4"
                      >
                        <ThemedText size="xxs" color="text" opacity="medium">
                          {day}
                        </ThemedText>
                      </View>
                    ),
                  )}
                </View>
              </View>
            ) : (
              // Header của lịch ngang
              <View className="flex-col gap-1">
                <TouchableOpacity
                  onPress={openPixelLayoutSheet}
                  activeOpacity={0.7}
                  className="w-15 h-12 bg-primary justify-center items-center py-2"
                  style={{ borderTopLeftRadius: 4 }}
                >
                  <ThemedText
                    size="xs"
                    weight="bold"
                    colorHex={getContrastTextColor(theme.primary)}
                  >
                    Week
                  </ThemedText>
                </TouchableOpacity>

                <View className="gap-1">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                    (day) => (
                      <View
                        key={day}
                        style={{ height: pixelSize }}
                        className="items-center justify-center w-15"
                      >
                        <ThemedText size="xxs" color="text" opacity="medium">
                          {day}
                        </ThemedText>
                      </View>
                    ),
                  )}
                </View>
              </View>
            )}
          </View>
        )}
        stickySectionHeadersEnabled
        contentContainerClassName="gap-1"
        keyExtractor={(week) => week.weekIndex.toString()}
        horizontal={orientation === "horizontal"}
        renderItem={({ item }) => (
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
      />
    </View>
  );
};

export default PixelScreen;
