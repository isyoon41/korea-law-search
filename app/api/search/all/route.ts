import { resolveAbbreviation } from '@/lib/domain-core/abbreviations';
import { normalizeArticle } from '@/lib/domain-core/article-normalizer';
import { rankAndMerge } from '@/lib/domain-core/cross-analysis';
import { searchDomain } from '@/lib/connectors/law-api';
import { buildResponse } from '@/lib/utils/response';
import { getRequiredQueryParam } from '@/lib/utils/route';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const startedAt = Date.now();
  const url = new URL(req.url);
  const queryResult = getRequiredQueryParam(url, 'query');
  if ('error' in queryResult) return queryResult.error;

  const query = queryResult.value!;
  const articleRaw = url.searchParams.get('article') ?? undefined;
  const resolved = resolveAbbreviation(query);
  const normalizedArticle = articleRaw ? normalizeArticle(articleRaw) : undefined;

  const [laws, precedents, rules, ordinances, specialized] = await Promise.all([
    searchDomain(resolved.resolved, 'law'),
    searchDomain(resolved.resolved, 'precedent'),
    searchDomain(resolved.resolved, 'rule'),
    searchDomain(resolved.resolved, 'ordinance'),
    searchDomain(resolved.resolved, 'specialized')
  ]);

  const ranked = rankAndMerge({
    query,
    abbreviationResolved: resolved.resolved,
    article: normalizedArticle?.display,
    buckets: [laws, precedents, rules, ordinances, specialized]
  });

  return buildResponse({
    query,
    normalizedQuery: {
      abbreviation: resolved,
      ...(normalizedArticle ? { article: normalizedArticle } : {}),
      rankedCount: ranked.length,
      specializedCount: specialized.length
    },
    laws,
    precedents,
    rules,
    ordinances,
    durationMs: Date.now() - startedAt,
    sources: ['law.go.kr']
  });
}
