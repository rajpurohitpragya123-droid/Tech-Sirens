export function laplacianVarianceRGBA(pixels, width, height) {
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width < 3 ||
    height < 3 ||
    pixels.length !== width * height * 4
  )
    throw new Error('Valid RGBA image required');
  const grey = new Float64Array(width * height);
  for (let i = 0; i < grey.length; i++)
    grey[i] = 0.299 * pixels[i * 4] + 0.587 * pixels[i * 4 + 1] + 0.114 * pixels[i * 4 + 2];
  let sum = 0,
    squared = 0,
    n = 0;
  for (let y = 1; y < height - 1; y++)
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x,
        v = -4 * grey[i] + grey[i - 1] + grey[i + 1] + grey[i - width] + grey[i + width];
      sum += v;
      squared += v * v;
      n++;
    }
  return squared / n - (sum / n) ** 2;
}
export const isBlurry = (variance, threshold = 80) =>
  !Number.isFinite(variance) || variance < threshold;
// Takes aggregate statistics only, never individual farmer rows.
export function benchmarkTips(aggregate) {
  if (!aggregate.consent || aggregate.peerCount < 5) return null;
  const gaps = [
    {
      key: 'sowing',
      difference: aggregate.self.sowingOffset - aggregate.top.sowingOffset,
      yieldAssociation: aggregate.associations.sowing,
    },
    {
      key: 'khaad',
      difference: aggregate.top.fertiliserSplits - aggregate.self.fertiliserSplits,
      yieldAssociation: aggregate.associations.khaad,
    },
    {
      key: 'water',
      difference: aggregate.self.irrigations - aggregate.top.irrigations,
      yieldAssociation: aggregate.associations.water,
    },
  ];
  return {
    count: aggregate.peerCount,
    selfYield: aggregate.self.yield,
    averageYield: aggregate.averageYield,
    topYield: aggregate.top.yield,
    tips: gaps
      .filter((g) => g.difference > 0)
      .toSorted((a, b) => b.yieldAssociation - a.yieldAssociation)
      .slice(0, 3),
  };
}
