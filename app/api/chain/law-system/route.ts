import { runFullResearch } from '@/lib/chain/pipelines';
import { buildResponse } from '@/lib/utils/response';
import { getRequiredQueryParam } from '@/lib/utils/route';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const startedAt = Date.now();
  const queryResult = getRequiredQueryParam(new URL(req.url), 'query');
  if ('error' in queryResult) return queryResult.error;
  const query = queryResult.value!;
  const data = await runFullResearch(query);

  return buildResponse({
    query,
    normalizedQuery: { ...data.normalizedQuery, chain: 'law-system' },
    laws: data.laws,
    rules: data.rules,
    ordinances: data.ordinances,
    durationMs: Date.now() - startedAt,
    sources: ['law.go.kr']
  });
}
