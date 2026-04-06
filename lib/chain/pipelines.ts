import { resolveAbbreviation } from '@/lib/domain-core/abbreviations';
import { normalizeArticle } from '@/lib/domain-core/article-normalizer';
import { rankAndMerge } from '@/lib/domain-core/cross-analysis';
import { parseDelegationGraph } from '@/lib/domain-core/delegation-engine';
import { retrieveLawArticles, retrieveLawText, searchDomain } from '@/lib/connectors/law-api';
import type { SearchItem } from '@/lib/schemas/types';

export async function runFullResearch(query: string, articleRaw?: string) {
  const resolved = resolveAbbreviation(query);
  const normalizedArticle = articleRaw ? normalizeArticle(articleRaw) : undefined;

  const [laws, precedents, rules, ordinances] = await Promise.all([
    searchDomain(resolved.resolved, 'law'),
    searchDomain(resolved.resolved, 'precedent'),
    searchDomain(resolved.resolved, 'rule'),
    searchDomain(resolved.resolved, 'ordinance')
  ]);

  const topLaw = laws[0];
  const articles = topLaw ? await retrieveLawArticles({ id: topLaw.lawId, mst: topLaw.mst }) : [];

  const ranked = rankAndMerge({
    query,
    abbreviationResolved: resolved.resolved,
    article: normalizedArticle?.display,
    buckets: [laws, precedents, rules, ordinances, articles]
  });

  return {
    normalizedQuery: {
      abbreviation: resolved,
      ...(normalizedArticle ? { article: normalizedArticle } : {})
    },
    laws,
    articles,
    precedents,
    rules,
    ordinances,
    ranked
  };
}

export async function runDelegationImpact(query: string): Promise<{ laws: SearchItem[]; delegation: unknown }> {
  const laws = await searchDomain(query, 'law');
  const topLaw = laws[0];
  const lawText = topLaw ? await retrieveLawText({ lawId: topLaw.lawId, mst: topLaw.mst }) : null;
  const mergedText = lawText ? (lawText.article?.content ?? lawText.bodyText ?? '') : '';
  const delegation = parseDelegationGraph(mergedText);
  return { laws, delegation };
}
