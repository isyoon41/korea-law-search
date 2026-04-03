import { z } from 'zod';
import { normalizeArticle } from '@/lib/domain-core/article-normalizer';
import type { DomainType, SearchItem } from '@/lib/schemas/types';

const BASE_URL = process.env.LAW_API_BASE_URL?.replace(/\/+$/, '') || 'https://www.law.go.kr/DRF';
const LAW_OC = process.env.LAW_OC;
const USE_MOCK = process.env.LAW_API_MOCK === 'true' || !LAW_OC;

type JsonRecord = Record<string, any>;

export type LawSearchItem = {
  title: string;
  lawId?: string;
  mst?: string;
  promulgationDate?: string;
  promulgationNumber?: string;
  revisionType?: string;
  ministry?: string;
  lawType?: string;
  abbreviation?: string;
  source: 'law';
};

export type PrecedentSearchItem = {
  caseName: string;
  caseNumber?: string;
  courtName?: string;
  sentenceDate?: string;
  source: 'precedent';
};

export type RuleSearchItem = {
  title: string;
  ruleId?: string;
  ministry?: string;
  source: 'rule';
};

export type OrdinanceSearchItem = {
  title: string;
  ordinanceId?: string;
  localGov?: string;
  source: 'ordinance';
};

export type SpecializedSearchItem = {
  title: string;
  caseNumber?: string;
  decisionDate?: string;
  source: 'specialized';
};

export type LawTextResult = {
  lawId?: string;
  mst?: string;
  title: string;
  lawType?: string;
  promulgationDate?: string;
  promulgationNumber?: string;
  article?: {
    display?: string;
    numeric?: string;
    title?: string;
    content?: string;
  };
  bodyText?: string;
  source: 'lawText';
};

export type ThreeTierResult = {
  lawName?: string;
  lawId?: string;
  mst?: string;
  items: Array<{
    level: 'law' | 'decree' | 'rule' | 'unknown';
    title: string;
    articleNo?: string;
    articleTitle?: string;
    content?: string;
    delegatedTo?: string;
  }>;
  source: 'threeTier';
};

function buildSearchUrl(target: string, params: Record<string, string | number | undefined>) {
  const url = new URL(`${BASE_URL}/lawSearch.do`);
  url.searchParams.set('OC', LAW_OC || '');
  url.searchParams.set('target', target);
  url.searchParams.set('type', 'JSON');

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
}

function buildServiceUrl(target: string, params: Record<string, string | number | undefined>) {
  const url = new URL(`${BASE_URL}/lawService.do`);
  url.searchParams.set('OC', LAW_OC || '');
  url.searchParams.set('target', target);
  url.searchParams.set('type', 'JSON');

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
}

