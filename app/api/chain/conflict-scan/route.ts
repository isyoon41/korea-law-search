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
  const conflictSignals = data.rules.map((rule) => ({ rule: rule.title, possibleConflictLawCount: data.laws.length }));

  return buildResponse({
    query,
    normalizedQuery: { chain: 'conflict-scan', conflictSignals },
    laws: data.laws,
    rules: data.rules,
    durationMs: Date.now() - startedAt,
    sources: ['law.go.kr']
  });
}
