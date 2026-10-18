/**
 * Market Price Trend Analytics for Crop Selling Decision Support.
 */

export function analyzePriceTrend(historicalPrices: number[]): { trend: 'upward' | 'downward' | 'stable'; percentChange: number } {
  if (historicalPrices.length < 2) return { trend: 'stable', percentChange: 0 };
  const first = historicalPrices[0];
  const last = historicalPrices[historicalPrices.length - 1];
  const diff = last - first;
  const pct = (diff / Math.max(1, first)) * 100;
  
  return {
    trend: pct > 2 ? 'upward' : pct < -2 ? 'downward' : 'stable',
    percentChange: Math.round(pct * 10) / 10,
  };
}
