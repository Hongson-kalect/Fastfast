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

  const [isShowing, setIsShowing] = useState(false);
  const [content, setContent] = useState<React.ReactElement | null>(null);
  const [snapPoints, setSnapPoints] = useState<string[] | undefined>();
  const [enablePanDownToClose, setEnablePanDownToClose] = useState(true);

  const [onClose, setOnClose] = useState<(() => void) | null>(null);

  const [listOptions, setListOptions] =
    useState<BottomSheetListOptions<any> | null>(null);

  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const { theme } = useAppStore();

  const present = useCallback(
    (node: React.ReactElement, options?: ShowOptions) => {
      setContent(node);
      setSnapPoints(options?.snapPoints);
      setListOptions(options?.list ?? null);
      if (options?.onClose) setOnClose(options?.onClose);

      setEnablePanDownToClose(options?.enablePanDownToClose ?? true);

      requestAnimationFrame(() => {
        bottomSheetModalRef.current?.present();
      });
      setIsShowing(true);
    },
    [],
  );

  const hide = useCallback(() => {
    onClose?.();
    setIsShowing(false);
    bottomSheetModalRef.current?.dismiss();
  }, []);

  useEffect(() => {
    if (!isShowing) {
      return;
    }

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (onClose) {
          onClose();
          // Cần cần hide sau khi onClose thì gọi hide trong đấy
          return true;
        }
        hide();
        return true;
      },
    );

    return () => {
      subscription.remove();
    };
  }, [isShowing, hide]);

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
          onDismiss={() => {
            setIsShowing(false);
            setContent(null);
            setListOptions(null);
          }}
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
