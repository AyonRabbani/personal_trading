/**
 * Stub news provider for sentiment and macro scores.
 * Replace this implementation with real news APIs.
 */
export interface NewsScore {
  symbol: string;
  sentiment: number; // -1 to 1
  macro: number;     // 0 to 1
}

export async function fetchNewsScores(symbols: string[]): Promise<Record<string, NewsScore>> {
  // In production connect to a real service.
  const scores: Record<string, NewsScore> = {};
  for (const s of symbols) {
    scores[s] = { symbol: s, sentiment: 1, macro: 1 };
  }
  return scores;
}
