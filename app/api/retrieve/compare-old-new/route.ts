import { retrieveLawText } from '@/lib/connectors/law-api';
import { buildResponse } from '@/lib/utils/response';
import { errorResponse } from '@/lib/utils/errors';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const startedAt = Date.now();
  const url = new URL(req.url);
  const oldLaw = {
    id: url.searchParams.get('oldLawId') ?? undefined,
    mst: url.searchParams.get('oldMst') ?? undefined,
    lawName: url.searchParams.get('oldLawName') ?? undefined
  };
  const newLaw = {
    id: url.searchParams.get('newLawId') ?? undefined,
    mst: url.searchParams.get('newMst') ?? undefined,
    lawName: url.searchParams.get('newLawName') ?? undefined
  };
  if ((!oldLaw.id && !oldLaw.mst && !oldLaw.lawName) || (!newLaw.id && !newLaw.mst && !newLaw.lawName)) {
    return errorResponse('MISSING_IDENTIFIER', 'Both old and new laws require one of id, mst, or lawName');
  }

  const [oldArticles, newArticles] = await Promise.all([retrieveLawText(oldLaw), retrieveLawText(newLaw)]);

  return buildResponse({
    query: `${oldLaw.lawName ?? oldLaw.id ?? oldLaw.mst} vs ${newLaw.lawName ?? newLaw.id ?? newLaw.mst}`,
    normalizedQuery: { oldCount: oldArticles.length, newCount: newArticles.length },
    articles: [...oldArticles, ...newArticles],
    durationMs: Date.now() - startedAt,
    sources: ['law.go.kr']
  });
}