async function fetchJson<T = any>(url: string): Promise<T> {
  const res = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store'
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Law API request failed: ${res.status} ${text}`);
  }

  return res.json() as Promise<T>;
}

function ensureArray<T>(value: T | T[] | undefined | null): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function pickFirstDefined<T = string>(...values: any[]): T | undefined {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== '') return value as T;
  }
  return undefined;
}

function toText(value: any): string | undefined {
  if (value === undefined || value === null) return undefined;
  return String(value).trim();
}

function mapLawSearchItem(item: JsonRecord): LawSearchItem {
  return {
    title: pickFirstDefined(item['법령명한글'], item['법령명_한글'], item['법령명'], item['법령명한글내용']) || '',
    abbreviation: pickFirstDefined(item['법령약칭명'], item['법령약칭명내용']),
    lawId: toText(pickFirstDefined(item['법령ID'], item['법령아이디'], item['ID'])),
    mst: toText(pickFirstDefined(item['법령일련번호'], item['MST'], item['법령마스터번호'])),
    promulgationDate: toText(item['공포일자']),
    promulgationNumber: toText(item['공포번호']),
    revisionType: toText(item['제개정구분명']),
    ministry: toText(item['소관부처명']),
    lawType: toText(item['법령구분명']),
    source: 'law'
  };
}

function mapPrecedentSearchItem(item: JsonRecord): PrecedentSearchItem {
  return {
    caseName: pickFirstDefined(item['사건명'], item['판례명']) || '',
    caseNumber: toText(item['사건번호']),
    courtName: toText(item['법원명']),
    sentenceDate: toText(item['선고일자']),
    source: 'precedent'
  };
}

function mapRuleSearchItem(item: JsonRecord): RuleSearchItem {
  return {
    title: pickFirstDefined(item['행정규칙명'], item['안건명'], item['제목']) || '',
    ruleId: toText(pickFirstDefined(item['행정규칙일련번호'], item['ID'])),
    ministry: toText(item['소관부처명']),
    source: 'rule'
  };
}

function mapOrdinanceSearchItem(item: JsonRecord): OrdinanceSearchItem {
  return {
    title: pickFirstDefined(item['자치법규명'], item['조례명'], item['제목']) || '',
    ordinanceId: toText(pickFirstDefined(item['자치법규일련번호'], item['ID'])),
    localGov: toText(pickFirstDefined(item['자치단체명'], item['기관명'])),
    source: 'ordinance'
  };
}

function mapSpecializedSearchItem(item: JsonRecord): SpecializedSearchItem {
  return {
    title: pickFirstDefined(item['재결례명'], item['결정례명'], item['사건명'], item['제목']) || '',
    caseNumber: toText(pickFirstDefined(item['사건번호'], item['재결번호'], item['결정번호'])),
    decisionDate: toText(pickFirstDefined(item['재결일자'], item['결정일자'], item['선고일자'])),
    source: 'specialized'
  };
}

export async function searchLaws(query: string, display = 20): Promise<LawSearchItem[]> {
  if (USE_MOCK) {
    return [
      {
        title: query.includes('근') ? '근로기준법' : `${query} 관련 법령`,
        lawId: 'MOCK-LAW-0001',
        mst: 'MOCK-MST-0001',
        promulgationDate: '2024-01-01',
        promulgationNumber: '제10000호',
        revisionType: '일부개정',
        ministry: '고용노동부',
        lawType: '법률',
        source: 'law' as const
      }
    ].slice(0, display);
  }
  const json = await fetchJson<JsonRecord>(buildSearchUrl('law', { query, display }));
  const root = json['LawSearch'] || json['lawSearch'] || json;
  return ensureArray(root['law']).map(mapLawSearchItem).filter((x) => x.title);
}

export async function searchPrecedents(query: string, display = 20): Promise<PrecedentSearchItem[]> {
  if (USE_MOCK) {
    return [
      {
        caseName: `${query} 관련 판례`,
        caseNumber: '2024다00001',
        courtName: '대법원',
        sentenceDate: '2024-05-01',
        source: 'precedent' as const
      }
    ].slice(0, display);
  }
  const json = await fetchJson<JsonRecord>(buildSearchUrl('prec', { query, display }));
  const root = json['PrecSearch'] || json['precSearch'] || json;
  return ensureArray(root['prec']).map(mapPrecedentSearchItem).filter((x) => x.caseName);
}

export async function searchRules(query: string, display = 20): Promise<RuleSearchItem[]> {
  if (USE_MOCK) {
    return [
      {
        title: `${query} 시행규칙`,
        ruleId: 'MOCK-RULE-0001',
        ministry: '고용노동부',
        source: 'rule' as const
      }
    ].slice(0, display);
  }
  const json = await fetchJson<JsonRecord>(buildSearchUrl('admrul', { query, display }));
  const root = json['AdmRuleSearch'] || json['AdmRulSearch'] || json;
  return ensureArray(root['admrule'] || root['admrul']).map(mapRuleSearchItem).filter((x) => x.title);
}

export async function searchLinkedOrdinances(query: string, display = 20): Promise<OrdinanceSearchItem[]> {
  if (USE_MOCK) {
    return [
      {
        title: `${query} 조례`,
        ordinanceId: 'MOCK-ORD-0001',
        localGov: '서울특별시',
        source: 'ordinance' as const
      }
    ].slice(0, display);
  }
  const json = await fetchJson<JsonRecord>(buildSearchUrl('lnkLs', { query, display }));
  const root = json['LnkLsSearch'] || json['lnkLsSearch'] || json;
  return ensureArray(root['law']).map(mapOrdinanceSearchItem).filter((x) => x.title);
}

export async function searchSpecialized(query: string, display = 20): Promise<SpecializedSearchItem[]> {
  if (USE_MOCK) {
    return [
      {
        title: `${query} 관련 전문결정`,
        caseNumber: 'MOCK-SP-0001',
        decisionDate: '2024-06-01',
        source: 'specialized' as const
      }
    ].slice(0, display);
  }
  const json = await fetchJson<JsonRecord>(buildSearchUrl('expc', { query, display }));
  const root = json['ExpcSearch'] || json['expcSearch'] || json;
  return ensureArray(root['expc']).map(mapSpecializedSearchItem).filter((x) => x.title);
}

const RetrieveLawTextInputSchema = z.object({
  lawId: z.string().optional(),
  mst: z.string().optional(),
  jo: z.string().optional()
});

export async function retrieveLawText(input: z.infer<typeof RetrieveLawTextInputSchema>): Promise<LawTextResult> {
  const parsed = RetrieveLawTextInputSchema.parse(input);
  if (!parsed.lawId && !parsed.mst) {
    throw new Error('retrieveLawText requires lawId or mst');
  }
  const canonicalArticle = normalizeArticle(parsed.jo);
  if (USE_MOCK) {
    return {
      lawId: parsed.lawId ?? 'MOCK-LAW-0001',
      mst: parsed.mst ?? 'MOCK-MST-0001',
      title: '근로기준법',
      lawType: '법률',
      promulgationDate: '2024-01-01',
      promulgationNumber: '제10000호',
      article: canonicalArticle
        ? {
            display: canonicalArticle.display,
            numeric: canonicalArticle.numeric,
            title: canonicalArticle.display,
            content: `${canonicalArticle.display} 모의 본문 내용`
          }
        : undefined,
      bodyText: '모의 법령 본문 내용',
      source: 'lawText'
    };
  }

  const json = await fetchJson<JsonRecord>(
    buildServiceUrl('law', { ID: parsed.lawId, MST: parsed.mst, JO: canonicalArticle?.numeric })
  );

  const root = json['법령'] || json['LawService'] || json;
  const articles = ensureArray(root['조문'] || root['JO'] || root['조문단위']);
  const firstArticle = articles[0] || {};

  const articleTitle = pickFirstDefined(firstArticle['조문제목'], firstArticle['조제목'], firstArticle['제목']);
  const articleContent = pickFirstDefined(firstArticle['조문내용'], firstArticle['조내용'], firstArticle['내용']);

  return {
    lawId: toText(pickFirstDefined(root['법령ID'], parsed.lawId)),
    mst: toText(pickFirstDefined(root['법령일련번호'], parsed.mst)),
    title: pickFirstDefined(root['법령명한글'], root['법령명_한글'], root['법령명']) || '',
    lawType: toText(pickFirstDefined(root['법종구분명'], root['법령구분명'])),
    promulgationDate: toText(root['공포일자']),
    promulgationNumber: toText(root['공포번호']),
    article: canonicalArticle
      ? {
          display: canonicalArticle.display,
          numeric: canonicalArticle.numeric,
          title: toText(articleTitle),
          content: toText(articleContent)
        }
      : undefined,
    bodyText: toText(pickFirstDefined(root['본문'], root['법령내용'], articleContent)),
    source: 'lawText'
  };
}

export async function retrieveThreeTier(input: { lawId?: string; mst?: string; kind?: 1 | 2 }): Promise<ThreeTierResult> {
  if (!input.lawId && !input.mst) {
    throw new Error('retrieveThreeTier requires lawId or mst');
  }
  if (USE_MOCK) {
    return {
      lawName: '근로기준법',
      lawId: input.lawId ?? 'MOCK-LAW-0001',
      mst: input.mst ?? 'MOCK-MST-0001',
      items: [
        {
          level: 'law',
          title: '근로기준법',
          articleNo: '003800',
          articleTitle: '제38조',
          content: '대통령령으로 정한다',
          delegatedTo: 'decree'
        },
        {
          level: 'decree',
          title: '근로기준법 시행령',
          articleNo: '003800',
          articleTitle: '제38조',
          content: '부령으로 정한다',
          delegatedTo: 'rule'
        }
      ],
      source: 'threeTier'
    };
  }

  const json = await fetchJson<JsonRecord>(
    buildServiceUrl('thdCmp', { ID: input.lawId, MST: input.mst, knd: input.kind ?? 2 })
  );

  const root = json['3단비교'] || json['thdCmp'] || json;
  const rawItems = ensureArray(root['조문'] || root['item'] || root['내용']);

  const items = rawItems.map((item: JsonRecord) => {
    const title =
      pickFirstDefined(item['법령명'], item['법령명한글'], item['시행령명'], item['시행규칙명'], item['제목']) || '';
    const content = pickFirstDefined(item['조문내용'], item['내용'], item['본문']);
    const articleNo = pickFirstDefined(item['조문번호'], item['조번호'], item['JO']);
    const articleTitle = pickFirstDefined(item['조문제목'], item['조제목'], item['제목']);

    let level: 'law' | 'decree' | 'rule' | 'unknown' = 'unknown';
    if (/시행규칙/.test(title)) level = 'rule';
    else if (/시행령/.test(title)) level = 'decree';
    else if (title) level = 'law';

    let delegatedTo: string | undefined;
    if (typeof content === 'string') {
      if (content.includes('대통령령으로 정한다')) delegatedTo = 'decree';
      else if (content.includes('부령으로 정한다') || content.includes('고용노동부령으로 정한다')) delegatedTo = 'rule';
    }

    return {
      level,
      title,
      articleNo: toText(articleNo),
      articleTitle: toText(articleTitle),
      content: toText(content),
      delegatedTo
    };
  });

  return {
    lawName: pickFirstDefined(root['법령명'], root['법령명한글']),
    lawId: toText(pickFirstDefined(root['법령ID'], input.lawId)),
    mst: toText(pickFirstDefined(root['법령일련번호'], input.mst)),
    items,
    source: 'threeTier'
  };
}

// Compatibility wrappers
function toSearchItemLaw(x: LawSearchItem): SearchItem {
  return {
    id: x.lawId ?? x.mst ?? x.title,
    domain: 'law',
    title: x.title,
    lawId: x.lawId,
    mst: x.mst,
    publishDate: x.promulgationDate,
    source: 'law.go.kr',
    raw: x
  };
}

export async function searchDomain(query: string, domain: DomainType): Promise<SearchItem[]> {
  if (domain === 'law') return (await searchLaws(query)).map(toSearchItemLaw);
  if (domain === 'precedent') {
    return (await searchPrecedents(query)).map((x) => ({
      id: x.caseNumber ?? x.caseName,
      domain: 'precedent',
      title: x.caseName,
      publishDate: x.sentenceDate,
      source: 'law.go.kr',
      raw: x
    }));
  }
  if (domain === 'rule') {
    return (await searchRules(query)).map((x) => ({
      id: x.ruleId ?? x.title,
      domain: 'rule',
      title: x.title,
      source: 'law.go.kr',
      raw: x
    }));
  }
  if (domain === 'ordinance') {
    return (await searchLinkedOrdinances(query)).map((x) => ({
      id: x.ordinanceId ?? x.title,
      domain: 'ordinance',
      title: x.title,
      source: 'law.go.kr',
      raw: x
    }));
  }
  if (domain === 'specialized') {
    return (await searchSpecialized(query)).map((x) => ({
      id: x.caseNumber ?? x.title,
      domain: 'specialized',
      title: x.title,
      publishDate: x.decisionDate,
      source: 'law.go.kr',
      raw: x
    }));
  }
  return [];
}

export async function retrieveLawTextItems(input: { lawId?: string; mst?: string; jo?: string }): Promise<SearchItem[]> {
  const data = await retrieveLawText(input);
  return [
    {
      id: `${data.lawId ?? data.mst ?? data.title}:${data.article?.numeric ?? 'body'}`,
      domain: 'law',
      title: data.title,
      lawId: data.lawId,
      mst: data.mst,
      article: data.article?.display,
      summary: data.article?.content ?? data.bodyText,
      source: 'law.go.kr',
      raw: data
    }
  ];
}

export async function retrieveLawArticles(input: { id?: string; mst?: string; jo?: string }): Promise<SearchItem[]> {
  return retrieveLawTextItems({ lawId: input.id, mst: input.mst, jo: input.jo });
}
