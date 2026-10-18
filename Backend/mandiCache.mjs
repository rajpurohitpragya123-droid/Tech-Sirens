/**
 * Real-time Mandi Agricultural Commodities Price Cache.
 * Provides sub-millisecond price responses for farmer voice queries.
 */

export interface MandiPriceRecord {
  commodity: string;
  marketName: string;
  state: string;
  minPricePerQuintal: number;
  maxPricePerQuintal: number;
  modalPricePerQuintal: number;
  updatedAt: string;
}

export class MandiPriceCache {
  private cache = new Map<string, MandiPriceRecord>();
  private ttlMs = 1000 * 60 * 30; // 30 minutes

  set(commodity: string, state: string, record: MandiPriceRecord): void {
    const key = `${commodity.toLowerCase()}:${state.toLowerCase()}`;
    this.cache.set(key, record);
  }

  get(commodity: string, state: string): MandiPriceRecord | undefined {
    const key = `${commodity.toLowerCase()}:${state.toLowerCase()}`;
    return this.cache.get(key);
  }

  getAll(): MandiPriceRecord[] {
    return Array.from(this.cache.values());
  }
}

export const mandiPriceCache = new MandiPriceCache();
