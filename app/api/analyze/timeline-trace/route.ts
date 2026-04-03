import { searchDomain } from '@/lib/connectors/law-api';
import { buildResponse } from '@/lib/utils/response';
import { getRequiredQueryParam } from '@/lib/utils/route';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const startedAt = Date.now();
  const queryResult = getRequiredQueryParam(new URL(req.url), 'query');
  if ('error' in queryResult) return queryResult.error;
  const query = queryResult.value!;

  const laws = await searchDomain(query, 'law');
  const timeline = [...laws]
    .sort((a, b) => (a.publishDate ?? '').localeCompare(b.publishDate ?? ''))
    .map((item) => ({ title: item.title, publishDate: item.publishDate }));

  return buildResponse({
    query,
    normalizedQuery: { timeline },
    laws,
    durationMs: Date.now() - startedAt,
    sources: ['law.go.kr']
  });
}
