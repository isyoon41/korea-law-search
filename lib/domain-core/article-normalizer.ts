export interface NormalizedArticle {
  display: string;
  numeric: string;
  raw: string;
  sub?: number;
}

const ARTICLE_REGEX = /(?:제)?\s*(\d+)\s*조(?:\s*의\s*(\d+))?(?:\s*(?:항|호|목).*)?$/;

export function normalizeArticle(rawInput: string): NormalizedArticle {
  const raw = rawInput.trim();

  const pureNumeric = raw.match(/^(\d{4})(\d{2})$/);
  if (pureNumeric) {
    const main = String(Number(pureNumeric[1]));
    const sub = Number(pureNumeric[2]);
    const hasSub = sub > 0;
    return {
      display: hasSub ? `제${main}조의${sub}` : `제${main}조`,
      numeric: `${pureNumeric[1]}${pureNumeric[2]}`,
      raw,
      ...(hasSub ? { sub } : {})
    };
  }

  const numericOnly = raw.match(/^(\d+)$/);
  if (numericOnly) {
    const main = Number(numericOnly[1]);
    return { display: `제${main}조`, numeric: `${String(main).padStart(4, '0')}00`, raw };
  }

  const match = raw.match(ARTICLE_REGEX);
  if (!match) {
    const main = Number(raw.replace(/\D/g, '')) || 0;
    const numeric = `${String(main).padStart(4, '0')}00`;
    return { display: `제${main}조`, numeric, raw };
  }

  const main = Number(match[1]);
  const sub = match[2] ? Number(match[2]) : undefined;
  const numeric = `${String(main).padStart(4, '0')}${String(sub ?? 0).padStart(2, '0')}`;

  return {
    display: sub ? `제${main}조의${sub}` : `제${main}조`,
    numeric,
    raw,
    ...(sub ? { sub } : {})
  };
}
