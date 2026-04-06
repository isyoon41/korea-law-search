import { createHash } from 'node:crypto';

export function hashKey(input: Record<string, unknown>): string {
  const normalized = JSON.stringify(input, Object.keys(input).sort());
  return createHash('sha256').update(normalized).digest('hex').slice(0, 16);
}
