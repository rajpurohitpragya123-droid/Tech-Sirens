export function laplacianVarianceRGBA(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
): number;
export function isBlurry(variance: number, threshold?: number): boolean;
export function benchmarkTips(aggregate: {
  consent: boolean;
  peerCount: number;
  self: { yield: number; sowingOffset: number; fertiliserSplits: number; irrigations: number };
  top: { yield: number; sowingOffset: number; fertiliserSplits: number; irrigations: number };
  averageYield: number;
  associations: { sowing: number; khaad: number; water: number };
}): {
  count: number;
  selfYield: number;
  averageYield: number;
  topYield: number;
  tips: { key: string; difference: number; yieldAssociation: number }[];
} | null;
