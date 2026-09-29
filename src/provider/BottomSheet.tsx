import { useAppStore } from "@/stores/appStore";
import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  BackHandler,
  ListRenderItem,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type BottomSheetListOptions<T> = {
  data: T[];
  renderItem: ListRenderItem<T>;
  keyExtractor?: (item: T, index: number) => string;
  footer?: React.ReactElement;
  empty?: React.ReactElement;
  ItemSeparatorComponent?: React.ComponentType<any>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  refreshing?: boolean;
  onRefresh?: () => void;
};

export type ShowOptions<T = any> = {
  snapPoints?: string[];
  enablePanDownToClose?: boolean;
  enableContentPanningGesture?: boolean;
  onClose?: () => void;
  isRaw?: boolean;
  list?: BottomSheetListOptions<T>;
};

type BottomSheetContextType = {
  present: <T = any>(
    content: React.ReactElement,
    options?: ShowOptions<T>,
  ) => void;
  hide: () => void;
};

const BottomSheetContext = createContext<BottomSheetContextType | undefined>(
  undefined,
);

export const BottomSheetProvider = ({ children }: { children: ReactNode }) => {
  const { top } = useSafeAreaInsets();
  const { theme } = useAppStore();

  const [isShowing, setIsShowing] = useState(false);
  const [content, setContent] = useState<React.ReactElement | null>(null);
  const [snapPoints, setSnapPoints] = useState<string[] | undefined>();
  const [enablePanDownToClose, setEnablePanDownToClose] = useState(true);
  const [isRaw, setIsRaw] = useState(false);
  const [enableContentPanningGesture, setEnableContentPanningGesture] =
    useState(true);
  const [listOptions, setListOptions] =
    useState<BottomSheetListOptions<any> | null>(null);

  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const onCloseRef = useRef<(() => void) | null>(null);

  const present = useCallback(
    <T,>(node: React.ReactElement, options?: ShowOptions<T>) => {
      setContent(node);
      setSnapPoints(options?.snapPoints);
      setEnableContentPanningGesture(
        options?.enableContentPanningGesture ?? true,
      );
      setListOptions(options?.list ?? null);
      setEnablePanDownToClose(options?.enablePanDownToClose ?? true);
      setIsRaw(options?.isRaw ?? false);

      // Lưu callback vào Ref để tránh Stale Closure
      onCloseRef.current = options?.onClose ?? null;

      setIsShowing(true);

      requestAnimationFrame(() => {
        bottomSheetModalRef.current?.present();
      });
    },
    [],
  );

  const hide = useCallback(() => {
    bottomSheetModalRef.current?.dismiss();
  }, []);

  // Xử lý phím Back cứng trên Android
  useEffect(() => {
    if (!isShowing) return;

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        hide();
        return true;
      },
    );

    return () => subscription.remove();
  }, [isShowing, hide]);

  const handleDismiss = useCallback(() => {
    setIsShowing(false);
    setContent(null);
    setListOptions(null);
    setSnapPoints(undefined);
    setEnablePanDownToClose(true);
    setIsRaw(false);

    // Trigger callback an toàn từ Ref
    if (onCloseRef.current) {
      onCloseRef.current();
      onCloseRef.current = null;
    }
  }, []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior="close"
      />
    ),
    [],
  );

  const renderContent = () => {
    if (isRaw) return content;

    if (listOptions) {
      return (
        <BottomSheetFlatList
          data={listOptions.data}
          renderItem={listOptions.renderItem}
          keyExtractor={listOptions.keyExtractor}
          ListHeaderComponent={content}
          ListFooterComponent={listOptions.footer}
          ListEmptyComponent={listOptions.empty}
          ItemSeparatorComponent={listOptions.ItemSeparatorComponent}
          contentContainerStyle={listOptions.contentContainerStyle}
          onEndReached={listOptions.onEndReached}
          onEndReachedThreshold={listOptions.onEndReachedThreshold}
          refreshing={listOptions.refreshing}
          onRefresh={listOptions.onRefresh}
        />
      );
    }

    return <BottomSheetScrollView>{content}</BottomSheetScrollView>;
  };

  return (
    <BottomSheetContext.Provider value={{ present, hide }}>
      <BottomSheetModalProvider>
        {children}

        <BottomSheetModal
          ref={bottomSheetModalRef}
          snapPoints={snapPoints}
          enableDynamicSizing={!snapPoints}
          topInset={top + 64}
          enablePanDownToClose={enablePanDownToClose}
          backdropComponent={renderBackdrop}
          onDismiss={handleDismiss}
          enableContentPanningGesture={enableContentPanningGesture}
          keyboardBehavior="fillParent"
          backgroundStyle={[
            styles.background,
            {
              backgroundColor: theme.background,
              borderTopColor: theme.text + "33",
            },
          ]}
          handleIndicatorStyle={{
            backgroundColor: theme.text,
          }}
        >
          {renderContent()}
        </BottomSheetModal>
      </BottomSheetModalProvider>
    </BottomSheetContext.Provider>
  );
};

export const useBottomSheet = () => {
  const context = useContext(BottomSheetContext);
  if (!context) {
    throw new Error("useBottomSheet must be used inside BottomSheetProvider");
  }
  return context;
};

const styles = StyleSheet.create({
  background: {
    borderTopWidth: StyleSheet.hairlineWidth,
    // Cross-platform shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
});
