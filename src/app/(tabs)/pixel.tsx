import PixelHeader from "@/components/pixel/Header";
import PixelDetailSheet from "@/components/pixel/PixelDetailSheet";
import { generateYearGrid } from "@/components/pixel/PixelInYear";
import WeekRow from "@/components/pixel/WeekRow";
import { ThemedText } from "@/components/themed-text";
import { useDBService } from "@/hooks/useDBService";
import { useBottomSheet } from "@/provider/BottomSheet";
import { useAppStore } from "@/stores/appStore";
import { loadPixelYear, updatePixelViewMode } from "@/stores/pixelAction";
import { usePixelStore } from "@/stores/pixelStore";
import { getLocalTodayStr } from "@/util/timer";
import { Feather } from "@expo/vector-icons";
import { getWeek } from "date-fns";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  SectionList,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// 1. Định nghĩa các chế độ xem (View Options)

interface EmojiGuide {
  emoji: string;
  label: string;
}

const ITEM_HEIGHT = 40;
const HEADER_HEIGHT = 60;

const PixelScreen = () => {
  const dbService = useDBService();
  const { present, hide } = useBottomSheet();
  const { width, height } = useWindowDimensions();
  const { currentFastSession, settings, updateSetting, theme } = useAppStore();
  const { isLoading, stats, year, yearPixelData, viewMode } = usePixelStore();

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

  const handleSelectDate = useCallback(
    (date: string) => {
      console.log("handleSelectDate", Date.now());
      const data = yearPixelData[date];
      console.log("selected Date ", date, data);
      if (!data) return;

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
        console.log("present ", Date.now());
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
        loadPixelYear(dbService, year, currentFastSession);
      });

      return () => {
        cancelIdleCallback(task);
      };
    }, [year, loadPixelYear]),
  );

  const gridData = useMemo(() => {
    return generateYearGrid(year);
  }, [year]);

  return (
    <View className="flex-1 bg-background">
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
      <SafeAreaView className="flex-1">
        <SectionList
          showsVerticalScrollIndicator={false}
          ref={sectionListRef}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 40,
            gap: 4,
          }}
          scrollEventThrottle={32}
          onScroll={handleScroll}
          getItemLayout={(data, index) => ({
            length: ITEM_HEIGHT,
            offset: ITEM_HEIGHT * index,
            index,
          })}
          sections={[{ key: "calendar", data: gridData }]}
          ListHeaderComponent={
            <PixelHeader
              stats={stats}
              year={year}
              setYear={async (year) =>
                await loadPixelYear(dbService, year, currentFastSession)
              }
              viewMode={viewMode}
              setViewMode={async (mode) => updatePixelViewMode(dbService, mode)}
            />
          }
          renderSectionHeader={() => (
            <View className="bg-background rounded-lg pr-1 pb-1 overflow-hidden">
              {/* Header Thứ (T2 -> CN) */}
              <View className="flex-row mb-2 items-center">
                <TouchableOpacity
                  activeOpacity={0.7}
                  hitSlop={25}
                  style={{ borderTopLeftRadius: 4 }}
                  className="w-15 bg-primary justify-center items-center"
                >
                  <ThemedText
                    size="xs"
                    weight="bold"
                    colorHex="#FFFFFF"
                    style={{ paddingVertical: 4 }}
                  >
                    Week
                  </ThemedText>
                </TouchableOpacity>

                <View className="flex-1 flex-row justify-between">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                    (day, idx) => (
                      <View
                        key={idx}
                        className="flex-1 items-center justify-center pt-1"
                      >
                        <ThemedText size="xxs" color="text" opacity="medium">
                          {day}
                        </ThemedText>
                      </View>
                    ),
                  )}
                </View>
              </View>
            </View>
          )}
          stickySectionHeadersEnabled
          contentContainerClassName="gap-1"
          keyExtractor={(week) => week.weekIndex.toString()}
          renderItem={({ item }) => (
            <WeekRow
              week={item}
              todayStr={todayStr}
              viewMode={viewMode}
              yearPixelData={yearPixelData}
              onSelectDate={handleSelectDate}
            />
          )}
        />
      </SafeAreaView>
    </View>
  );
};

export default PixelScreen;
