/**
 * Risk management helper functions.
 */

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

/**
 * Returns true if a new trade can be entered at the given entry date.
 * This enforces a minimum hold period of 30 days between trades.
 */
export function canEnterTrade(entryDate: Date): boolean {
  return Date.now() - entryDate.getTime() >= THIRTY_DAYS;
}

/**
 * Calculate position size based on signal score and available capital.
 * Higher scores allocate more capital up to 10% of account.
 */
export function sizePosition(score: number, availableCapital: number): number {
  const weight = Math.min(Math.max(score, -1), 1); // clamp
  const base = availableCapital * 0.1; // max 10% per trade
  return base * Math.abs(weight);
}
