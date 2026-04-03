import { parseXml } from '@/lib/xml/parse';
import type { DomainType, SearchItem } from '@/lib/schemas/types';
import { ensureArray, safeGet } from '@/lib/xml/utils';

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

function buildLawSearchParams(query: string): Record<string, string> {
  return { query, type: 'XML' };
}

function buildLawDetailParams(input: { id?: string; mst?: string; lawName?: string }): Record<string, string> {
  const { id, mst, lawName } = input;
  if (id) return { target: 'law', ID: id, type: 'XML' };
  if (mst) return { target: 'law', MST: mst, type: 'XML' };
  if (lawName) return { target: 'law', query: lawName, type: 'XML' };
  throw new Error('Either id or mst is required for law detail retrieval');
}

function buildArticleParams(input: { id?: string; mst?: string }): Record<string, string> {
  if (input.id) return { target: 'lawjosub', ID: input.id, type: 'XML' };
  if (input.mst) return { target: 'lawjosub', MST: input.mst, type: 'XML' };
  throw new Error('Either id or mst is required for article retrieval');
}

function normalizeItem(domain: DomainType, raw: Record<string, unknown>): SearchItem {
  return {
    id: String(raw.법령ID ?? raw.판례일련번호 ?? raw.ID ?? `${domain}-${Math.random()}`),
    domain,
    title: String(raw.법령명한글 ?? raw.사건명 ?? raw.자치법규명 ?? raw.행정규칙명 ?? '제목없음'),
    lawId: raw.법령ID ? String(raw.법령ID) : raw.ID ? String(raw.ID) : undefined,
    mst: raw.MST ? String(raw.MST) : undefined,
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

  const parsed = (await callLawApi(targetMap[domain], buildLawSearchParams(query))) as Record<string, unknown>;
  const list = (() => {
    switch (domain) {
      case 'law':
        return ensureArray(safeGet<Record<string, unknown> | Array<Record<string, unknown>>>(parsed, 'LawSearch.law'));
      case 'precedent':
        return ensureArray(safeGet<Record<string, unknown> | Array<Record<string, unknown>>>(parsed, 'PrecSearch.prec'));
      case 'rule':
        return ensureArray(
          safeGet<Record<string, unknown> | Array<Record<string, unknown>>>(parsed, 'AdmRuleSearch.admrule')
        );
      case 'ordinance':
        return ensureArray(
          safeGet<Record<string, unknown> | Array<Record<string, unknown>>>(parsed, 'OrdinSearch.ordin')
        );
      case 'specialized':
        return [
          ...ensureArray(
            safeGet<Record<string, unknown> | Array<Record<string, unknown>>>(parsed, 'ExpcSearch.expc')
          ),
          ...ensureArray(
            safeGet<Record<string, unknown> | Array<Record<string, unknown>>>(parsed, 'TaxSearch.tax')
          )
        ];
      default:
        return [];
    }
  })();

  return list.map((item) => normalizeItem(domain, item));
}

export async function retrieveLawText(input: { id?: string; mst?: string; lawName?: string }): Promise<SearchItem[]> {
  const parsed = (await callLawApi('lawService.do', buildLawDetailParams(input))) as Record<string, unknown>;
  const lawName = String(
    safeGet<string>(parsed, 'Law.기본정보.법령명_한글') ?? input.lawName ?? input.id ?? input.mst ?? '법령'
  );
  const lawId = String(safeGet<string>(parsed, 'Law.기본정보.법령ID') ?? input.id ?? '');
  const mst = String(safeGet<string>(parsed, 'Law.기본정보.MST') ?? input.mst ?? '');
  const articles = ensureArray(safeGet<Record<string, unknown> | Array<Record<string, unknown>>>(parsed, 'Law.조문.조문단위'));

  return articles.filter(Boolean).map((article: Record<string, unknown>, idx: number) => ({
    id: `${lawId || lawName}-${idx}`,
    domain: 'law',
    title: String(article.조문제목 ?? `${lawName} 조문`),
    summary: String(article.조문내용 ?? ''),
    lawId: lawId || undefined,
    mst: mst || undefined,
    article: article.조문번호 ? String(article.조문번호) : undefined,
    source: 'law.go.kr',
    raw: article
  }));
}

export async function retrieveLawArticles(input: { id?: string; mst?: string }): Promise<SearchItem[]> {
  const parsed = (await callLawApi('lawService.do', buildArticleParams(input))) as Record<string, unknown>;
  const articles = ensureArray(
    safeGet<Record<string, unknown> | Array<Record<string, unknown>>>(parsed, 'Law.조문.조문단위')
  );

  return articles.filter(Boolean).map((article, idx) => ({
    id: `${input.id ?? input.mst}-article-${idx}`,
    domain: 'law',
    title: String(article.조문제목 ?? '조문'),
    summary: String(article.조문내용 ?? ''),
    lawId: input.id,
    mst: input.mst,
    article: article.조문번호 ? String(article.조문번호) : undefined,
    source: 'law.go.kr',
    raw: article
  }));
}
