import { retrieveLawText } from '@/lib/connectors/law-api';
import { buildResponse } from '@/lib/utils/response';
import { errorResponse } from '@/lib/utils/errors';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const startedAt = Date.now();
  const url = new URL(req.url);
  const oldLaw = {
    id: url.searchParams.get('oldLawId') ?? undefined,
    mst: url.searchParams.get('oldMst') ?? undefined
  };
  const newLaw = {
    id: url.searchParams.get('newLawId') ?? undefined,
    mst: url.searchParams.get('newMst') ?? undefined
  };
  if ((!oldLaw.id && !oldLaw.mst) || (!newLaw.id && !newLaw.mst)) {
    return errorResponse('MISSING_IDENTIFIER', 'Both old and new laws require one of id or mst');
  }

  const [oldResult, newResult] = await Promise.all([
    retrieveLawText({ lawId: oldLaw.id, mst: oldLaw.mst }),
    retrieveLawText({ lawId: newLaw.id, mst: newLaw.mst })
  ]);

  return buildResponse({
    query: `${oldLaw.id ?? oldLaw.mst} vs ${newLaw.id ?? newLaw.mst}`,
    normalizedQuery: { oldCount: oldResult.bodyText ? 1 : 0, newCount: newResult.bodyText ? 1 : 0 },
    articles: [
      {
        id: `${oldResult.lawId ?? oldResult.mst ?? 'old'}:body`,
        domain: 'law',
        title: oldResult.title,
        summary: oldResult.bodyText,
        source: 'law.go.kr'
      },
      {
        id: `${newResult.lawId ?? newResult.mst ?? 'new'}:body`,
        domain: 'law',
        title: newResult.title,
        summary: newResult.bodyText,
        source: 'law.go.kr'
      }
    ],
    durationMs: Date.now() - startedAt,
    sources: ['law.go.kr']
  });
}
