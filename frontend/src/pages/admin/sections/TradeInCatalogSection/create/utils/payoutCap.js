export const clampPercent = (value) => {
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(value, 0), 100);
};

export const calculatePercentCap = (referencePrice, percent) => {
  if (
    referencePrice === null ||
    typeof referencePrice === "undefined" ||
    !Number.isFinite(referencePrice)
  ) {
    return null;
  }
  const normalizedPercent = clampPercent(Number(percent) || 0);
  return Number(((referencePrice * normalizedPercent) / 100).toFixed(2));
};

export const calculateManualCap = (value) => {
  if (value === "" || value === null || typeof value === "undefined") {
    return null;
  }
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return null;
  return Number(Math.max(0, num).toFixed(2));
};

export const formatCap = (cap) =>
  cap === null || typeof cap === "undefined" || Number.isNaN(cap)
    ? "--"
    : `$${Number(cap).toFixed(2)}`;
