import { describe, expect, it } from 'vitest'
import { chosenOps, crossLayer, deployedFin, financial, operations, report, sourceById, sources } from '../data'
import { USAGE } from '../data/usage'
import { bestF1, fromConfusion } from '../lib/metrics'

const ops = operations
const r = report
const sum = ({ tn, fp, fn, tp }: { tn: number; fp: number; fn: number; tp: number }) => tn + fp + fn + tp

/** Printed values are rounded to `dp` places; allow half a unit in the last place. */
const expectClose = (actual: number, printed: number, dp = 4) =>
  expect(Math.abs(actual - printed)).toBeLessThanOrEqual(0.5 * 10 ** -dp + 1e-9)

describe('operations: dataset', () => {
  it('class counts add up to the split sizes and the printed late rate', () => {
    const c = ops.dataset.class_counts
    expect(c.train_on_time + c.train_late).toBe(ops.dataset.train_rows)
    expect(c.test_on_time + c.test_late).toBe(ops.dataset.test_rows)
    expectClose(c.train_late / ops.dataset.train_rows, ops.dataset.late_rate)
    expectClose(c.test_late / ops.dataset.test_rows, ops.dataset.late_rate)
  })

  it('dev and validation partition the training set; train and test partition the cleaned rows', () => {
    expect(ops.dataset.dev_rows + ops.dataset.validation_rows).toBe(ops.dataset.train_rows)
    expect(ops.dataset.raw_rows.original - ops.dataset.raw_rows.removed).toBe(ops.dataset.raw_rows.after_artifact_removal)
    expect(ops.dataset.train_rows + ops.dataset.test_rows).toBe(ops.dataset.raw_rows.after_artifact_removal)
  })

  it('agrees with the report on raw size, cleaned size, late rate and feature counts', () => {
    expect(ops.dataset.raw_rows.original).toBe(r.operations_eda.rows)
    expect(ops.dataset.raw_rows.after_artifact_removal).toBe(r.operations_eda.after_artifact)
    expectClose(ops.dataset.late_rate, r.operations_eda.late_pct / 100, 3)
    expect(ops.dataset.features).toBe(r.operations_eda.order_status.features_after)
    expect(ops.dataset.features_before_leak_fix - r.operations_eda.order_status.columns_removed).toBe(ops.dataset.features)
  })
})

describe('operations: confusion matrices', () => {
  const all = [...ops.final_test, ...ops.week5_models]

  it.each(all.map((m) => [m.model, m] as const))('%s sums to the test-set size', (_, m) => {
    expect(sum(m.confusion)).toBe(ops.dataset.test_rows)
    expect(m.confusion.tp + m.confusion.fn).toBe(ops.dataset.class_counts.test_late)
  })

  it.each(all.map((m) => [m.model, m] as const))('%s: precision, recall, F1, accuracy recomputed from counts match', (_, m) => {
    const d = fromConfusion(m.confusion)
    expectClose(d.precision, m.precision)
    expectClose(d.recall, m.recall)
    expectClose(d.f1, m.f1)
    expectClose(d.accuracy, m.accuracy)
  })

  it('the report and the notebooks agree on the Week 5 comparison (3 dp)', () => {
    const rf = ops.week5_models.find((m) => m.model === 'Random Forest')
    expectClose(rf?.f1 ?? 0, 0.739, 3)
    expectClose(rf?.cv.f1_mean ?? 0, r.operations_w5.rf_cv_f1, 3)
    expectClose(rf?.cv.f1_sd ?? 0, r.operations_w5.rf_cv_sd, 3)
  })

  it('the calibrated model is the deployed operations configuration', () => {
    expect(chosenOps.threshold).toBe(ops.threshold.selected)
    expect(chosenOps.model).toMatch(/Calibrated/)
  })

  it('"about 4,100 more flagged" matches the drop in false negatives', () => {
    const tunedDefault = ops.final_test[1]
    const drop = (tunedDefault?.confusion.fn ?? 0) - chosenOps.confusion.fn
    expect(Math.round(drop / 100) * 100).toBe(4100)
  })
})

