import { parseXml } from '@/lib/xml/parse';
import type { DomainType, SearchItem } from '@/lib/schemas/types';

const BASE_URL = process.env.LAW_API_BASE_URL ?? 'https://www.law.go.kr/DRF';
const LAW_OC = process.env.LAW_OC;

function assertApiKey() {
  if (!LAW_OC) {
    throw new Error('LAW_OC is not configured');
  }
}

async function callLawApi(path: string, params: Record<string, string>): Promise<unknown> {
  assertApiKey();
  const url = new URL(`${BASE_URL}/${path}`);

  Object.entries({ ...params, OC: LAW_OC! }).forEach(([k, v]) => {
    url.searchParams.set(k, v);
  });

  const response = await fetch(url.toString(), { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Law API request failed: ${response.status}`);
  }

  const xml = await response.text();
  return parseXml(xml);
}

function normalizeItem(domain: DomainType, raw: Record<string, unknown>): SearchItem {
  return {
    id: String(raw.법령ID ?? raw.판례일련번호 ?? raw.ID ?? `${domain}-${Math.random()}`),
    domain,
    title: String(raw.법령명한글 ?? raw.사건명 ?? raw.자치법규명 ?? raw.행정규칙명 ?? '제목없음'),
    summary: String(raw.조문내용 ?? raw.판시사항 ?? raw.내용 ?? ''),
    article: raw.조번호 ? String(raw.조번호) : undefined,
    publishDate: raw.공포일자 ? String(raw.공포일자) : undefined,
    source: 'law.go.kr',
    raw
  };
}

export async function searchDomain(query: string, domain: DomainType): Promise<SearchItem[]> {
  const targetMap: Record<DomainType, string> = {
    law: 'lawSearch.do',
    precedent: 'precSearch.do',
    rule: 'admRuleSearch.do',
    ordinance: 'ordinSearch.do',
    specialized: 'expcSearch.do'
  };

  const parsed = (await callLawApi(targetMap[domain], { query, type: 'XML' })) as Record<string, unknown>;
  const list = (parsed?.LawSearch?.law || parsed?.PrecSearch?.prec || parsed?.AdmRuleSearch?.admrule || []) as Array<
    Record<string, unknown>
  >;

  if (!Array.isArray(list)) return [];
  return list.map((item) => normalizeItem(domain, item));
}

export async function retrieveLawText(lawName: string): Promise<SearchItem[]> {
  const parsed = (await callLawApi('lawService.do', { target: 'law', query: lawName, type: 'XML' })) as Record<string, any>;
  const articles = parsed?.Law?.조문?.조문단위 ?? [];
  const arr = Array.isArray(articles) ? articles : [articles];

  return arr.filter(Boolean).map((article: Record<string, unknown>, idx: number) => ({
    id: `${lawName}-${idx}`,
    domain: 'law',
    title: String(article.조문제목 ?? `${lawName} 조문`),
    summary: String(article.조문내용 ?? ''),
    article: article.조문번호 ? String(article.조문번호) : undefined,
    source: 'law.go.kr',
    raw: article
  }));
}
