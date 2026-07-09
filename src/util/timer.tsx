export const timeString = (time: number) => {
  const timeCheck = Math.floor(time / 1000);
  const seconds = timeCheck % 60;
  const minutes = Math.floor(timeCheck / 60) % 60;
  const hours = Math.floor(timeCheck / 60 / 60);
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

export const getLocalTodayStr = (): string => {
  const now = new Date();
  
  const year = now.getFullYear();
  // getMonth() trả về từ 0-11 nên phải +1, sau đó padStart để đảm bảo có 2 chữ số
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  
  return `${year}-${month}-${day}`; // Kết quả: "2026-07-09"
};
