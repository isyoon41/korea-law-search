import { NextRequest, NextResponse } from 'next/server';
import { searchLaws } from '@/lib/connectors/law-api';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const started = Date.now();
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query')?.trim();

    if (!query) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'query is required'
          }
        },
        { status: 400 }
      );
    }

    const laws = await searchLaws(query, 20);

    return NextResponse.json({
      success: true,
      query,
      normalizedQuery: { query },
      results: {
        laws,
        articles: [],
        precedents: [],
        rules: [],
        ordinances: []
      },
      meta: {
        durationMs: Date.now() - started,
        cacheHit: false,
        sources: ['lawSearch.do?target=law']
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    );
  }
}
