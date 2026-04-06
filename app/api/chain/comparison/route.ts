import { runFullResearch } from '@/lib/chain/pipelines';
import { buildResponse } from '@/lib/utils/response';
import { getRequiredQueryParam } from '@/lib/utils/route';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const startedAt = Date.now();
  const url = new URL(req.url);
  const lhsResult = getRequiredQueryParam(url, 'lhs');
  if ('error' in lhsResult) return lhsResult.error;
  const rhsResult = getRequiredQueryParam(url, 'rhs');
  if ('error' in rhsResult) return rhsResult.error;

  const lhs = await runFullResearch(lhsResult.value!);
  const rhs = await runFullResearch(rhsResult.value!);

  return buildResponse({
    query: `${lhsResult.value} vs ${rhsResult.value}`,
    normalizedQuery: {
      chain: 'comparison',
      lhsLawCount: lhs.laws.length,
      rhsLawCount: rhs.laws.length
    },
    laws: [...lhs.laws, ...rhs.laws],
    precedents: [...lhs.precedents, ...rhs.precedents],
    rules: [...lhs.rules, ...rhs.rules],
    ordinances: [...lhs.ordinances, ...rhs.ordinances],
    durationMs: Date.now() - startedAt,
    sources: ['law.go.kr']
  });
}
