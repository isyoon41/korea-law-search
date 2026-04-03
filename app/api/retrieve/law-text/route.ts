import { retrieveLawText } from '@/lib/connectors/law-api';
import { MemoryCache, TTL } from '@/lib/cache/memory';
import { buildResponse } from '@/lib/utils/response';
import { getRequiredQueryParam, readCache } from '@/lib/utils/route';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const startedAt = Date.now();
  const url = new URL(req.url);
  const lawResult = getRequiredQueryParam(url, 'lawName');
  if ('error' in lawResult) return lawResult.error;

  const lawName = lawResult.value!;
  const cacheKey = `retrieve:law-text:${lawName}`;
  const cached = readCache(cacheKey);
  const articles = cached.value ?? (await retrieveLawText(lawName));
  if (!cached.cacheHit) MemoryCache.set(cacheKey, articles, TTL.LAW_TEXT);

  return buildResponse({
    query: lawName,
    articles,
    durationMs: Date.now() - startedAt,
    cacheHit: cached.cacheHit,
    sources: ['law.go.kr']
  });
}
