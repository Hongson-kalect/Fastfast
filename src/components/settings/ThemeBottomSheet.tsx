import { Feather } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { themes } from "@/constants/themes";
import { useBottomSheet } from "@/provider/BottomSheet";
import { useAppStore } from "@/stores/appStore";

type ThemeBottomSheetProps = {
  currentThemeId: keyof typeof themes;
  isDarkMode: boolean;
  onSelect: (themeId: keyof typeof themes) => void;
};

const ThemeBottomSheet: React.FC<ThemeBottomSheetProps> = ({
  currentThemeId,
  isDarkMode,
  onSelect,
}) => {
  const { theme } = useAppStore();
  const { hide } = useBottomSheet();

  return (
    <View className="flex-1 bg-background2">
      {/* Header */}
      <View className="border-b border-text-base/10 px-4 pb-3 pt-2">
        <View className="flex-row items-center">
          <Feather name="droplet" size={20} color={theme.primary} />

          <ThemedText size="xl" weight="bold" className="ml-3">
            Theme
          </ThemedText>
        </View>

        <ThemedText size="xs" color="text" opacity="medium" className="mt-1">
          Choose the appearance of your app
        </ThemedText>
      </View>

      <View className="p-4">
        {Object.entries(themes).map(([themeId, themeData]) => {
          const selected = themeId === currentThemeId;

          const colors = isDarkMode ? themeData.dark : themeData.light;

          return (
            <View key={themeId} className="mb-3">
              <Pressable
                onPress={() => {
                  onSelect(themeId as keyof typeof themes);
                  hide();
                }}
                android_ripple={{
                  color: colors.primary + "20",
                }}
                className="overflow-hidden rounded-2xl"
              >
                <View
                  className={`rounded-2xl border p-4 ${
                    selected ? "border-primary" : "border-text-base/10"
                  }`}
                  style={{
                    backgroundColor: colors.background,
                  }}
                >
                  {/* Preview */}
                  <View
                    className="mb-4 rounded-xl p-3"
                    style={{
                      backgroundColor: colors.background2,
                    }}
                  >
                    <View className="flex-row items-center">
                      <View
                        className="h-9 w-9 rounded-full"
                        style={{
                          backgroundColor: colors.primary,
                        }}
                      />

                      <View className="ml-3 flex-1">
                        <View
                          className="mb-1 h-3 w-24 rounded-full"
                          style={{
                            backgroundColor: colors.title,
                          }}
                        />

                        <View
                          className="h-2 w-16 rounded-full"
                          style={{
                            backgroundColor: colors.text + "70",
                          }}
                        />
                      </View>

                      <View
                        className="h-8 w-8 items-center justify-center rounded-lg"
                        style={{
                          backgroundColor: colors.card,
                        }}
                      >
                        <Feather
                          name="check"
                          size={15}
                          color={colors.success}
                        />
                      </View>
                    </View>

                    {/* Theme colors */}
                    <View className="mt-3 flex-row">
                      {[
                        colors.primary,
                        colors.secondary,
                        colors.tertiary,
                        colors.success,
                        colors.warning,
                      ].map((color, index) => (
                        <View
                          key={index}
                          className="mr-2 h-5 w-5 rounded-full"
                          style={{
                            backgroundColor: color,
                          }}
                        />
                      ))}
                    </View>
                  </View>

                  {/* Info */}
                  <View className="flex-row items-center">
                    <View className="flex-1">
                      <ThemedText
                        size="md"
                        weight="semibold"
                        colorHex={colors.title}
                      >
                        {themeId}
                      </ThemedText>

                      <ThemedText
                        size="xs"
                        colorHex={colors.text}
                        opacity="medium"
                        className="mt-0.5"
                      >
                        {isDarkMode ? "Dark" : "Light"}
                      </ThemedText>
                    </View>

                    {selected && (
                      <View
                        className="h-7 w-7 items-center justify-center rounded-full"
                        style={{
                          backgroundColor: colors.primary,
                        }}
                      >
                        <Feather name="check" size={16} color="#FFFFFF" />
                      </View>
                    )}
                  </View>
                </View>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default ThemeBottomSheet;
