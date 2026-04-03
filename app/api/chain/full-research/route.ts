import { MemoryCache, TTL } from '@/lib/cache/memory';
import { runFullResearch } from '@/lib/chain/pipelines';
import { buildResponse } from '@/lib/utils/response';
import { getRequiredQueryParam, readCache } from '@/lib/utils/route';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const startedAt = Date.now();
  const url = new URL(req.url);
  const queryResult = getRequiredQueryParam(url, 'query');
  if ('error' in queryResult) return queryResult.error;
  const query = queryResult.value!;
  const article = url.searchParams.get('article') ?? undefined;

  const cacheKey = `chain:full-research:${query}:${article ?? ''}`;
  const cached = readCache<Awaited<ReturnType<typeof runFullResearch>>>(cacheKey);
  const data = cached.value ?? (await runFullResearch(query, article));
  if (!cached.cacheHit) MemoryCache.set(cacheKey, data, TTL.CHAIN_LONG);

  return buildResponse({
    query,
    normalizedQuery: data.normalizedQuery,
    laws: data.laws,
    articles: data.articles,
    precedents: data.precedents,
    rules: data.rules,
    ordinances: data.ordinances,
    durationMs: Date.now() - startedAt,
    cacheHit: cached.cacheHit,
    sources: ['law.go.kr']
  });
}
