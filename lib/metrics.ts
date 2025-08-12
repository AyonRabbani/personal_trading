export interface Leg {
  side: 'short' | 'long';
  bid: number;
  ask: number;
  strike: number;
}

export function mid(bid: number, ask: number): number {
  return (bid + ask) / 2;
}

export function credit(legs: Leg[]): number {
  return legs.reduce(
    (sum, leg) =>
      sum + mid(leg.bid, leg.ask) * (leg.side === 'short' ? 1 : -1),
    0,
  );
}

export function spreadWidth(shortStrike: number, longStrike: number): number {
  return Math.abs(shortStrike - longStrike);
}

export function maxLoss(creditValue: number, width: number): number {
  return width - creditValue;
}

export function ror(creditValue: number, maxLossValue: number): number {
  return creditValue / maxLossValue;
}

export function annualized(rorValue: number, dte: number): number {
  return rorValue * (365 / dte);
}

export function popFromDelta(deltaAbs: number): number {
  return 1 - Math.abs(deltaAbs);
}

export function bidAskQuality(bid: number, ask: number): {
  pct: number;
  ok: boolean;
} {
  const midPrice = mid(bid, ask);
  const spread = ask - bid;
  const pct = spread / midPrice;
  const ok = spread <= Math.max(0.1, midPrice * 0.1);
  return { pct, ok };
}
