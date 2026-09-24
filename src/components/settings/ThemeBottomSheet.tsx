import { Feather } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { getThemeAccess, ThemeItem, themes } from "@/constants/themes";
import { useDBService } from "@/hooks/useDBService";
import { useBottomSheet } from "@/provider/BottomSheet";
import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import { Toast } from "toastify-react-native";

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

  // TODO: thay bằng API/store thật
  const isPremiumUser = false;
  const userAssets: string[] = [];

  const hasAsset = (themeId: string) => userAssets.includes(themeId);

  const canUseTheme = (themeData: ThemeItem, themeId: string) => {
    if (themeData.type === "normal") return true;

    if (hasAsset(themeId)) return true;

    if (themeData.type === "premium") {
      return isPremiumUser;
    }

    return false;
  };

  const { userProfile, settings, updateProfile } = useAppStore();
  const dbService = useDBService();
  const { addModal } = useModalStore();
  const onPurchased = async (themeId: string) => {
    // Check time server
    // CH trả về true, giả định mua thành công bằng modal
    addModal({
      type: "confirm",
      title: "Giả định",
      message: "Xác nhận mua theme",
      onOk: async () => {
        if (!userProfile) return;
        const token = 100000 + Math.floor(Math.random() * 90000);
        await dbService?.addPurchasedTheme({
          userId: userProfile.id,
          theme: themeId,
          token: token.toString(),
        });
        Toast.success(`Theme ${themeId} đã mua thành công`);
        onSelect(themeId);
      },
    });
  };

  const handleTogglePremium = (themeId: string) => {
    if (!userProfile) return;
    const isPremium = userProfile?.account_type === "premium" || false;
    addModal({
      type: "confirm",
      title: "Giả định",
      message: "Xác nhận premium=" + !isPremium,
      onOk: async () => {
        const res = await dbService.togglePremium(!isPremium);
        updateProfile({
          ...userProfile,
          account_type: !isPremium ? "premium" : "free",
        });
        Toast.success(`Premium=${!isPremium}`);
        onSelect(themeId);
      },
    });
  };

  const onUnPurchase = async (themeId: string) => {
    await dbService?.unPurchasedTheme(themeId);
    Toast.success(`Theme ${themeId} đã mua thành công`);
    onSelect(themeId);
  };

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

      {/* Themes */}
      <View className="p-4">
        {Object.entries(themes).map(([themeId, themeData]) => {
          const selected = themeId === currentThemeId;
          const colors = isDarkMode ? themeData.dark : themeData.light;

          const owned = hasAsset(themeId);

          const access = getThemeAccess(themeData, owned);

          const usable = canUseTheme(themeData, themeId);
          const isPurchased = themeData.type === "limited" && owned;

          // const locked =
          //   access === "purchase" ||
          //   access === "unavailable" ||
          //   (access === "premium" && isPremiumUser);

          return (
            <View key={themeId} className="mb-3">
              <Pressable
                disabled={!usable}
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
                  className={`overflow-hidden rounded-2xl border ${
                    selected ? "border-primary" : "border-text-base/10"
                  }`}
                  style={{
                    backgroundColor: colors.background,
                  }}
                >
                  {/* Preview */}
                  <View
                    className="m-3 rounded-xl p-3"
                    style={{
                      backgroundColor: colors.background2,
                      // opacity: locked ? 0.65 : 1,
                    }}
                  >
                    <View className="flex-row items-center">
                      {/* Primary */}
                      <View
                        className="h-9 w-9 rounded-full"
                        style={{
                          backgroundColor: colors.primary,
                        }}
                      />

                      {/* Text */}
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

                      {/* Preview icon */}
                      <View
                        className="h-8 w-8 items-center justify-center rounded-lg"
                        style={{
                          backgroundColor: colors.card,
                        }}
                      >
                        {usable ? (
                          <Feather
                            name="check"
                            size={15}
                            color={colors.success}
                          />
                        ) : (
                          <Feather
                            name="lock"
                            size={15}
                            color={colors.warning}
                          />
                        )}
                      </View>
                    </View>

                    {/* Palette */}
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
                  <View className="flex-row items-center px-4 pb-4">
                    <View className="flex-1">
                      <View className="flex-row items-center">
                        <ThemedText
                          size="md"
                          weight="semibold"
                          colorHex={colors.title}
                        >
                          {themeId}
                        </ThemedText>

                        {/* Type badge */}
                        {themeData.type !== "normal" && (
                          <View
                            className="ml-2 rounded-full px-2 py-0.5"
                            style={{
                              backgroundColor: colors.primary + "18",
                            }}
                          >
                            <ThemedText
                              size="xxs"
                              weight="semibold"
                              colorHex={colors.primary}
                            >
                              {themeData.type === "premium"
                                ? "Premium"
                                : "Limited"}
                            </ThemedText>
                          </View>
                        )}
                      </View>

                      <ThemedText
                        size="xs"
                        colorHex={colors.text}
                        opacity="medium"
                        className="mt-0.5"
                      >
                        {isDarkMode ? "Dark" : "Light"}
                      </ThemedText>
                    </View>

                    {/* Right action */}
                    {selected && usable ? (
                      <View
                        className="h-7 w-7 items-center justify-center rounded-full"
                        style={{
                          backgroundColor: colors.primary,
                        }}
                      >
                        <Feather name="check" size={16} color="#FFFFFF" />
                      </View>
                    ) : // :usable?
                    // <View></View>
                    isPurchased ? (
                      <Pressable
                        hitSlop={8}
                        onPress={() => {
                          onUnPurchase(themeId);
                        }}
                        className="rounded-full px-3 py-1.5"
                        style={{
                          backgroundColor: "transparent",
                        }}
                      >
                        <ThemedText
                          size="xs"
                          weight="semibold"
                          colorHex={colors.success}
                        >
                          un purchased
                        </ThemedText>
                      </Pressable>
                    ) : themeData.type === "limited" && access === "free" ? (
                      <View className="flex-row items-center gap-2">
                        <View className="items-center justify-center">
                          <ThemedText
                            size="xxs"
                            opacity="full"
                            color={"success"}
                          >
                            Free until
                          </ThemedText>
                          <ThemedText
                            size="xxs"
                            opacity="full"
                            color={"success"}
                          >
                            {themeData.freeEndAt}
                          </ThemedText>
                        </View>

                        <Pressable
                          onPress={() => onPurchased(themeId)}
                          hitSlop={8}
                          style={{
                            backgroundColor: colors.primary,
                          }}
                          className="flex-row items-center px-4 py-2 rounded-xl"
                        >
                          <Feather name="unlock" size={14} color={"white"} />

                          <ThemedText
                            size="sm"
                            // weight="medium"
                            opacity="full"
                            colorHex={"white"}
                            className="ml-1"
                          >
                            Purchase
                          </ThemedText>
                        </Pressable>
                      </View>
                    ) : access === "premium" ? (
                      <Pressable
                        onPress={() => handleTogglePremium(themeId)}
                        hitSlop={8}
                        style={{
                          backgroundColor: colors.primary,
                        }}
                        className="flex-row items-center px-4 py-2 rounded-xl"
                      >
                        <ThemedText size="sm" colorHex={"white"}>
                          {usable ? "Be premium" : "Un premium"}
                          {/* Be Premium */}
                        </ThemedText>
                      </Pressable>
                    ) : access === "purchase" ? (
                      <Pressable
                        onPress={() => onPurchased(themeId)}
                        hitSlop={8}
                        style={{
                          backgroundColor: colors.primary,
                        }}
                        className="flex-row items-center px-4 py-2 rounded-xl"
                      >
                        <Feather name="unlock" size={14} color={"white"} />

                        <ThemedText
                          size="sm"
                          // weight="medium"
                          opacity="full"
                          colorHex={"white"}
                          className="ml-1"
                        >
                          Purchase
                        </ThemedText>
                      </Pressable>
                    ) : access === "unavailable" ? (
                      <View className="flex-row items-center">
                        <Feather name="lock" size={14} color={colors.text} />

                        <ThemedText
                          size="xs"
                          colorHex={colors.text}
                          opacity="low"
                          className="ml-1"
                        >
                          Unavailable
                        </ThemedText>
                      </View>
                    ) : null}
                  </View>

                  {/* Locked overlay */}
                  {!usable && (
                    <View
                      pointerEvents="none"
                      className="absolute inset-0 items-center justify-center"
                    >
                      <View className="rounded-full bg-background/80 p-3">
                        <Feather name="lock" size={20} color={colors.text} />
                      </View>
                    </View>
                  )}
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
