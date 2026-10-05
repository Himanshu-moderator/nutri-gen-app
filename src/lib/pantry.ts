// Whole days from today until the item's expiry date (YYYY-MM-DD); null when it
// has none. Negative values mean the item has already expired.
export const daysUntilExpiry = (expiry: string | null, now: Date = new Date()): number | null => {
  if (!expiry) return null;
  const [y, m, d] = expiry.split("-").map(Number);
  if (!y || !m || !d) return null;
  const end = new Date(y, m - 1, d).getTime();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((end - start) / 86_400_000);
};
