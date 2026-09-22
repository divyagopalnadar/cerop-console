import { describe, expect, it } from 'vitest'
import { cases, dualRiskCounterparties, statusFor } from '../data/cases'
import { chosenOps, crossLayer, financial, operations, sourceById, sources } from '../data'
import { USAGE } from '../data/usage'
import { bestF1, fromConfusion, outcomesAt, perVolume } from '../lib/metrics'

const ops = operations
const sum = ({ tn, fp, fn, tp }: { tn: number; fp: number; fn: number; tp: number }) => tn + fp + fn + tp

/** Printed values are rounded to 4 dp (notebook) or 3 dp (deck); allow half a unit in the last place. */
const expectClose = (actual: number, printed: number, dp = 4) =>
  expect(Math.abs(actual - printed)).toBeLessThanOrEqual(0.5 * 10 ** -dp + 1e-12)

describe('operations: dataset', () => {
  it('class counts add up to the split sizes and the printed late rate', () => {
    const c = ops.dataset.class_counts
    expect(c.train_on_time + c.train_late).toBe(ops.dataset.train_rows)
    expect(c.test_on_time + c.test_late).toBe(ops.dataset.test_rows)
    expectClose(c.train_late / ops.dataset.train_rows, ops.dataset.late_rate)
    expectClose(c.test_late / ops.dataset.test_rows, ops.dataset.late_rate)
  })

  it('dev and validation splits partition the training set', () => {
    expect(ops.dataset.dev_rows + ops.dataset.validation_rows).toBe(ops.dataset.train_rows)
    expect(ops.dataset.raw_rows.original - ops.dataset.raw_rows.removed).toBe(ops.dataset.raw_rows.after_artifact_removal)
    expect(ops.dataset.train_rows + ops.dataset.test_rows).toBe(ops.dataset.raw_rows.after_artifact_removal)
  })
})

describe('operations: confusion matrices', () => {
  const all = [...ops.final_test, ...ops.week5_models]

  it.each(all.map((r) => [r.model, r] as const))('%s sums to the test-set size', (_, r) => {
    expect(sum(r.confusion)).toBe(ops.dataset.test_rows)
    expect(r.confusion.tp + r.confusion.fn).toBe(ops.dataset.class_counts.test_late)
  })

  it.each(all.map((r) => [r.model, r] as const))('%s: metrics recomputed from the matrix match the report', (_, r) => {
    const m = fromConfusion(r.confusion)
    expectClose(m.precision, r.precision)
    expectClose(m.recall, r.recall)
    expectClose(m.f1, r.f1)
    expectClose(m.accuracy, r.accuracy)
  })

  it('the chosen configuration is the tuned model at the calibrated threshold', () => {
    expect(chosenOps.threshold).toBe(ops.threshold.selected)
    expect(chosenOps.model).toMatch(/Calibrated/)
  })
})

describe('operations: threshold sweep', () => {
  const sweep = ops.threshold.sweep

  it('covers 0.10 to 0.90 in sorted 0.01 steps', () => {
    expect(sweep).toHaveLength(81)
    expect(sweep[0]?.threshold).toBe(0.1)
    expect(sweep.at(-1)?.threshold).toBe(0.9)
    for (let i = 1; i < sweep.length; i++) {
      const step = (sweep[i]?.threshold ?? 0) - (sweep[i - 1]?.threshold ?? 0)
      expect(step).toBeCloseTo(0.01, 10)
    }
  })

  it('every row is a valid probability triple with F1 consistent with P and R', () => {
    for (const r of sweep) {
      for (const v of [r.precision, r.recall, r.f1]) expect(v).toBeGreaterThanOrEqual(0)
      expect(r.recall).toBeLessThanOrEqual(1)
      expect(r.f1).toBeCloseTo((2 * r.precision * r.recall) / (r.precision + r.recall), 10)
    }
  })

  it('recall never increases as the threshold rises', () => {
    for (let i = 1; i < sweep.length; i++) {
      expect(sweep[i]?.recall ?? 0).toBeLessThanOrEqual(sweep[i - 1]?.recall ?? 0)
    }
  })

  it('the selected threshold is the validation F1 maximum and matches the printed top five', () => {
    expect(bestF1(sweep).threshold).toBe(ops.threshold.selected)
    for (const printed of ops.threshold.top5) {
      const row = sweep.find((r) => r.threshold === printed.threshold)
      expect(row).toBeDefined()
      if (!row) continue
      expectClose(row.precision, printed.precision)
      expectClose(row.recall, printed.recall)
      expectClose(row.f1, printed.f1)
    }
  })

  it('implied outcome counts are whole numbers at every threshold', () => {
    const n = ops.threshold.validation_positives
    expectClose(n / ops.dataset.validation_rows, ops.dataset.late_rate)
    for (const r of sweep) {
      const tp = r.recall * n
      expect(Math.abs(tp - Math.round(tp))).toBeLessThan(1e-6)
      const flagged = Math.round(tp) / r.precision
      expect(Math.abs(flagged - Math.round(flagged))).toBeLessThan(1e-6)
    }
  })

  it('per-1,000 outcomes always add up to 1,000', () => {
    for (const r of sweep) {
      const o = perVolume(outcomesAt(r, ops.threshold.validation_positives, ops.dataset.validation_rows), ops.dataset.validation_rows)
      expect(o.caught + o.falseAlarms + o.missed + o.cleared).toBe(1000)
      expect(o.flagged).toBe(o.caught + o.falseAlarms)
    }
  })
})

