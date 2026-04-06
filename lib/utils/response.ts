import { NextResponse } from 'next/server';
import type { ApiResponse, SearchItem } from '@/lib/schemas/types';

export function buildResponse(params: {
  query: string;
  normalizedQuery?: Record<string, unknown>;
  laws?: SearchItem[];
  articles?: SearchItem[];
  precedents?: SearchItem[];
  rules?: SearchItem[];
  ordinances?: SearchItem[];
  durationMs: number;
  cacheHit?: boolean;
  sources?: string[];
}) {
  const payload: ApiResponse = {
    success: true,
    query: params.query,
    normalizedQuery: params.normalizedQuery ?? {},
    results: {
      laws: params.laws ?? [],
      articles: params.articles ?? [],
      precedents: params.precedents ?? [],
      rules: params.rules ?? [],
      ordinances: params.ordinances ?? []
    },
    meta: {
      durationMs: params.durationMs,
      cacheHit: params.cacheHit ?? false,
      sources: params.sources ?? []
    }
  };

  return NextResponse.json(payload);
}
