import { InfoSections } from "../home/InfoContent";

/** Những điểm của lịch pixel mà dải chú thích icon không nói được. */
export const PixelInfo = () => (
  <InfoSections
    sections={[
      {
        title: "Fast process",
        lines: [
          "Mỗi ô lấy màu theo tổng độ dài của phiên nhịn dài nhất có mặt trong ngày đó.",
          "Phiên kéo qua nhiều ngày tô màu cho tất cả các ngày đó, nhạt ở ngày đầu và đậm dần tới ngày kết thúc.",
          "Ô có icon khiên là ngày nghỉ được shield giữ chuỗi.",
        ],
      },
      {
        title: "Emotion",
        lines: ["Ô có viền màu chủ đạo là ngày có ghi chú."],
      },
      {
        title: "Thao tác",
        lines: [
          "Bấm ngày trống để thêm cảm xúc và ghi chú, bấm ngày đã có dữ liệu để xem chi tiết.",
          "Số dưới mỗi icon là số ngày trong năm rơi vào mức đó.",
          "Nút Week/Day ở góc lưới để đổi bố cục. Ảnh lưu ra sẽ theo đúng bố cục đang chọn.",
        ],
      },
    ]}
  />
);
