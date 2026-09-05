// components/BottomSheetProvider.tsx

import { ThemedText } from "@/components/themed-text";
import { useAppStore } from "@/stores/appStore";
import { AntDesign } from "@expo/vector-icons";
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetScrollView,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BackHandler,
  Pressable,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

type SheetSize = "short" | "medium" | "long" | "full";

type PresentOptions = {
  render: () => React.ReactNode;
  title?: string;
  scrollable?: boolean;
  size?: SheetSize;
  onClose?: () => void;
};

type BottomSheetContextType = {
  present: (options: PresentOptions) => void;
  isPresent: boolean;
  close: () => void;
};

const BottomSheetContext = createContext<BottomSheetContextType>({
  present: () => {},
  isPresent: false,
  close: () => {},
});

export const useBottomSheet = () => useContext(BottomSheetContext);

const SNAP_POINTS: Record<SheetSize, `${number}%`> = {
  short: "30%",
  medium: "50%",
  long: "75%",
  full: "90%",
};

export const BottomSheetProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { theme } = useAppStore();
  const { width, height } = useWindowDimensions();

  const sheetRef = useRef<BottomSheetModal>(null);

  const [options, setOptions] = useState<PresentOptions | null>(null);
  const [isPresent, setIsPresent] = useState(false);

  /**
   * ================================
   * SNAP POINT
   * ================================
   */

  const snapPoints = useMemo(() => {
    return [SNAP_POINTS[options?.size ?? "medium"]];
  }, [options?.size]);

  /**
   * ================================
   * PRESENT
   * ================================
   */

  const present = useCallback((nextOptions: PresentOptions) => {
    setOptions(nextOptions);
    setIsPresent(true);

    /**
     * Đợi React commit options/content trước
     * khi gọi native present().
     *
     * Điều này tránh race condition giữa:
     *
     * setOptions(...)
     * setIsPresent(...)
     * sheet.present()
     */
    requestAnimationFrame(() => {
      sheetRef.current?.present();
    });
  }, []);

  /**
   * ================================
   * CLOSE
   * ================================
   */

  const close = useCallback(() => {
    sheetRef.current?.dismiss();
  }, []);

  /**
   * ================================
   * DISMISS
   * ================================
   */

  const handleDismiss = useCallback(() => {
    setIsPresent(false);
    setOptions(null);
  }, []);

  /**
   * ================================
   * SHEET CHANGE
   * ================================
   */

  const handleSheetChange = useCallback(
    (index: number) => {
      if (index === -1) {
        options?.onClose?.();
        handleDismiss();
      }
    },
    [options, handleDismiss],
  );

  /**
   * ================================
   * BACK HANDLER
   * ================================
   */

  useEffect(() => {
    if (!isPresent) {
      return;
    }
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        close();
        return true;
      },
    );
    return () => {
      subscription.remove();
    };
  }, [isPresent, close]);

  /**
   * ================================
   * PROVIDER
   * ================================
   */

  return (
    <BottomSheetContext.Provider
      value={{
        present,
        isPresent,
        close,
      }}
    >
      {children}

      <BottomSheetModalProvider>
        {/* ================================
            BACKDROP / OVERLAY
            ================================ */}

        {isPresent && (
          <Pressable
            onPress={close}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width,
              height,
              backgroundColor: "black",
              opacity: 0.5,
            }}
          />
        )}

        {/* ================================
            SINGLE BOTTOM SHEET
            ================================ */}

        <BottomSheetModal
          ref={sheetRef}
          snapPoints={snapPoints}
          enableDynamicSizing={false}
          enableContentPanningGesture={false}
          onChange={handleSheetChange}
          onDismiss={handleDismiss}
          backgroundStyle={{
            backgroundColor: theme.background2,
          }}
          handleComponent={null}
        >
          <BottomSheetContent
            options={options}
            onClose={close}
          />
        </BottomSheetModal>
      </BottomSheetModalProvider>
    </BottomSheetContext.Provider>
  );
};

/**
 * ============================================================
 * CONTENT
 * ============================================================
 */

type BottomSheetContentProps = {
  options: PresentOptions | null;
  onClose: () => void;
};

const BottomSheetContent = ({
  options,
  onClose,
}: BottomSheetContentProps) => {
  const { theme } = useAppStore();

  if (!options) {
    return null;
  }

  return (
    <BottomSheetView
      style={{
        flex: 1,
        backgroundColor: theme.background2,
      }}
    >
      {/* ================================
          HEADER
          ================================ */}

      {options.title ? (
        <View className="items-center flex-row px-4 mb-2">
          <ThemedText
            numberOfLines={1}
            className="flex-1"
            type="subtitle"
          >
            {options.title}
          </ThemedText>

          <TouchableOpacity onPress={onClose}>
            <AntDesign
              name="close-circle"
              size={24}
              color="#aaa"
            />
          </TouchableOpacity>
        </View>
      ) : null}

      {/* ================================
          CONTENT
          ================================ */}

      {options.scrollable ? (
        <BottomSheetScrollView
          style={{
            flex: 1,
            backgroundColor: theme.background2,
          }}
          contentContainerStyle={{
            flexGrow: 1,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {options.render()}
        </BottomSheetScrollView>
      ) : (
        <View className="flex-1">
          {options.render()}
        </View>
      )}
    </BottomSheetView>
  );
};
