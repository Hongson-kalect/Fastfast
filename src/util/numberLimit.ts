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
