import { useAppSettingsStore } from "@/store/useAppSettingStore";
import { useRef } from "react";
import { DimensionValue, StyleSheet, View } from "react-native";
import { SkeletonReact } from "./ReactSkeleton";

export const WordSearchSkeleton = () => {
  const width = useRef(20 + Math.floor(Math.random() * 40));
  return (
    <View className="flex-row items-center">
      <View style={{ flex: 1, paddingVertical: 2 }}>
        {/* Dòng định nghĩa chính */}
        <View className="flex-row gap-2 mt-2">
          <SkeletonReact
            width={(width.current + "%") as DimensionValue}
            height={20}
            style={{ marginLeft: 2 }}
          />
          {Array.from({ length: Math.floor(width.current / 20) }).map(
            (_, index) => (
              <SkeletonReact
                key={index}
                width={18}
                height={18}
                style={{ borderRadius: 99, marginRight: 4 }}
              />
            ),
          )}
        </View>
        <SkeletonReact
          width={(width.current / 1.2 + "%") as DimensionValue}
          height={14}
          style={{ opacity: 0.6, marginTop: 4 }}
        />
        {/* Dòng bản dịch (Mờ hơn hoặc ngắn hơn) */}
      </View>

      {/* Ô Checkbox giả bên phải */}
      {/* <SkeletonReact
        width={24}
        height={24}
        style={{ borderRadius: 4, marginRight: 15 }}
      /> */}
    </View>
  );
};

export const WordSkeleton = () => {
  const { theme } = useAppSettingsStore();
  const width = useRef(30 + Math.floor(Math.random() * 40));
  return (
    <View
      className="p-3 flex-row gap-3"
      style={{
        elevation: 6,
        borderRadius: 8,
        backgroundColor: theme.colors.background,
      }}
    >
      <SkeletonReact width={112} height={63} style={{ borderRadius: 8 }} />

      <View className="flex-1">
        <SkeletonReact
          height={24}
          width={(width + "%") as DimensionValue}
        ></SkeletonReact>

        <View className="flex-row mt-4 justify-between">
          <View className="flex-row gap-2 items-center">
            <SkeletonReact height={24} width={24}></SkeletonReact>
            <SkeletonReact height={20} width={40}></SkeletonReact>
          </View>
          <SkeletonReact height={24} width={32}></SkeletonReact>
        </View>
      </View>
    </View>
  );
};

export const CollectionSkeleton = () => {
  const { theme } = useAppSettingsStore();
  const width = useRef(30 + Math.floor(Math.random() * 40));
  return (
    <View
      className="p-3 flex-row gap-3"
      style={{
        elevation: 6,
        borderRadius: 8,
        backgroundColor: theme.colors.background,
      }}
    >
      <SkeletonReact width={112} height={63} style={{ borderRadius: 8 }} />

      <View className="flex-1">
        <SkeletonReact
          height={24}
          width={(width + "%") as DimensionValue}
        ></SkeletonReact>

        <View className="items-end">
          <SkeletonReact
            height={16}
            width={32}
            style={{ marginTop: 12 }}
          ></SkeletonReact>
          <SkeletonReact
            height={8}
            width={"100%"}
            style={{ marginTop: 2 }}
          ></SkeletonReact>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeletonItem: {
    flexDirection: "row",
    alignItems: "center",
  },
});
