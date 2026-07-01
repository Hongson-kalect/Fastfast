import { View } from "react-native";
import { SkeletonReact } from "./ReactSkeleton";

export const BarChartSkeleton = () => (
  <View style={{ padding: 20, alignSelf: "center", height: "100%" }}>
    <SkeletonReact width="60%" height={24} style={{ marginBottom: 20 }} />
    <View style={{ flexDirection: "row", alignItems: "flex-end", flex: 1 }}>
      <SkeletonReact width={30} height="40%" style={{ marginRight: 10 }} />
      <SkeletonReact width={30} height="70%" style={{ marginRight: 10 }} />
      <SkeletonReact width={30} height="55%" style={{ marginRight: 10 }} />
      <SkeletonReact width={30} height="90%" style={{ marginRight: 10 }} />
      <SkeletonReact width={30} height="75%" style={{ marginRight: 10 }} />
      <SkeletonReact width={30} height="40%" style={{ marginRight: 10 }} />
    </View>
  </View>
);
