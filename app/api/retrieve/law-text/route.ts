import { NextRequest, NextResponse } from 'next/server';
import { retrieveLawText } from '@/lib/connectors/law-api';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const started = Date.now();
  try {
    const { searchParams } = new URL(req.url);

    const lawId = searchParams.get('lawId') || undefined;
    const mst = searchParams.get('mst') || undefined;
    const jo = searchParams.get('jo') || undefined;

    if (!lawId && !mst) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'lawId or mst is required'
          }
        },
        { status: 400 }
      );
    }

    const data = await retrieveLawText({ lawId, mst, jo });

    return NextResponse.json({
      success: true,
      query: jo ? `${data.title} ${jo}` : data.title,
      normalizedQuery: {
        lawId,
        mst,
        jo
      },
      results: {
        laws: [],
        articles: data
          ? [
              {
                lawTitle: data.title,
                lawId: data.lawId,
                mst: data.mst,
                articleDisplay: data.article?.display,
                articleNumeric: data.article?.numeric,
                articleTitle: data.article?.title,
                articleContent: data.article?.content || data.bodyText
              }
            ]
          : [],
        precedents: [],
        rules: [],
        ordinances: []
      },
      meta: {
        durationMs: Date.now() - started,
        cacheHit: false,
        sources: ['lawService.do']
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
