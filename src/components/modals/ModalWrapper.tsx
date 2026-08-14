import { useAppStore } from "@/stores/appStore";
import {
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import ReactNativeModal from "react-native-modal";
import { Card, Divider } from "react-native-paper";
import Animated, { LinearTransition } from "react-native-reanimated";
import { ThemedText } from "../themed-text";

type Props = {
  show: boolean;
  type?: "input" | "alert" | "confirm" | "prompt" | "custom" | "menu" | "tabs";
  title?: string | React.ReactNode;
  bottom?: React.ReactNode;
  titlePosition?: "center" | "left" | "right";
  inAnimation?:
    | "fadeIn"
    | "slideInDown"
    | "slideInUp"
    | "zoomIn"
    | "zoomInDown";
  outAnimation?:
    | "fadeOut"
    | "slideOutDown"
    | "slideOutUp"
    | "zoomOut"
    | "zoomOutDown";
  onCancel: () => void;
  rightContent?: React.ReactNode;
  leftContent?: React.ReactNode;
  centerContent?: React.ReactNode;
  padding?: number;
  children: React.ReactNode;
};
export default function ModalWrapper(props: Props) {
  const { height } = useWindowDimensions();
  const { theme } = useAppStore();

  return (
    // <Modal visible={props.show}>
    <ReactNativeModal
      // key={props.type || "none"}
      onBackButtonPress={props.onCancel}
      animationIn={props.inAnimation || "zoomIn"}
      animationOut={props.outAnimation || "zoomOut"}
      isVisible={props.show}
      backdropTransitionOutTiming={1}
      // backdropColor="black"
      backdropOpacity={0.4}
      onBackdropPress={props.onCancel}
      style={{ zIndex: 1000 }}
      avoidKeyboard
    >
      <Animated.View
        // layout={
        //   ["prompt", "input"].includes(props?.type)
        //     ? LinearTransition.mass(0.6)
        //     : undefined
        // }
        layout={LinearTransition.mass(0.6)}
      >
        <Card
          style={{ backgroundColor: theme.background, borderWidth: 0.5 }}
          className="relative shadow-lg shadow-text-base/40 border border-text-base/60 rounded-2xl"
        >
          <View className="pb-5 pt-3" style={{ maxHeight: (height / 4) * 3 }}>
            {props.title &&
              (typeof props.title === "string" ? (
                <View>
                  <ThemedText
                    style={{
                      textAlign: props.titlePosition || "left",
                      fontFamily: "PlaypenSans-Semibold",
                      color: theme.text,
                    }}
                    className="text-xl p-4"
                  >
                    {props.title || " Title"}
                  </ThemedText>
                  <Divider className="bg-red-400" />
                </View>
              ) : (
                props.title
              ))}
            <ScrollView keyboardShouldPersistTaps="handled">
              <View style={{ padding: props.padding || 7 }}>
                {props.children}
              </View>
            </ScrollView>
            {props.bottom && (
              <>
                <Divider />
                {props.bottom}
              </>
            )}
          </View>
          {!!props.title && (
            <TouchableOpacity
              onPress={props.onCancel}
              className="absolute top-2 right-2 p-2 rounded-full focus:outline-none focus:ring focus:ring-gray-300"
            >
              <ThemedText
                style={{ color: theme.subText1 }}
                className=" text-lg font-semibold"
              >
                ×
              </ThemedText>
            </TouchableOpacity>
          )}
        </Card>
      </Animated.View>
    </ReactNativeModal>
    // </Modal>
  );
}
