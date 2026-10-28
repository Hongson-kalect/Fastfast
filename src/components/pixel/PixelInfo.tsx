import { InfoSections } from "../home/InfoContent";
import { useT } from "@/providers/Language";

/** Những điểm của lịch pixel mà dải chú thích icon không nói được. */
export const PixelInfo = () => {
  const t = useT();
  return (
  <InfoSections
    sections={[
      {
        title: t("journey.mode.fasting"),
        lines: [
          t("journey.info.fast1"),
          t("journey.info.fast2"),
          t("journey.info.fast3"),
        ],
      },
      {
        title: t("journey.mode.mood"),
        lines: [t("journey.info.mood1")],
      },
      {
        title: t("journey.info.actionsTitle"),
        lines: [
          t("journey.info.action1"),
          t("journey.info.action2"),
          t("journey.info.action3"),
        ],
      },
    ]}
  />
  );
};
