import { retrieveLawText } from '@/lib/connectors/law-api';
import { buildResponse } from '@/lib/utils/response';
import { getRequiredQueryParam } from '@/lib/utils/route';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const startedAt = Date.now();
  const url = new URL(req.url);
  const oldLaw = getRequiredQueryParam(url, 'oldLawName');
  if ('error' in oldLaw) return oldLaw.error;
  const newLaw = getRequiredQueryParam(url, 'newLawName');
  if ('error' in newLaw) return newLaw.error;

  const [oldArticles, newArticles] = await Promise.all([retrieveLawText(oldLaw.value!), retrieveLawText(newLaw.value!)]);

  return buildResponse({
    query: `${oldLaw.value} vs ${newLaw.value}`,
    normalizedQuery: { oldCount: oldArticles.length, newCount: newArticles.length },
    articles: [...oldArticles, ...newArticles],
    durationMs: Date.now() - startedAt,
    sources: ['law.go.kr']
  });
}
