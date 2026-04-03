import { searchDomain } from '@/lib/connectors/law-api';
import { buildResponse } from '@/lib/utils/response';
import { getRequiredQueryParam } from '@/lib/utils/route';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const startedAt = Date.now();
  const queryResult = getRequiredQueryParam(new URL(req.url), 'query');
  if ('error' in queryResult) return queryResult.error;
  const query = queryResult.value!;

  const [laws, rules] = await Promise.all([searchDomain(query, 'law'), searchDomain(query, 'rule')]);
  const signals = laws.slice(0, 5).map((law) => ({ law: law.title, conflictingRuleCount: rules.length }));

  return buildResponse({
    query,
    normalizedQuery: { conflictSignals: signals },
    laws,
    rules,
    durationMs: Date.now() - startedAt,
    sources: ['law.go.kr']
  });
}
