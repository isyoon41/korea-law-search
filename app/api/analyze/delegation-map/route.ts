import { retrieveLawText } from '@/lib/connectors/law-api';
import { parseDelegationGraph } from '@/lib/domain-core/delegation-engine';
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

  const articles = await retrieveLawText({ id: lawId, mst, lawName });
  const graph = parseDelegationGraph(articles.map((a) => a.summary ?? '').join('\n'));

  return buildResponse({
    query: lawName ?? lawId ?? mst ?? '',
    normalizedQuery: { delegationGraph: graph },
    articles,
    durationMs: Date.now() - startedAt,
    sources: ['law.go.kr']
  });
}
