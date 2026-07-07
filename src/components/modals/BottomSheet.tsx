import { AntDesign } from "@expo/vector-icons";
import {
    BottomSheetModal,
    BottomSheetModalProvider,
    BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useCallback, useEffect, useRef } from "react";
import {
    BackHandler,
    Pressable,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { ThemedText } from "../themed-text";
import { Divider } from "react-native-paper";

type Props = {
  title: string;
  isOpen: boolean;
  content: () => React.ReactNode;
  onClose: () => void;
  height?: string | number;
  children?: React.ReactNode;
};
const BottomSheet = (props: Props) => {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const contentRef = useRef<() => React.ReactNode>(() => null);

  useEffect(() => {
    if (props.isOpen) {
      if (contentRef.current) {
        contentRef.current = props.content;
        bottomSheetRef.current?.present();
      }
    }
  }, [props.isOpen]);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      backAction();
    }
  }, []);

  const close = useCallback(() => {
    props.onClose();
    bottomSheetRef.current?.dismiss();
  }, []);

  const backAction = () => {
    if (bottomSheetRef.current?.dismiss) {
      if (props.isOpen) {
        if (props.onClose) props.onClose();
        else {
          close();
        }
        return true;
      }
      return false;
    }
  };

  const backHandler = useRef<any>(null);
  useEffect(() => {
    if (props.isOpen) {
      backHandler.current = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction,
      );

      return () => {
        backHandler.current?.remove();
      };
    }
  }, [props.isOpen]);

  const { width, height } = useWindowDimensions();

  return (
    <BottomSheetModalProvider>
      {/* {props.children} */}
      {props.isOpen && (
        <Pressable
          onPress={backAction}
          style={{ width, height, opacity: 0.5 }}
          className="bg-black absolute top-0 left-0"
        ></Pressable>
      )}

      <BottomSheetModal
        enableContentPanningGesture={false}
        ref={bottomSheetRef}
        snapPoints={["70%"]}
        enableDynamicSizing={false}
        onChange={handleSheetChanges}
        onDismiss={() => (contentRef.current = () => null)}
      >
        <BottomSheetView>
          <TouchableOpacity
            onPress={backAction}
            style={{ right: 16, top: 0, zIndex: 100 }}
            className=" absolute"
          >
            <AntDesign name="close-circle" size={24} color="#aaa" />
          </TouchableOpacity>
          {props.title && (
            <>
              <View className="items-center flex-row px-4 mb-2">
                <ThemedText
                  style={{ fontFamily: "PlaypenSans-Semibold" }}
                  className="text-xl"
                >
                  {props.title}
                </ThemedText>
                <TouchableOpacity
                  onPress={backAction}
                  style={{ right: 16, top: 0 }}
                  className=" absolute"
                >
                  <AntDesign name="close-circle" size={24} color="#aaa" />
                </TouchableOpacity>
              </View>
              <Divider />
            </>
          )}
          <View
            key={props.isOpen ? "a" : "b"}
            style={{ height: "100%", width: "100%" }}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{
                padding: 16,
                flexGrow: 1,
              }}
              showsVerticalScrollIndicator={false}
            >
              {/* <ThemedText>aaaaaaaa </ThemedText>
              <ThemedText>aaaaaaaa </ThemedText>
              <ThemedText>aaaaaaaa </ThemedText>
              <ThemedText>aaaaaaaa </ThemedText>
              <ThemedText>aaaaaaaa </ThemedText>
              <ThemedText>aaaaaaaa </ThemedText>
              <ThemedText>aaaaaaaa </ThemedText> */}
              {/* {contentRef.current && contentRef.current()} */}
              {props.children}
              <View style={{ height: 80 }}></View>
            </ScrollView>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </BottomSheetModalProvider>
  );
};

export default BottomSheet;
