import type { Confusion, SweepRow } from '../data'

export interface DerivedMetrics {
  total: number
  positives: number
  accuracy: number
  precision: number
  recall: number
  f1: number
  /** Share of actual negatives that were flagged. */
  falsePositiveRate: number
}

/** Recompute headline metrics from confusion-matrix counts. */
export function fromConfusion({ tn, fp, fn, tp }: Confusion): DerivedMetrics {
  const total = tn + fp + fn + tp
  const precision = tp + fp === 0 ? 0 : tp / (tp + fp)
  const recall = tp + fn === 0 ? 0 : tp / (tp + fn)
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall)
  return {
    total,
    positives: tp + fn,
    accuracy: (tp + tn) / total,
    precision,
    recall,
    f1,
    falsePositiveRate: fp + tn === 0 ? 0 : fp / (fp + tn),
  }
}

export interface Outcomes {
  caught: number
  falseAlarms: number
  missed: number
  cleared: number
  flagged: number
}

/**
 * Reconstruct outcome counts at one sweep threshold. Recall gives TP exactly
 * (TP = recall x positives); precision then gives the number flagged.
 */
export function outcomesAt(row: SweepRow, positives: number, total: number): Outcomes {
  const caught = Math.round(row.recall * positives)
  const flagged = row.precision === 0 ? 0 : Math.round(caught / row.precision)
  const falseAlarms = flagged - caught
  const missed = positives - caught
  const cleared = total - positives - falseAlarms
  return { caught, falseAlarms, missed, cleared, flagged }
}

/** Scale outcome counts to a fixed volume (e.g. per 1,000 orders), keeping the parts summing to it. */
export function perVolume(o: Outcomes, total: number, volume = 1000): Outcomes {
  const parts = [o.caught, o.falseAlarms, o.missed, o.cleared].map((v) => (v / total) * volume)
  const floored = parts.map(Math.floor)
  let remainder = volume - floored.reduce((a, b) => a + b, 0)
  // Largest-remainder rounding so the four parts always add up to `volume`.
  const order = parts
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac)
  for (const { i } of order) {
    if (remainder <= 0) break
    floored[i] = (floored[i] ?? 0) + 1
    remainder -= 1
  }
  const [caught = 0, falseAlarms = 0, missed = 0, cleared = 0] = floored
  return { caught, falseAlarms, missed, cleared, flagged: caught + falseAlarms }
}

/** The sweep row whose threshold is closest to `t`. */
export function nearestRow(sweep: readonly SweepRow[], t: number): SweepRow {
  let best = sweep[0]
  if (!best) throw new Error('Empty sweep')
  for (const row of sweep) {
    if (Math.abs(row.threshold - t) < Math.abs(best.threshold - t)) best = row
  }
  return best
}

/** Row with the highest F1 (ties resolved to the lower threshold, as pandas idxmax does). */
export function bestF1(sweep: readonly SweepRow[]): SweepRow {
  return sweep.reduce((best, row) => (row.f1 > best.f1 ? row : best))
}
