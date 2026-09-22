import type { Confusion, SweepRow } from '../data'

export interface ConfusionMetrics {
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
export function fromConfusion({ tn, fp, fn, tp }: Confusion): ConfusionMetrics {
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
