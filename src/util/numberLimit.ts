export const numberLimit = (
  num: number[]|number,
  min: number,
  max: number,
  getMin?: boolean,
) => {
    const arr = Array.isArray(num) ? num : [num];
  if (getMin) return Math.max(Math.min(...arr, max), min);
  return Math.min(Math.max(...arr, min), max);
};

export const fixed=(number: number, digits: number=1):number => {
  return Math.round(number * Math.pow(10, digits)) / Math.pow(10, digits);
}
