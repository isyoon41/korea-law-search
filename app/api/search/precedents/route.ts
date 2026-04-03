import { searchDomain } from '@/lib/connectors/law-api';
import { buildResponse } from '@/lib/utils/response';
import { getRequiredQueryParam } from '@/lib/utils/route';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const startedAt = Date.now();
  const url = new URL(req.url);
  const queryResult = getRequiredQueryParam(url, 'query');
  if ('error' in queryResult) return queryResult.error;

  const query = queryResult.value!;
  const precedents = await searchDomain(query, 'precedent');

  return buildResponse({
    query,
    precedents,
    durationMs: Date.now() - startedAt,
    sources: ['law.go.kr']
  });
}
