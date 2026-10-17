export interface Listing {
  id: string;
  name: string;
  category: string;
  price: number;
  units: number;
  distance: number;
  rating: number;
  deliveryHours: number;
  verified: boolean;
  commission?: number;
}
export interface Buyer {
  id: string;
  name: string;
  price: number;
  transport: number;
  fees: number;
  loading: number;
  capacity: number;
  verified: boolean;
  distance: number;
  pickup: boolean;
}
export const cropReference: {
  id: string;
  duration: number;
  residueFactor: number;
  kc: number[];
  stageDays: number[];
}[];
export function rankInputs<T extends Listing>(listings: T[], need?: string): T[];
export function dose(
  areaAcres: number,
  dosePerAcre: number,
  packSize: number,
): { quantity: number; packs: number };
export function aboveGovernmentRate(price: number, rate: number | null): boolean;
export function netEarning(offer: Buyer, quantity: number): number;
export function matchingBuyers(
  offers: Buyer[],
  minPrice: number,
  quantity: number,
): (Buyer & { net: number })[];
export function waterBalance(s: {
  et0: number;
  kc: number;
  rain: number;
  irrigation: number;
  previous: number;
  capacity: number;
}): number;
export function irrigationDecision(s: {
  telemetryAgeMinutes: number;
  sessionMinutes: number;
  dayMinutes: number;
  manual?: string;
  moisture: number;
  target: number;
  threshold: number;
  rainProbability: number;
  insidePowerSlot: boolean;
}): { valve: string; reason: string };
export function splitFare(total: number, weights: number[]): number[];
export function stubbleEstimate(
  cropId: string,
  acres: number,
  yieldQuintalsPerAcre: number,
): { quintals: number; confidence: number };
export function benchmark(
  peers: { yield: number; sowingDays: number; fertiliserSplits: number }[],
  farmer: { sowingDays: number; fertiliserSplits: number },
  optIn: boolean,
): {
  count: number;
  median: number;
  topYield: number;
  gaps: { key: string; difference: number }[];
} | null;
export function issueCredit(
  collection: { id: string; confirmed: boolean; crop: string; quintals: number },
  scheme: { active: boolean; crops: string[]; rate: number; cap: number; version: number },
  ledger: { collectionId?: string; amount: number }[],
): { id: string; collectionId: string; amount: number; schemeVersion: number; type: string };
export function redeemCredit(
  ledger: { id: string; amount: number }[],
  amount: number,
  id: string,
): { id: string; amount: number; type: string };
