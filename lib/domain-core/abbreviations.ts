import abbreviationMap from '@/data/abbreviations.json';

export interface AbbreviationResolution {
  input: string;
  resolved: string;
  matchedBy: 'exact' | 'fuzzy' | 'none';
  confidence: number;
}

function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) dp[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) dp[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[a.length][b.length];
}

export function resolveAbbreviation(input: string): AbbreviationResolution {
  const trimmed = input.trim();
  if (!trimmed) {
    return { input, resolved: input, matchedBy: 'none', confidence: 0 };
  }

  const exact = (abbreviationMap as Record<string, string>)[trimmed];
  if (exact) {
    return { input, resolved: exact, matchedBy: 'exact', confidence: 1 };
  }

  let bestKey = '';
  let bestDistance = Number.MAX_SAFE_INTEGER;
  const keys = Object.keys(abbreviationMap);

  keys.forEach((key) => {
    const distance = levenshtein(trimmed, key);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestKey = key;
    }
  });

  const normalizedDistance = bestDistance / Math.max(trimmed.length, bestKey.length, 1);
  const confidence = Math.max(0, 1 - normalizedDistance);
  if (confidence >= 0.6 && bestKey) {
    return {
      input,
      resolved: (abbreviationMap as Record<string, string>)[bestKey],
      matchedBy: 'fuzzy',
      confidence: Number(confidence.toFixed(2))
    };
  }

  return { input, resolved: input, matchedBy: 'none', confidence: 0 };
}
