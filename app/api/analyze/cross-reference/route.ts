import { searchDomain } from '@/lib/connectors/law-api';
import { rankAndMerge } from '@/lib/domain-core/cross-analysis';
import { buildResponse } from '@/lib/utils/response';
import { getRequiredQueryParam } from '@/lib/utils/route';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const startedAt = Date.now();
  const queryResult = getRequiredQueryParam(new URL(req.url), 'query');
  if ('error' in queryResult) return queryResult.error;
  const query = queryResult.value!;

  const [laws, precedents, rules, ordinances] = await Promise.all([
    searchDomain(query, 'law'),
    searchDomain(query, 'precedent'),
    searchDomain(query, 'rule'),
    searchDomain(query, 'ordinance')
  ]);

  const ranked = rankAndMerge({ query, abbreviationResolved: query, buckets: [laws, precedents, rules, ordinances] });

  return buildResponse({
    query,
    normalizedQuery: { rankedTop3: ranked.slice(0, 3) },
    laws,
    precedents,
    rules,
    ordinances,
    durationMs: Date.now() - startedAt,
    sources: ['law.go.kr']
  });
}
