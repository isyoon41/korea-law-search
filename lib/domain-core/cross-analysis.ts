import type { SearchItem } from '@/lib/schemas/types';

const hierarchyWeight: Record<string, number> = {
  law: 5,
  precedent: 4,
  rule: 3,
  ordinance: 2,
  specialized: 1
};

export function rankAndMerge(params: {
  query: string;
  abbreviationResolved: string;
  article?: string;
  buckets: SearchItem[][];
}): SearchItem[] {
  const merged = params.buckets.flat();
  const byId = new Map<string, SearchItem>();

  merged.forEach((item) => {
    if (!byId.has(item.id)) {
      byId.set(item.id, item);
      return;
    }

    const prev = byId.get(item.id)!;
    byId.set(item.id, {
      ...prev,
      summary: prev.summary ?? item.summary,
      raw: prev.raw ?? item.raw
    });
  });

  const scored = Array.from(byId.values()).map((item) => {
    let score = 0;
    if (item.title.includes(params.query)) score += 50;
    if (item.title.includes(params.abbreviationResolved)) score += 20;
    if (params.article && item.article?.includes(params.article)) score += 15;
    score += hierarchyWeight[item.domain] ?? 0;

    if (item.publishDate) {
      const yearsOld = Math.max(0, new Date().getFullYear() - new Date(item.publishDate).getFullYear());
      score += Math.max(0, 10 - yearsOld);
    }

    return { ...item, score };
  });

  return scored.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}
