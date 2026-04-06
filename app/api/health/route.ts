import { NextResponse } from 'next/server';
import { getLawApiEnvStatus } from '@/lib/connectors/law-api';

export const runtime = 'nodejs';

export async function GET() {
  const env = getLawApiEnvStatus();
  return NextResponse.json({
    status: 'ok',
    env: {
      mock: env.mock,
      lawApiConfigured: env.lawApiConfigured
    }
  });
}
