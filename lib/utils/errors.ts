import { NextResponse } from 'next/server';
import type { ErrorResponse } from '@/lib/schemas/types';

export function errorResponse(code: string, message: string, status = 400) {
  const payload: ErrorResponse = {
    success: false,
    error: { code, message }
  };
  return NextResponse.json(payload, { status });
}