describe('operations: threshold sweep', () => {
  const sweep = ops.threshold.sweep

  it('covers 0.10 to 0.90 in sorted 0.01 steps', () => {
    expect(sweep).toHaveLength(81)
    expect(sweep[0]?.threshold).toBe(0.1)
    expect(sweep.at(-1)?.threshold).toBe(0.9)
    for (let i = 1; i < sweep.length; i++) {
      expect((sweep[i]?.threshold ?? 0) - (sweep[i - 1]?.threshold ?? 0)).toBeCloseTo(0.01, 10)
    }
  })

  it('F1 is consistent with precision and recall on every row; recall never rises with the threshold', () => {
    for (const row of sweep) {
      expect(row.f1).toBeCloseTo((2 * row.precision * row.recall) / (row.precision + row.recall), 10)
    }
    for (let i = 1; i < sweep.length; i++) {
      expect(sweep[i]?.recall ?? 0).toBeLessThanOrEqual(sweep[i - 1]?.recall ?? 0)
    }
  })

  it('the selected threshold is the F1 maximum and matches the printed top five and the report', () => {
    const best = bestF1(sweep)
    expect(best.threshold).toBe(ops.threshold.selected)
    expectClose(best.f1, r.operations_w6.validation_f1, 3)
    expectClose(best.precision, r.operations_w6.validation_precision, 3)
    expectClose(best.recall, r.operations_w6.validation_recall, 3)
    for (const printed of ops.threshold.top5) {
      const row = sweep.find((x) => x.threshold === printed.threshold)
      expectClose(row?.f1 ?? 0, printed.f1)
      expectClose(row?.recall ?? 0, printed.recall)
    }
  })
})

describe('financial: Week 4 and EDA', () => {
  const eda = r.financial_eda

  it('class counts add up and match the notebook shape', () => {
    expect(eda.bankrupt + eda.healthy).toBe(eda.rows)
    expect(eda.rows).toBe(financial.dataset.rows)
    expect(financial.dataset.features).toBe(eda.features)
    expectClose((eda.bankrupt / eda.rows) * 100, eda.bankrupt_pct, 2)
    expectClose(eda.healthy / eda.bankrupt, eda.class_ratio, 1)
  })

  it('sentinel tiers add up, and the notebook tiers agree with the report', () => {
    const s = eda.sentinel
    expect(s.minor + 1 + s.severe.length).toBe(s.total)
    expect(financial.cleaning.minor_capped).toBe(s.minor)
    expect(financial.cleaning.severe_dropped).toBe(s.severe.length)
    for (const f of s.severe) {
      expect(f.pct).toBeGreaterThanOrEqual(18)
      expect(f.pct).toBeLessThanOrEqual(88.2)
    }
  })

  it('split sizes add up and the final feature count agrees', () => {
    expect(financial.split.train_rows + financial.split.test_rows).toBe(eda.rows)
    expect(financial.split.features).toBe(eda.final_features)
  })
})

