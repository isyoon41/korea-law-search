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
  const timeline = data.laws
    .sort((a, b) => (a.publishDate ?? '').localeCompare(b.publishDate ?? ''))
    .map((law) => ({ title: law.title, publishDate: law.publishDate }));

  return buildResponse({
    query,
    normalizedQuery: { chain: 'timeline-trace', timeline },
    laws: data.laws,
    durationMs: Date.now() - startedAt,
    sources: ['law.go.kr']
  });
}
