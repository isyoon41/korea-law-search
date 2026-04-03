import { normalizeArticle } from '@/lib/domain-core/article-normalizer';
import { retrieveLawText } from '@/lib/connectors/law-api';
import { buildResponse } from '@/lib/utils/response';
import { errorResponse } from '@/lib/utils/errors';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const startedAt = Date.now();
  const url = new URL(req.url);
  const lawName = url.searchParams.get('lawName') ?? undefined;
  const lawId = url.searchParams.get('lawId') ?? undefined;
  const mst = url.searchParams.get('mst') ?? undefined;
  if (!lawId && !mst && !lawName) {
    return errorResponse('MISSING_IDENTIFIER', 'One of lawId, mst, or lawName is required');
  }
  const numbers = (url.searchParams.get('articles') ?? '').split(',').map((v) => v.trim()).filter(Boolean);
  const normalized = numbers.map(normalizeArticle).filter((n): n is NonNullable<typeof n> => Boolean(n));

  const matched = await Promise.all(
    normalized.map(async (item) => {
      const data = await retrieveLawText({ lawId, mst, jo: item.display });
      return {
        id: `${data.lawId ?? data.mst ?? lawName}:${item.numeric}`,
        domain: 'law' as const,
        title: data.title,
        article: item.display,
        summary: data.article?.content ?? data.bodyText,
        source: 'law.go.kr'
      };
    })
  );

  return buildResponse({
    query: lawName ?? lawId ?? mst ?? '',
    normalizedQuery: { articles: normalized },
    articles: matched,
    durationMs: Date.now() - startedAt,
    sources: ['law.go.kr']
  });
}