describe('financial: Week 5 and Week 6 tables', () => {
  const w5 = r.financial_w5
  const w6 = r.financial_w6

  it('Week 5 recall and F1 are consistent with the stated counts', () => {
    const lr = w5.models.find((m) => m.model === 'Logistic Regression')
    expectClose(w5.equal_recall.caught / w5.positives, lr?.recall ?? 0, 3)
    for (const m of w5.models) expectClose((2 * m.precision * m.recall) / (m.precision + m.recall), m.f1, 2)
    expect(Math.round((1 - w5.equal_recall.xgb_false_alarms / w5.equal_recall.lr_false_alarms) * 100)).toBe(w5.equal_recall.fewer_pct)
  })

  it('the Week 6 partition adds up to the Week 4 split and the 220 bankrupt firms', () => {
    const [fit, val, test] = w6.partition
    expect((fit?.rows ?? 0) + (val?.rows ?? 0)).toBe(financial.split.train_rows)
    expect(test?.rows).toBe(financial.split.test_rows)
    expect((fit?.bankrupt ?? 0) + (val?.bankrupt ?? 0) + (test?.bankrupt ?? 0)).toBe(r.financial_eda.bankrupt)
    expect(w6.search.draws * w6.search.folds).toBe(w6.search.fits)
  })

  it('every Week 6 row: caught / 44 equals recall, and F1 follows from precision and recall', () => {
    expect(w6.test).toHaveLength(11)
    for (const t of w6.test) {
      expectClose(t.caught / w5.positives, t.recall, 3)
      expectClose((2 * t.precision * t.recall) / (t.precision + t.recall), t.f1, 2)
    }
  })

  it.each(w6.matrices.map((m) => [m.label, m] as const))('%s sums to 1,364 firms with 44 bankrupt', (_, m) => {
    expect(sum(m)).toBe(financial.split.test_rows)
    expect(m.tp + m.fn).toBe(w5.positives)
  })

  it('matrices reproduce the Table 3 rows they belong to', () => {
    const rows = ['XGB · Week 5 config (refit)', 'XGB · tuned', 'XGB · tuned @ calibrated']
    w6.matrices.forEach((m, i) => {
      const row = w6.test.find((t) => t.row === rows[i])
      const d = fromConfusion(m)
      expect(row).toBeDefined()
      expect(m.tp).toBe(row?.caught)
      expect(m.threshold).toBe(row?.threshold)
      expectClose(d.precision, row?.precision ?? 0, 3)
      expectClose(d.recall, row?.recall ?? 0, 3)
      expectClose(d.f1, row?.f1 ?? 0, 3)
    })
  })

  it('the deployed row is the Week 5 configuration', () => {
    expect(deployedFin.row).toMatch(/Week 5 config/)
    expect(w6.why.class_ratio).toBe(r.financial_eda.class_ratio)
    expect(w6.bootstrap.ci[0]).toBeLessThan(0)
    expect(w6.bootstrap.ci[1]).toBeGreaterThan(0)
  })
})

describe('EDA figures', () => {
  it('the delay distribution sums to 100% and shipping modes are valid rates', () => {
    const total = r.operations_eda.delay.reduce((a, d) => a + d.pct, 0)
    expect(total).toBeCloseTo(100, 5)
    for (const m of r.operations_eda.shipping_mode) {
      expect(m.late_pct).toBeGreaterThan(0)
      expect(m.late_pct).toBeLessThan(100)
    }
  })

  it('GSCPI record count matches the pipeline notebook', () => {
    expect(r.gscpi.records).toBe(342)
    expect(r.gscpi.supported).toBe(false)
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
    walk({ operations, financial, crossLayer, report })
    expect(referenced.length).toBeGreaterThan(40)
    for (const id of referenced) expect(sourceById.has(id)).toBe(true)
  })

  it('every source is documented in the usage map, and nothing else is', () => {
    expect(new Set(Object.keys(USAGE))).toEqual(ids)
  })

  it('source ids are unique and every source is a notebook, the saved sweep CSV or the report', () => {
    expect(ids.size).toBe(sources.length)
    for (const s of sources) expect(s.file).toMatch(/\.ipynb$|\.csv$|Group 4 - CEROP\.pdf$/)
  })

  it('the team list carries names and roles only', () => {
    expect(r.project.team.map((m) => m.name)).toEqual([
      'Ankit Kumar',
      'Arthunya Kanoklertwongse',
      'Aswin Shriram Thiagarajan',
      'Divya Gopal',
    ])
    const text = JSON.stringify(r.project)
    expect(text).not.toMatch(/@|\(\d{3}\)|\d{3}-\d{4}/)
  })
})
