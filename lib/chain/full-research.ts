import {
  retrieveLawText,
  retrieveThreeTier,
  searchLaws,
  searchLinkedOrdinances,
  searchPrecedents,
  searchRules,
  type LawSearchItem
} from '@/lib/connectors/law-api';
import { normalizeArticle } from '@/lib/domain-core/article-normalizer';

export type FullResearchInput = {
  query: string;
};

export type FullResearchResult = {
  success: true;
  query: string;
  normalizedQuery: {
    original: string;
    inferredLawName?: string;
    article?: {
      display: string;
      numeric: string;
    };
  };
  results: {
    laws: LawSearchItem[];
    articles: Array<{
      lawTitle: string;
      lawId?: string;
      mst?: string;
      articleDisplay?: string;
      articleNumeric?: string;
      articleTitle?: string;
      articleContent?: string;
    }>;
    precedents: Array<{
      caseName: string;
      caseNumber?: string;
      courtName?: string;
      sentenceDate?: string;
    }>;
    rules: Array<{
      title: string;
      ruleId?: string;
      ministry?: string;
    }>;
    ordinances: Array<{
      title: string;
      ordinanceId?: string;
      localGov?: string;
    }>;
    delegationTree?: {
      lawName?: string;
      items: Array<{
        level: 'law' | 'decree' | 'rule' | 'unknown';
        title: string;
        articleNo?: string;
        articleTitle?: string;
        content?: string;
        delegatedTo?: string;
      }>;
    };
  };
  meta: {
    topLawSelected: boolean;
    strategy: 'identifier-based';
    durationMs: number;
    sources: string[];
  };
};

function extractArticleFromQuery(query: string): { articleInput?: string; cleanedQuery: string } {
  const match = query.match(/제\s*\d+\s*조(?:\s*의\s*\d+)?|\b\d{1,3}\b/u);
  if (!match) return { cleanedQuery: query.trim() };

  const articleInput = match[0].trim();
  const cleanedQuery = query.replace(match[0], '').replace(/\s+/g, ' ').trim();
  return { articleInput, cleanedQuery };
}

export async function runFullResearch(input: FullResearchInput): Promise<FullResearchResult> {
  const started = Date.now();

  const original = input.query.trim();
  const { articleInput, cleanedQuery } = extractArticleFromQuery(original);
  const article = normalizeArticle(articleInput);

  const laws = await searchLaws(cleanedQuery || original, 10);
  const topLaw = laws[0];

  const [precedents, rules, ordinances] = await Promise.all([
    searchPrecedents(cleanedQuery || original, 10),
    searchRules(cleanedQuery || original, 10),
    searchLinkedOrdinances(cleanedQuery || original, 10)
  ]);

  let lawText: Awaited<ReturnType<typeof retrieveLawText>> | null = null;
  let threeTier: Awaited<ReturnType<typeof retrieveThreeTier>> | null = null;

  if (topLaw && (topLaw.lawId || topLaw.mst)) {
    lawText = await retrieveLawText({
      lawId: topLaw.lawId,
      mst: topLaw.mst,
      jo: article?.display
    });

    threeTier = await retrieveThreeTier({
      lawId: topLaw.lawId,
      mst: topLaw.mst,
      kind: 2
    });
  }

  return {
    success: true,
    query: input.query,
    normalizedQuery: {
      original,
      inferredLawName: topLaw?.title,
      article: article
        ? {
            display: article.display,
            numeric: article.numeric
          }
        : undefined
    },
    results: {
      laws,
      articles: lawText
        ? [
            {
              lawTitle: lawText.title,
              lawId: lawText.lawId,
              mst: lawText.mst,
              articleDisplay: lawText.article?.display,
              articleNumeric: lawText.article?.numeric,
              articleTitle: lawText.article?.title,
              articleContent: lawText.article?.content || lawText.bodyText
            }
          ]
        : [],
      precedents: precedents.map((p) => ({
        caseName: p.caseName,
        caseNumber: p.caseNumber,
        courtName: p.courtName,
        sentenceDate: p.sentenceDate
      })),
      rules: rules.map((r) => ({
        title: r.title,
        ruleId: r.ruleId,
        ministry: r.ministry
      })),
      ordinances: ordinances.map((o) => ({
        title: o.title,
        ordinanceId: o.ordinanceId,
        localGov: o.localGov
      })),
      delegationTree: threeTier
        ? {
            lawName: threeTier.lawName,
            items: threeTier.items
          }
        : undefined
    },
    meta: {
      topLawSelected: Boolean(topLaw),
      strategy: 'identifier-based',
      durationMs: Date.now() - started,
      sources: ['law', 'prec', 'admrul', 'lnkLs', 'thdCmp']
    }
  };
}
