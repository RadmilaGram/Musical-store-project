export function computeTradeInOffer(entry, condition) {
  if (!entry || !condition) return null;
  const cap = Number(entry.baseDiscountAmount ?? entry.referencePrice ?? 0);
  const percent = Number(condition.percent ?? 0);
  if (!Number.isFinite(cap) || !Number.isFinite(percent)) return null;
  const discount = Math.round(Math.max(0, cap * (percent / 100)));
  return { cap, percent, discount };
}
