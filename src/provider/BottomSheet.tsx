import { useAppStore } from "@/stores/appStore";
import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetScrollView
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

type ShowOptions<T = any> = {
  snapPoints?: string[];
  enablePanDownToClose?: boolean;
  onClose?: () => void;
  isRaw?: boolean; // Dùng để khi mà giả sử dùng flatlist thi khóa scroll của provider

  list?: BottomSheetListOptions<T>;
};

type BottomSheetContextType = {
  present: <T>(content: React.ReactElement, options?: ShowOptions<T>) => void;

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
  const [onClose, setOnClose] = useState<(() => void) | null>(null);
  const [isRaw, setIsRaw] = useState(false);

  const [listOptions, setListOptions] =
    useState<BottomSheetListOptions<any> | null>(null);

  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const present = useCallback(
    (node: React.ReactElement, options?: ShowOptions) => {
      setContent(node);
      setSnapPoints(options?.snapPoints);
      setListOptions(options?.list ?? null);
      setEnablePanDownToClose(options?.enablePanDownToClose ?? true);
      setOnClose(() => options?.onClose ?? null);
      setIsShowing(true);
      if (options?.isRaw) {
        setIsRaw(true);
      }

      requestAnimationFrame(() => {
        bottomSheetModalRef.current?.present();
      });
    },
    [],
  );

  const hide = useCallback(() => {
    if (isShowing) {
      setContent(null);
      setIsShowing(false);
      bottomSheetModalRef.current?.dismiss();
    }
  }, [isShowing]);

  useEffect(() => {
    if (!isShowing) {
      return;
    }

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        bottomSheetModalRef.current?.dismiss();
        return true;
      },
    );

    return () => {
      subscription.remove();
    };
  }, [isShowing]);

  const handleDismiss = useCallback(() => {
    setIsShowing(false);
    setContent(null);
    setListOptions(null);
    setSnapPoints(undefined);
    setEnablePanDownToClose(true);
    setIsRaw(false);

    // Callback được gọi SAU khi sheet dismiss,
    // không gọi trong render.
    const callback = onClose;
    setOnClose(null);

    callback?.();
  }, [onClose]);

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
    if (isRaw) {
      return content;
    }
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
          maxDynamicContentSize={
            // tùy bạn đặt constant hay tính theo window height
            undefined
          }
          topInset={top + 64}
          enablePanDownToClose={enablePanDownToClose}
          backdropComponent={renderBackdrop}
          onDismiss={handleDismiss}
          enableContentPanningGesture={false}
          keyboardBehavior="fillParent"
          backgroundStyle={{
            backgroundColor: theme.background,
            boxShadow: [
              "-0.5px 0px 0.5px " + theme.white + "aa",
              "0.5px 0px 0.5px " + theme.white + "aa",
            ].join(","),
            borderTopWidth: 0.5,
            borderTopColor: theme.white + "55",
          }}
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
