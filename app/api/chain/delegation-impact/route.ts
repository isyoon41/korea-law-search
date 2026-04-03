import { runDelegationImpact } from '@/lib/chain/pipelines';
import { buildResponse } from '@/lib/utils/response';
import { getRequiredQueryParam } from '@/lib/utils/route';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const startedAt = Date.now();
  const queryResult = getRequiredQueryParam(new URL(req.url), 'query');
  if ('error' in queryResult) return queryResult.error;
  const query = queryResult.value!;

  const data = await runDelegationImpact(query);
  return buildResponse({
    query,
    normalizedQuery: { delegation: data.delegation, chain: 'delegation-impact' },
    laws: data.laws,
    durationMs: Date.now() - startedAt,
    sources: ['law.go.kr']
  });
}
