import { useEffect, useRef } from 'react'
import { Card } from '../components/Card'
import { PageHeader } from '../components/PageHeader'
import { SourceTag } from '../components/SourceTag'
import { crossLayer, financial, notInRecord, operations, sources } from '../data'
import { USAGE } from '../data/usage'
import { int, thr } from '../lib/format'
import styles from './LineageView.module.css'

const ops = operations

const PIPELINE = [
  {
    step: 'Split',
    body: `Stratified 80/20 split with a fixed seed, before anything is fitted. The test set is sealed: ${int(ops.dataset.test_rows)} orders and ${int(financial.split.test_rows)} firms.`,
    source: ops.dataset.source,
  },
  {
    step: 'Fit on train only',
    body: 'Outlier caps, IQR bounds, encoders and scalers learn from the training split and are applied unchanged downstream.',
    source: financial.cleaning.source,
  },
  {
    step: 'Tune on development folds',
    body: `A further 80/20 split leaves ${int(ops.dataset.dev_rows)} development rows. RandomizedSearchCV: ${ops.tuning.candidates} candidates × ${ops.tuning.folds} folds, scored on F1.`,
    source: ops.tuning.source,
  },
  {
    step: 'Calibrate on validation',
    body: `Thresholds ${thr(ops.threshold.sweep[0]?.threshold ?? 0.1)}–${thr(ops.threshold.sweep.at(-1)?.threshold ?? 0.9)} swept on ${int(ops.dataset.validation_rows)} validation orders; the best F1 sets the cutoff at ${thr(ops.threshold.selected)}.`,
    source: ops.threshold.source,
  },
  {
    step: 'Open the test set once',
    body: 'Baseline, tuned, and tuned-plus-calibrated models are scored once on the sealed test set. Nothing is changed afterwards.',
    source: ops.final_test[0]?.source ?? '',
  },
]

const DERIVED = [
  {
    what: `Validation positives = ${int(ops.threshold.validation_positives)}`,
    how: ops.threshold.validation_positives_note,
  },
  {
    what: 'Per-1,000 outcome counts in the threshold explorer',
    how: 'Caught = recall × validation positives; flagged = caught ÷ precision; scaled to 1,000 with largest-remainder rounding.',
  },
  {
    what: `Financial confusion matrix (TN ${financial.derived_confusion.tn}, FP ${financial.derived_confusion.fp}, FN ${financial.derived_confusion.fn}, TP ${financial.derived_confusion.tp})`,
    how: 'The only integer solution consistent with 25/44 caught, F1 = 0.568 and 1,364 test firms.',
  },
  {
    what: 'Chance-level PR-AUC and the ≈ 1 : 30 class ratio',
    how: 'A random ranking scores average precision equal to the positive rate (3.23%); 96.77 ÷ 3.23 ≈ 30.',
  },
]

export function LineageView({ highlight }: { highlight: string | null }) {
  const rowRef = useRef<HTMLTableRowElement>(null)
  useEffect(() => {
    if (highlight && rowRef.current) {
      rowRef.current.scrollIntoView?.({ block: 'center' })
      rowRef.current.focus({ preventScroll: true })
    }
  }, [highlight])

  return (
    <div className={styles.stack}>
      <PageHeader
        eyebrow="Methodology & lineage"
        title="How the numbers were made, and where each one lives"
        lead="The same protocol runs on both layers: split first, learn only from training data, tune and calibrate away from the test set, then open the test set once. Every figure in this console traces to the notebook cell, saved result file or slide listed below."
      />

      <Card eyebrow="Protocol" title="One pass, test set last" footer={<SourceTag id={crossLayer.protocol_source} />}>
        <ol className={styles.pipeline} role="list">
          {PIPELINE.map((p, i) => (
            <li key={p.step} data-last={i === PIPELINE.length - 1 || undefined}>
              <span className={styles.stepN} aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <p className={styles.stepT}>{p.step}</p>
              <p className={styles.stepB}>{p.body}</p>
              <SourceTag id={p.source} />
            </li>
          ))}
        </ol>
      </Card>

      <Card
        id="sources"
        eyebrow={`${sources.length} sources`}
        title="Figure lineage"
        description="Select any source chip elsewhere in the console to land on its row here."
      >
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <caption className="visually-hidden">Sources for every figure in the console</caption>
            <thead>
              <tr>
                <th scope="col">Source</th>
                <th scope="col">File · location</th>
                <th scope="col">What was read</th>
                <th scope="col">Shown in</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((s) => {
                const active = s.id === highlight
                return (
                  <tr
                    key={s.id}
                    id={`src-${s.id}`}
                    ref={active ? rowRef : undefined}
                    tabIndex={active ? -1 : undefined}
                    aria-current={active || undefined}
                    data-derived={s.file === 'derived' || undefined}
                  >
                    <th scope="row">
                      <code>{s.id}</code>
                    </th>
                    <td>
                      <span className={styles.file}>{s.file}</span>
                      <span className={styles.loc}>{s.location}</span>
                    </td>
                    <td>{s.note}</td>
                    <td>
                      <ul className={styles.uses} role="list">
                        {(USAGE[s.id] ?? []).map((u) => (
                          <li key={u}>{u}</li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className={styles.twoCol}>
        <Card eyebrow="Computed, not read" title="Derived values">
          <ul className={styles.list} role="list">
            {DERIVED.map((d) => (
              <li key={d.what}>
                <p className={styles.itemT}>{d.what}</p>
                <p className={styles.itemB}>{d.how}</p>
              </li>
            ))}
          </ul>
        </Card>
        <Card eyebrow="Left out on purpose" title="Not in the record">
          <ul className={styles.list} role="list">
            {notInRecord.map((n) => (
              <li key={n.item}>
                <p className={styles.itemT}>{n.item}</p>
                <p className={styles.itemB}>{n.why}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card eyebrow="Credits" title="Team project, AIT 506 Machine Learning" footer={<SourceTag id={financial.team.source} />}>
        <p className={styles.credits}>
          CEROP was built by Group 4 at Westcliff University: {financial.team.members.join(', ')}. The modelling
          work belongs to the team. This console, including its design, data extraction and code, was designed and
          built by Divya Gopal.
        </p>
      </Card>
    </div>
  )
}