describe('financial layer', () => {
  const { derived_confusion: cm, result, split, dataset } = financial

  it('splits sum to the dataset and the test positives match the class share', () => {
    expect(split.train_rows + split.test_rows).toBe(dataset.rows)
    expectClose(result.test_positives / split.test_rows, dataset.positive_share, 3)
    expect(dataset.columns - 1).toBe(dataset.features)
  })

  it('the reconstructed matrix sums to the test split and reproduces every reported figure', () => {
    expect(sum(cm)).toBe(split.test_rows)
    expect(cm.tp).toBe(result.caught)
    expect(cm.tp + cm.fn).toBe(result.test_positives)
    const m = fromConfusion(cm)
    expectClose(m.recall, result.test_recall, 3)
    expectClose(m.f1, result.test_f1, 3)
  })

  it('the false-positive count is the unique solution', () => {
    const solutions = []
    for (let fp = 0; fp <= split.test_rows - result.test_positives; fp++) {
      const m = fromConfusion({ tn: 0, fp, fn: result.test_positives - result.caught, tp: result.caught })
      if (Math.round(m.f1 * 1000) / 1000 === result.test_f1) solutions.push(fp)
    }
    expect(solutions).toEqual([cm.fp])
  })

  it('feature count after cleaning follows from the documented steps', () => {
    // 95 - 8 severe - 1 duplicate - 3 ROA + 1 composite + 1 leverage feature = 85
    expect(dataset.features - financial.cleaning.severe_dropped - financial.cleaning.duplicate_dropped - 3 + 2).toBe(split.features)
  })
})

describe('provenance', () => {
  const ids = new Set(sources.map((s) => s.id))

  it('every source id referenced by the data resolves', () => {
    const referenced: string[] = []
    const walk = (v: unknown, key = '') => {
      if (typeof v === 'string' && /source$/.test(key)) referenced.push(v)
      else if (Array.isArray(v)) v.forEach((x) => walk(x))
      else if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => walk(x, k))
    }
    walk({ operations, financial, crossLayer })
    expect(referenced.length).toBeGreaterThan(20)
    for (const id of referenced) expect(sourceById.has(id)).toBe(true)
  })

  it('every source is documented in the usage map, and nothing else is', () => {
    expect(new Set(Object.keys(USAGE))).toEqual(ids)
  })

  it('source ids are unique', () => {
    expect(ids.size).toBe(sources.length)
  })
})

describe('illustrative case queue', () => {
  it('uses the real calibrated operations cutoff', () => {
    expect(statusFor({ layer: 'OPS', score: ops.threshold.selected })).toBe('review')
    expect(statusFor({ layer: 'OPS', score: ops.threshold.selected - 0.01 })).toBe('watch')
  })

  it('has unique ids and scores in [0, 1]', () => {
    expect(new Set(cases.map((c) => c.id)).size).toBe(cases.length)
    for (const c of cases) {
      expect(c.score).toBeGreaterThanOrEqual(0)
      expect(c.score).toBeLessThanOrEqual(1)
    }
  })

  it('flags a counterparty as dual risk only when both layers need review', () => {
    const dual = dualRiskCounterparties()
    expect(dual.size).toBeGreaterThan(0)
    for (const name of dual) {
      const own = cases.filter((c) => c.counterparty === name && statusFor(c) === 'review')
      expect(new Set(own.map((c) => c.layer))).toEqual(new Set(['FIN', 'OPS']))
    }
  })
})
