export const timeString = (time: number) => {
  const timeCheck = Math.floor(time / 1000);
  const seconds = timeCheck % 60;
  const minutes = Math.floor(timeCheck / 60) % 60;
  const hours = Math.floor(timeCheck / 60 / 60);
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};
