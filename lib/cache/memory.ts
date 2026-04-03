interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

export class MemoryCache {
  static get<T>(key: string): T | null {
    const entry = store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  static set<T>(key: string, value: T, ttlSeconds: number): void {
    store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000
    });
  }
}

export const TTL = {
  SEARCH: 60 * 60 * 24,
  LAW_TEXT: 60 * 60 * 24 * 7,
  CHAIN_SHORT: 60 * 60,
  CHAIN_LONG: 60 * 60 * 6
};
