/**
 * Màu tuyết theo chế độ sáng/tối. Trên nền tối, trắng tinh quá chói so với
 * phần còn lại của giao diện nên hạ xuống trắng xám và giảm độ đậm.
 */
export const snowPalette = (isDarkMode: boolean) =>
  isDarkMode
    ? {
        snow: "#D5DEE8",
        shadow: "#56677A",
        stroke: undefined,
        capOpacity: 0.82,
        pattern: "#FFFFFF26",
        cardPattern: "#FFFFFF0D",
        flake: "#E2E8F0",
      }
    : {
        // Nền sáng: tuyết trắng cần bóng và viền xanh xám rõ hơn để không bị át
        snow: "#FFFFFF",
        shadow: "#8EA9C4",
        stroke: "#A7BED3",
        capOpacity: 1,
        pattern: "#FFFFFF40",
        cardPattern: "#64748B14",
        flake: "#9DB8CF",
      };
