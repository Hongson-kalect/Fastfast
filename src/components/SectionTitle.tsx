import { View } from "react-native";
import { ThemedText } from "./themed-text";

/** Tiêu đề section dùng chung: chữ hoa nhỏ, giãn chữ, có slot bên phải. */
export const SectionTitle = ({
  title,
  right,
}: {
  title: string;
  right?: React.ReactNode;
}) => (
  <View className="mb-3 flex-row items-center justify-between px-1">
    <ThemedText
      size="xs"
      weight="extrabold"
      color="text"
      opacity="medium"
      style={{ letterSpacing: 1.2, textTransform: "uppercase" }}
    >
      {title}
    </ThemedText>
    {right}
  </View>
);
