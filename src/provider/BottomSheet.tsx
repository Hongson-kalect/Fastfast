import { useAppStore } from "@/stores/appStore";
import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { StatusBar } from "react-native";

type ShowOptions = {
  snapPoints?: string[];
  enablePanDownToClose?: boolean;
};

type BottomSheetContextType = {
  show: (content: ReactNode, options?: ShowOptions) => void;
  hide: () => void;
};

const BottomSheetContext = createContext<BottomSheetContextType | undefined>(
  undefined,
);

export const BottomSheetProvider = ({ children }: { children: ReactNode }) => {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const [content, setContent] = useState<ReactNode>(null);
  const { theme } = useAppStore();
  const [snapPoints, setSnapPoints] = useState<string[]>(["50%"]);
  const initialSnapPoints = useMemo(() => ["CONTENT_HEIGHT"], []);
  // const {
  //   animatedHandleHeight,
  //   animatedSnapPoints,
  //   animatedContentHeight,
  //   handleContentLayout,
  // } = useBottomSheetDynamicSnapPoints(initialSnapPoints);
  const [enablePanDownToClose, setEnablePanDownToClose] =
    useState<boolean>(true);

  const show = useCallback((node: ReactNode, options?: ShowOptions) => {
    setContent(node);
    if (options?.snapPoints) setSnapPoints(options.snapPoints);
    if (options?.enablePanDownToClose !== undefined) {
      setEnablePanDownToClose(options.enablePanDownToClose);
    }

    // BẮT BUỘC: Đợi React render content xong mới gọi .present()
    requestAnimationFrame(() => {
      bottomSheetModalRef.current?.present();
    });
  }, []);

  const hide = useCallback(() => {
    bottomSheetModalRef.current?.dismiss();
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

  return (
    <BottomSheetContext.Provider value={{ show, hide }}>
      <BottomSheetModalProvider>
        {children}
        <BottomSheetModal
          backgroundStyle={{
            backgroundColor: theme.background,
            boxShadow: "-1px -2px 4px white",
          }}
          handleIndicatorStyle={{ backgroundColor: theme.text }}
          style={{
            marginTop: StatusBar.currentHeight,
          }}
          ref={bottomSheetModalRef}
          snapPoints={snapPoints}
          enablePanDownToClose={enablePanDownToClose}
          backdropComponent={renderBackdrop}
          onDismiss={() => setContent(null)}
          enableContentPanningGesture={false}
          keyboardBehavior="fillParent"
          // enableDynamicSizing={true}
        >
          <BottomSheetView style={{ flex: 1 }}>{content}</BottomSheetView>
        </BottomSheetModal>
      </BottomSheetModalProvider>
    </BottomSheetContext.Provider>
  );
};

export const useBottomSheet = () => {
  const context = useContext(BottomSheetContext);
  if (!context) {
    throw new Error("useBottomSheet must be used within a BottomSheetProvider");
  }
  return context;
};
