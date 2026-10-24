import { useDBService } from "@/hooks/useDBService";
import { useBottomSheet } from "@/provider/BottomSheet";
import { useAppStore } from "@/stores/appStore";
import { useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { ThemedText } from "../themed-text";

type PixelViewType = "week" | "month";
type PixelOrientation = "vertical" | "horizontal";

type PixelLayout = {
  type: PixelViewType;
  orientation: PixelOrientation;
};

type Props = {
  onSelectLayout?: (layout: PixelLayout) => void;
};

const PIXEL_LAYOUTS: {
  type: PixelViewType;
  orientation: PixelOrientation;
  title: string;
  //   description: string;
}[] = [
  {
    type: "week",
    orientation: "vertical",
    title: "Weekly",
    // description: "53 tuần · Cuộn dọc",
  },
  {
    type: "week",
    orientation: "horizontal",
    title: "Weekly",
    // description: "53 tuần · Cuộn ngang",
  },
  {
    type: "month",
    orientation: "vertical",
    title: "Monthly",
    // description: "12 tháng · Cuộn dọc",
  },
  {
    type: "month",
    orientation: "horizontal",
    title: "Monthly",
    // description: "12 tháng · Cuộn ngang",
  },
];

const PixelLayoutPreview = ({
  type,
  orientation,
  selected,
}: PixelLayout & { selected: boolean }) => {
  const { theme } = useAppStore();

  const isHorizontal = orientation === "horizontal";
  const isWeek = type === "week";

  // Vertical: weekdays across the top, weeks/months downwards.
  // Horizontal: weekdays/days down the left, weeks/months across.
  const rowCount = isHorizontal ? 6 : 5;

  const colCount = isHorizontal ? 5 : 6;

  const labels = isWeek
    ? isHorizontal
      ? ["M", "T", "W", "T", "F", "..."]
      : ["M", "T", "W", "T", "F", "..."]
    : isHorizontal
      ? ["J", "F", "M", "A", "M", "..."]
      : ["J", "F", "M", "A", "M", "..."];

  const background = selected ? theme.primary + "22" : theme.background2;

  const cellColor = (row: number, col: number) => {
    const value = (row * 3 + col * 7 + row * col) % 11;

    if (value < 2) return theme.primary;
    if (value < 5) return theme.primary + "99";
    if (value < 8) return theme.primary + "44";

    return theme.text + "12";
  };

  return (
    <View
      className="w-full rounded-xl p-2"
      style={{ backgroundColor: background }}
    >
      {!isHorizontal && (
        <View className="flex-row items-center mb-1 justify-between">
          {/* <View style={{ width: 13 }} /> */}
          {labels.map((label, index) => (
            <View key={index} className="flex-1 items-center">
              <ThemedText size="xxs" opacity="medium">
                {label}
              </ThemedText>
            </View>
          ))}
        </View>
      )}

      {Array.from({ length: rowCount }).map((_, row) => (
        <View
          key={row}
          className="flex-row items-center"
          style={{ gap: 3, marginBottom: 3 }}
        >
          {isHorizontal && (
            <View className="items-center justify-center" style={{ width: 22 }}>
              <ThemedText size="xxs" opacity="medium">
                {labels[row] ?? ""}
              </ThemedText>
            </View>
          )}

          {Array.from({ length: colCount }).map((_, col) => (
            <View
              key={col}
              className="flex-1 rounded-xs"
              style={{
                height: 12,
                backgroundColor: cellColor(row, col),
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
};

const PixelLayoutSheet = ({ onSelectLayout }: Props) => {
  const { hide } = useBottomSheet();
  const dbService = useDBService();
  const { theme, settings, updateSetting } = useAppStore();

  const [selected, setSelected] = useState<PixelLayout>({
    type: settings?.pixel_view_type ?? "week",
    orientation: settings?.pixel_view_orientation ?? "vertical",
  });

  const handleSelect = async (layout: PixelLayout) => {
    setSelected(layout);

    updateSetting({
      pixel_view_type: layout.type,
      pixel_view_orientation: layout.orientation,
    });

    await dbService.setting("pixel_view_type", layout.type);
    await dbService.setting("pixel_view_orientation", layout.orientation);

    onSelectLayout?.(layout);
    hide();
  };

  return (
    <View className="flex-1 bg-background px-4">
      <ThemedText
        size="lg"
        weight="semibold"
        color="text"
        style={{ marginTop: 16, marginBottom: 4 }}
      >
        Pixel layout
      </ThemedText>

      <ThemedText
        size="sm"
        color="text"
        opacity="medium"
        style={{ marginBottom: 16 }}
      >
        Chọn cách hiển thị hành trình của bạn
      </ThemedText>

      <View className="flex-row flex-wrap -mx-1.5">
        {PIXEL_LAYOUTS.map((item) => {
          const isSelected =
            selected.type === item.type &&
            selected.orientation === item.orientation;

          return (
            <View
              key={`${item.type}-${item.orientation}`}
              className="w-1/2 px-1.5 mb-3"
            >
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => handleSelect(item)}
                className="rounded-2xl p-2"
                style={{
                  backgroundColor: isSelected
                    ? theme.primary + "18"
                    : theme.background2,
                  borderWidth: 1,
                  borderColor: isSelected ? theme.primary : theme.text + "12",
                }}
              >
                <PixelLayoutPreview
                  type={item.type}
                  orientation={item.orientation}
                  selected={isSelected}
                />

                <View className="mt-3 px-1 pb-1">
                  <View className="flex-row items-center justify-between">
                    <ThemedText
                      size="sm"
                      weight="semibold"
                      color={isSelected ? "primary" : "text"}
                    >
                      {item.title}
                    </ThemedText>

                    <ThemedText
                      size="xs"
                      color="text"
                      opacity="medium"
                      style={{ marginTop: 2 }}
                    >
                      {item.orientation === "vertical" ? "↓ Dọc" : "→ Ngang"}
                    </ThemedText>

                    {/* {isSelected && (
                      <View
                        className="w-5 h-5 rounded-full items-center justify-center"
                        style={{ backgroundColor: theme.primary }}
                      >
                        <Feather name="check" size={13} color="#FFFFFF" />
                      </View>
                    )} */}
                  </View>

                  {/* <ThemedText
                    size="xs"
                    color="text"
                    opacity="medium"
                    style={{ marginTop: 3 }}
                  >
                    {item.description}
                  </ThemedText> */}

                  {/* <ThemedText
                    size="xs"
                    color="text"
                    opacity="medium"
                    style={{ marginTop: 2 }}
                  >
                    {item.orientation === "vertical" ? "↓ Dọc" : "→ Ngang"}
                  </ThemedText> */}
                </View>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default PixelLayoutSheet;
