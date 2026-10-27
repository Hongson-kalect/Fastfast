import { SHIELD_LIMIT } from "@/database/schema/habit_logs";
import { useAppStore } from "@/stores/appStore";
import { View } from "react-native";
import { ThemedText } from "../themed-text";

type Section = { title: string; lines: string[] };

/** Danh sách các mục giải thích, dùng làm phần `middle` của modal. */
export const InfoSections = ({ sections }: { sections: Section[] }) => (
  <View className="gap-3">
    {sections.map(({ title, lines }) => (
      <View key={title} className="rounded-2xl bg-background2 p-3.5">
        <ThemedText size="sm" weight="bold" color="title" className="mb-1.5">
          {title}
        </ThemedText>
        <View className="gap-1.5">
          {lines.map((line) => (
            <View key={line} className="flex-row gap-2">
              <ThemedText size="xs" color="text" opacity="medium">
                •
              </ThemedText>
              <ThemedText
                size="xs"
                color="text"
                opacity="medium"
                className="flex-1"
                style={{ lineHeight: 18 }}
              >
                {line}
              </ThemedText>
            </View>
          ))}
        </View>
      </View>
    ))}
  </View>
);

export const ShieldInfo = () => {
  const shieldCount = useAppStore((state) => state.habit?.shield_snap ?? 0);

  return (
    <InfoSections
      sections={[
        {
          title: `Tác dụng · bạn đang có ${shieldCount}/${SHIELD_LIMIT}`,
          lines: [
            "Mỗi ngày bỏ trống giữa hai phiên nhịn sẽ dùng 1 shield. Chuỗi vẫn hợp lệ và Habit giữ nguyên.",
            "Hết shield mà vẫn nghỉ thì chuỗi bị ngắt, Habit bị trừ và Retain về 0.",
            `Giữ tối đa ${SHIELD_LIMIT} shield, nhận thêm khi đã đầy sẽ bị bỏ.`,
          ],
        },
        {
          title: "Phiên nhịn dài",
          lines: [
            "Nhịn từ 48h được +1 shield, từ 72h được +2.",
            "Nghỉ ngơi là một phần của phiên nhịn dài: cơ thể cần thời gian ăn lại và hồi phục. Shield cho bạn nghỉ những ngày đó mà chuỗi vẫn hợp lệ.",
          ],
        },
        {
          title: "Mốc Habit",
          lines: [
            "Habit chạm 35%, 70% và 100% mỗi mốc được +1 shield.",
            "Nếu Habit tụt xuống rồi leo lại, mốc có thể nhận lại.",
          ],
        },
        {
          title: "Retain",
          lines: [
            "Khi Habit đã 100%, điểm từ mỗi phiên nhịn dồn vào Retain.",
            "Đủ 25 Retain tự đổi thành 1 shield.",
          ],
        },
      ]}
    />
  );
};

export const BodyProgressInfo = () => (
  <InfoSections
    sections={[
      {
        title: "Cơ chế luôn diễn ra",
        lines: [
          "Các cơ chế này vốn luôn hoạt động trong cơ thể, kể cả khi bạn không nhịn.",
          "Chúng không phải công tắc chỉ \"bật\" khi đến một mốc giờ nhất định.",
        ],
      },
      {
        title: "Mức 1–5 nghĩa là gì",
        lines: [
          "Mỗi mức thể hiện việc nhịn ăn đang hỗ trợ cơ chế đó nhiều hơn, tăng dần theo thời gian nhịn.",
          "Thanh đầy không có nghĩa cơ chế đang mạnh nhất lúc này, chỉ là mức hỗ trợ từ việc nhịn ăn đã cao hơn.",
        ],
      },
      {
        title: "Chỉ là ước lượng",
        lines: [
          "Mốc giờ chỉ mang tính phỏng đoán, mỗi người khác nhau tuỳ bữa ăn trước, vận động, giấc ngủ…",
          "Đây không phải chẩn đoán hay lời khuyên y khoa.",
        ],
      },
    ]}
  />
);
