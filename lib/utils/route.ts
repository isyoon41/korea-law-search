import { MemoryCache } from '@/lib/cache/memory';
import { errorResponse } from '@/lib/utils/errors';

export function getRequiredQueryParam(url: URL, key: string) {
  const value = url.searchParams.get(key);
  if (!value) {
    return { error: errorResponse('MISSING_QUERY', `Missing query parameter: ${key}`) };
  }
  return { value };
}

export function readCache<T>(key: string): { value: T | null; cacheHit: boolean } {
  const value = MemoryCache.get<T>(key);
  return { value, cacheHit: value !== null };
}
