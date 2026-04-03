import { normalizeArticle } from '@/lib/domain-core/article-normalizer';
import { retrieveLawText } from '@/lib/connectors/law-api';
import { buildResponse } from '@/lib/utils/response';
import { getRequiredQueryParam } from '@/lib/utils/route';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const startedAt = Date.now();
  const url = new URL(req.url);
  const lawResult = getRequiredQueryParam(url, 'lawName');
  if ('error' in lawResult) return lawResult.error;

  const lawName = lawResult.value!;
  const numbers = (url.searchParams.get('articles') ?? '').split(',').map((v) => v.trim()).filter(Boolean);
  const normalized = numbers.map(normalizeArticle);

  const all = await retrieveLawText(lawName);
  const matched = all.filter((item) => normalized.some((n) => item.article?.includes(n.display.replace('제', '').replace('조', ''))));

  return buildResponse({
    query: lawName,
    normalizedQuery: { articles: normalized },
    articles: matched,
    durationMs: Date.now() - startedAt,
    sources: ['law.go.kr']
  });
}
