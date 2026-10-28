import { SHIELD_LIMIT } from "@/database/schema/habit_logs";
import { useT } from "@/providers/Language";
import { useAppStore } from "@/stores/appStore";
import { ReactNode } from "react";
import { View } from "react-native";
import { ThemedText } from "../themed-text";

/** Một dòng giải thích; `icon` là hình thu nhỏ của nút/icon mà dòng đó nhắc tới. */
export type InfoLine = string | { text: string; icon: ReactNode };

type Section = { title: string; lines: InfoLine[] };

/** Danh sách các mục giải thích, dùng làm phần `middle` của modal. */
export const InfoSections = ({ sections }: { sections: Section[] }) => (
  <View className="gap-3">
    {sections.map(({ title, lines }) => (
      <View key={title} className="rounded-2xl bg-background2 p-3.5">
        <ThemedText size="sm" weight="bold" color="title" className="mb-1.5">
          {title}
        </ThemedText>
        <View className="gap-1.5">
          {lines.map((line) => {
            const { text, icon } =
              typeof line === "string" ? { text: line, icon: null } : line;
            return (
              <View key={text} className="flex-row items-start gap-2">
                {/* Dòng nhắc tới một nút/icon: hiện đúng hình đó thay cho dấu chấm */}
                {icon ? (
                  <View className="mt-0.5 min-w-5 items-center">{icon}</View>
                ) : (
                  <ThemedText size="xs" color="text" opacity="medium">
                    •
                  </ThemedText>
                )}
                <ThemedText
                  size="xs"
                  color="text"
                  opacity="medium"
                  className="flex-1"
                  style={{ lineHeight: 18 }}
                >
                  {text}
                </ThemedText>
              </View>
            );
          })}
        </View>
      </View>
    ))}
  </View>
);

export const ShieldInfo = () => {
  const t = useT();
  const shieldCount = useAppStore((state) => state.habit?.shield_snap ?? 0);

  return (
    <InfoSections
      sections={[
        {
          title: t("info.shield.effectTitle", {
            count: shieldCount,
            max: SHIELD_LIMIT,
          }),
          lines: [
            t("info.shield.effect1"),
            t("info.shield.effect2"),
            t("info.shield.effect3", { max: SHIELD_LIMIT }),
          ],
        },
        {
          title: t("info.shield.longTitle"),
          lines: [t("info.shield.long1"), t("info.shield.long2")],
        },
        {
          title: t("info.shield.milestoneTitle"),
          lines: [t("info.shield.milestone1"), t("info.shield.milestone2")],
        },
        {
          title: t("info.shield.retainTitle"),
          lines: [t("info.shield.retain1"), t("info.shield.retain2")],
        },
      ]}
    />
  );
};

export const BodyProgressInfo = () => {
  const t = useT();

  return (
    <InfoSections
      sections={[
        {
          title: t("info.body.alwaysTitle"),
          lines: [t("info.body.always1"), t("info.body.always2")],
        },
        {
          title: t("info.body.levelsTitle"),
          lines: [t("info.body.levels1"), t("info.body.levels2")],
        },
        {
          title: t("info.body.estimateTitle"),
          lines: [t("info.body.estimate1"), t("info.body.estimate2")],
        },
      ]}
    />
  );
};
