export type CanonicalArticle = {
  raw: string;
  display: string;
  numeric: string;
  articleNo: number;
  subArticleNo?: number;
};

const ARTICLE_REGEX = /^제?\s*(\d+)\s*조(?:\s*의\s*(\d+))?\s*$/u;

export function normalizeArticle(input?: string | number | null): CanonicalArticle | null {
  if (input === undefined || input === null) return null;

  const raw = String(input).trim();
  if (!raw) return null;

  if (/^\d{6}$/.test(raw)) {
    const articleNo = Number(raw.slice(0, 4));
    const subArticleNo = Number(raw.slice(4, 6)) || undefined;
    return {
      raw,
      display: subArticleNo ? `제${articleNo}조의${subArticleNo}` : `제${articleNo}조`,
      numeric: raw,
      articleNo,
      subArticleNo
    };
  }

  if (/^\d+$/.test(raw)) {
    const articleNo = Number(raw);
    return {
      raw,
      display: `제${articleNo}조`,
      numeric: `${String(articleNo).padStart(4, '0')}00`,
      articleNo
    };
  }

  const normalized = raw.replace(/\s+/g, '');
  const match = normalized.match(ARTICLE_REGEX);
  if (!match) return null;

  const articleNo = Number(match[1]);
  const subArticleNo = match[2] ? Number(match[2]) : undefined;

  return {
    raw,
    display: subArticleNo ? `제${articleNo}조의${subArticleNo}` : `제${articleNo}조`,
    numeric: `${String(articleNo).padStart(4, '0')}${String(subArticleNo ?? 0).padStart(2, '0')}`,
    articleNo,
    subArticleNo
  };
}
