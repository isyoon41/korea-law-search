import { retrieveLawText } from '@/lib/connectors/law-api';
import { parseDelegationGraph } from '@/lib/domain-core/delegation-engine';
import { buildResponse } from '@/lib/utils/response';
import { getRequiredQueryParam } from '@/lib/utils/route';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const startedAt = Date.now();
  const lawResult = getRequiredQueryParam(new URL(req.url), 'lawName');
  if ('error' in lawResult) return lawResult.error;
  const lawName = lawResult.value!;

  const articles = await retrieveLawText(lawName);
  const graph = parseDelegationGraph(articles.map((a) => a.summary ?? '').join('\n'));

  return buildResponse({
    query: lawName,
    normalizedQuery: { delegationGraph: graph },
    articles,
    durationMs: Date.now() - startedAt,
    sources: ['law.go.kr']
  });
}
