export type DomainType = 'law' | 'precedent' | 'rule' | 'ordinance' | 'specialized';

export interface SearchItem {
  id: string;
  domain: DomainType;
  title: string;
  summary?: string;
  article?: string;
  publishDate?: string;
  source: string;
  score?: number;
  raw?: unknown;
}

export interface ApiResponse {
  success: boolean;
  query: string;
  normalizedQuery: Record<string, unknown>;
  results: {
    laws: SearchItem[];
    articles: SearchItem[];
    precedents: SearchItem[];
    rules: SearchItem[];
    ordinances: SearchItem[];
  };
  meta: {
    durationMs: number;
    cacheHit: boolean;
    sources: string[];
  };
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}
