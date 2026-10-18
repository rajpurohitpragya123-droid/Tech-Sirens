/**
 * Regional voice prompt caching and audio synthesis fallback for vernacular farmers.
 */

export class RegionalAudioCache {
  private cache = new Map<string, ArrayBuffer>();

  getKey(text: string, locale: string): string {
    return `${locale}:${text.trim().toLowerCase()}`;
  }

  get(text: string, locale: string): ArrayBuffer | undefined {
    return this.cache.get(this.getKey(text, locale));
  }

  set(text: string, locale: string, buffer: ArrayBuffer): void {
    this.cache.set(this.getKey(text, locale), buffer);
  }

  clear(): void {
    this.cache.clear();
  }
}

export const regionalAudioCache = new RegionalAudioCache();
