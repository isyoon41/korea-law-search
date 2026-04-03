import { searchDomain } from '@/lib/connectors/law-api';
import { resolveAbbreviation } from '@/lib/domain-core/abbreviations';
import { MemoryCache, TTL } from '@/lib/cache/memory';
import { buildResponse } from '@/lib/utils/response';
import { getRequiredQueryParam, readCache } from '@/lib/utils/route';
import { hashKey } from '@/lib/utils/hash';
import type { SearchItem } from '@/lib/schemas/types';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const startedAt = Date.now();
  const url = new URL(req.url);
  const queryResult = getRequiredQueryParam(url, 'query');
  if ('error' in queryResult) return queryResult.error;

  const query = queryResult.value!;
  const resolved = resolveAbbreviation(query);
  const cacheKey = `search:law:${hashKey({ q: resolved.resolved, domain: 'law' })}`;
  const cached = readCache<SearchItem[]>(cacheKey);
  const laws = cached.value ?? (await searchDomain(resolved.resolved, 'law'));
  if (!cached.cacheHit) MemoryCache.set(cacheKey, laws, TTL.SEARCH);

  return buildResponse({
    query,
    normalizedQuery: { abbreviation: resolved },
    laws,
    durationMs: Date.now() - startedAt,
    cacheHit: cached.cacheHit,
    sources: ['law.go.kr']
  });
}
