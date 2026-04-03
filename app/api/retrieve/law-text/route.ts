import { retrieveLawText } from '@/lib/connectors/law-api';
import { MemoryCache, TTL } from '@/lib/cache/memory';
import { buildResponse } from '@/lib/utils/response';
import { readCache } from '@/lib/utils/route';
import { errorResponse } from '@/lib/utils/errors';
import { hashKey } from '@/lib/utils/hash';
import type { SearchItem } from '@/lib/schemas/types';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const startedAt = Date.now();
  const url = new URL(req.url);
  const lawId = url.searchParams.get('lawId') ?? undefined;
  const mst = url.searchParams.get('mst') ?? undefined;
  const lawName = url.searchParams.get('lawName') ?? undefined;
  if (!lawId && !mst && !lawName) {
    return errorResponse('MISSING_IDENTIFIER', 'One of lawId, mst, or lawName is required');
  }

  const cacheKey = `retrieve:law-text:${hashKey({ lawId, mst, lawName })}`;
  const cached = readCache<SearchItem[]>(cacheKey);
  const articles = cached.value ?? (await retrieveLawText({ id: lawId, mst, lawName }));
  if (!cached.cacheHit) MemoryCache.set(cacheKey, articles, TTL.LAW_TEXT);

  return buildResponse({
    query: lawName ?? lawId ?? mst ?? '',
    articles,
    durationMs: Date.now() - startedAt,
    cacheHit: cached.cacheHit,
    sources: ['law.go.kr']
  });
}
