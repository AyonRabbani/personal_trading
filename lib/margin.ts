// margin overlay & diagnostics
import { TimePoint } from "./types";

// For this simplified demo the margin usage is constant given a target
// leverage. The function maps an equity curve to an array of margin ratios
// (equity / net market value).
export function applyMarginModel(
  equity: TimePoint[],
  leverage: number
): TimePoint[] {
  const ratio = 1 / leverage;
  return equity.map((p) => ({ date: p.date, value: ratio }));
}
