import { useId, useState } from 'react'
import { BarList } from '../components/BarList'
import { Callout } from '../components/Callout'
import { Card } from '../components/Card'
import { ConfusionMatrix } from '../components/ConfusionMatrix'
import { PageHeader } from '../components/PageHeader'
import { Segmented } from '../components/Segmented'
import { SourceTag } from '../components/SourceTag'
import { StatGrid, StatTile } from '../components/StatTile'
import { SweepChart } from '../components/SweepChart'
import { chosenOps, operations, report } from '../data'
import { dec, int, pct, thr } from '../lib/format'
import { nearestRow } from '../lib/metrics'
import styles from './OperationsView.module.css'

const ops = operations
const sweep = ops.threshold.sweep
const MIN = sweep[0]?.threshold ?? 0.1
const MAX = sweep[sweep.length - 1]?.threshold ?? 0.9

export function parseThreshold(raw: string | null): number {
  const t = raw === null ? NaN : Number(raw)
  if (!Number.isFinite(t)) return ops.threshold.selected
  return nearestRow(sweep, Math.min(MAX, Math.max(MIN, t))).threshold
}

const CONFIGS = ops.final_test.map((r, i) => ({
  value: String(i),
  label: i === 0 ? 'Baseline · 0.50' : r.threshold === ops.threshold.selected ? `Tuned · ${thr(r.threshold)}` : 'Tuned · 0.50',
}))

interface OperationsViewProps {
  threshold: string | null
  onThreshold: (t: string) => void
}

export function OperationsView({ threshold, onThreshold }: OperationsViewProps) {
  const t = parseThreshold(threshold)
  const row = nearestRow(sweep, t)
  const valTotal = ops.dataset.validation_rows
  const w6 = report.operations_w6
  const [cmIndex, setCmIndex] = useState(String(ops.final_test.length - 1))
  const cmRow = ops.final_test[Number(cmIndex)] ?? chosenOps
  const baseline = ops.final_test[0] ?? chosenOps
  const tunedDefault = ops.final_test[1] ?? chosenOps
  const sliderId = useId()
  const w5rf = ops.week5_models.find((m) => m.model === 'Random Forest')

  const set = (v: number) => onThreshold(thr(v))

  return (
    <div className={styles.stack}>
      <PageHeader
        eyebrow="Operations layer · DataCo late-delivery risk"
        title="Late-delivery risk, and where to draw the line"
        lead={
          <>
            A tuned Random Forest scores each order on {ops.dataset.features} pre-shipment features. The
            decision threshold was calibrated on a validation split, and the test set was opened once, at
            the end. Drag the threshold to see the trade the team made.
          </>
        }
      />

      <StatGrid label="Operations layer test results at the chosen threshold">
        <StatTile
          tone="accent"
          label="Late orders caught"
          value={pct(chosenOps.recall)}
          sub={`${int(chosenOps.confusion.tp)} of ${int(chosenOps.confusion.tp + chosenOps.confusion.fn)} on the test set`}
          source={chosenOps.source}
        />
        <StatTile label="Test F1" value={dec(chosenOps.f1)} sub={`Corrected baseline: ${dec(baseline.f1)}`} source={chosenOps.source} />
        <StatTile label="Precision" value={pct(chosenOps.precision)} sub="Share of flagged orders that were late" source={chosenOps.source} />
        <StatTile
          label="ROC-AUC · PR-AUC"
          value={`${dec(chosenOps.roc_auc)} · ${dec(chosenOps.pr_auc)}`}
          sub="Ranking quality, independent of cutoff"
          source={chosenOps.source}
        />
      </StatGrid>

      <Card
        id="threshold"
        eyebrow={`Validation split · ${int(valTotal)} orders`}
        title="Threshold explorer"
        description={
          <>
            Every point is a real row of the team's validation sweep ({thr(MIN)}–{thr(MAX)}, step 0.01). The team chose
            the threshold with the highest validation F1: <b>{thr(ops.threshold.selected)}</b>.
          </>
        }
        footer={
          <>
            <SourceTag id={ops.threshold.sweep_source} />
            <SourceTag id={ops.threshold.source} />
            <SourceTag id={ops.dataset.validation_source} />
          </>
        }
      >
        <div className={styles.explorer}>
          <div className={styles.controls}>
            <label htmlFor={sliderId} className={styles.sliderLabel}>
              Decision threshold
              <output htmlFor={sliderId} className={styles.sliderValue} data-testid="threshold-value">
                {thr(row.threshold)}
              </output>
            </label>
            <input
              id={sliderId}
              className={styles.slider}
              type="range"
              min={MIN}
              max={MAX}
              step={0.01}
              value={row.threshold}
              onChange={(e) => set(Number(e.target.value))}
              aria-valuetext={`${thr(row.threshold)}: precision ${pct(row.precision)}, recall ${pct(row.recall)}, F1 ${dec(row.f1)}`}
              style={{ ['--fill' as string]: `${((row.threshold - MIN) / (MAX - MIN)) * 100}%` }}
            />
            <div className={styles.presets}>
              <button type="button" onClick={() => set(ops.threshold.selected)} aria-pressed={row.threshold === ops.threshold.selected}>
                Chosen {thr(ops.threshold.selected)}
              </button>
              <button type="button" onClick={() => set(0.5)} aria-pressed={row.threshold === 0.5}>
                Default 0.50
              </button>
            </div>
          </div>

          <div className={styles.explorerGrid}>
            <div className={styles.chart}>
              <SweepChart sweep={sweep} value={row.threshold} chosen={ops.threshold.selected} onSelect={set} />
            </div>
            <div className={styles.readout}>
              <p className={styles.perHead}>At threshold {thr(row.threshold)} (validation)</p>
              <dl className={styles.metrics}>
                {(['precision', 'recall', 'f1'] as const).map((k) => (
                  <div key={k}>
                    <dt>{k === 'f1' ? 'F1' : k[0]?.toUpperCase() + k.slice(1)}</dt>
                    <dd>
                      <span className="num" data-testid={`metric-${k}`}>{dec(row[k])}</span>
                    </dd>
                  </div>
                ))}
              </dl>
              <div className={styles.chosenBox}>
                <p className={styles.perHead}>Team's choice</p>
                <p>
                  <b>{thr(ops.threshold.selected)}</b> had the highest validation F1: {dec(w6.validation_f1)}, with precision{' '}
                  {dec(w6.validation_precision)} and recall {dec(w6.validation_recall)}. The default 0.50 is marked on
                  the chart for comparison.
                </p>
                <SourceTag id={w6.source} />
              </div>
            </div>
          </div>

          <details className={styles.tableToggle}>
            <summary>Show all {sweep.length} thresholds as a table</summary>
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <caption className="visually-hidden">Validation sweep</caption>
                <thead>
                  <tr>
                    <th scope="col">Threshold</th>
                    <th scope="col">Precision</th>
                    <th scope="col">Recall</th>
                    <th scope="col">F1</th>
                  </tr>
                </thead>
                <tbody>
                  {sweep.map((r) => (
                    <tr key={r.threshold} aria-current={r.threshold === row.threshold || undefined} data-chosen={r.threshold === ops.threshold.selected || undefined}>
                      <th scope="row">{thr(r.threshold)}</th>
                      <td>{dec(r.precision, 4)}</td>
                      <td>{dec(r.recall, 4)}</td>
                      <td>{dec(r.f1, 4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      </Card>

      <Card
        eyebrow={`Sealed test set · ${int(ops.dataset.test_rows)} orders`}
        title="Tuning versus calibration on the test set"
        description={`Tuning alone barely moved F1. Moving the cutoff to ${thr(ops.threshold.selected)} cut missed late orders from ${int(tunedDefault.confusion.fn)} to ${int(chosenOps.confusion.fn)}, ${w6.more_flagged} more at-risk shipments flagged, while false alarms rose from ${int(tunedDefault.confusion.fp)} to ${int(chosenOps.confusion.fp)}.`}
        footer={
          <>
            <SourceTag id={ops.final_test[0]?.source ?? chosenOps.source} />
            <SourceTag id={w6.more_flagged_source} />
          </>
        }
      >
        <div className={styles.tableScroll}>
          <table className={styles.table} data-wide>
            <caption className="visually-hidden">Final test results for three configurations</caption>
            <thead>
              <tr>
                <th scope="col">Configuration</th>
                <th scope="col">Cutoff</th>
                <th scope="col">Accuracy</th>
                <th scope="col">Precision</th>
                <th scope="col">Recall</th>
                <th scope="col">F1</th>
                <th scope="col">ROC-AUC</th>
                <th scope="col">PR-AUC</th>
              </tr>
            </thead>
            <tbody>
              {ops.final_test.map((r) => (
                <tr key={r.model} data-chosen={r === chosenOps || undefined}>
                  <th scope="row">{r.model.replace('Calibrated Threshold', 'calibrated cutoff')}</th>
                  <td>{thr(r.threshold)}</td>
                  {(['accuracy', 'precision', 'recall', 'f1', 'roc_auc', 'pr_auc'] as const).map((k) => (
                    <td key={k}>{dec(r[k], 4)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles.cmBlock}>
          <Segmented label="Confusion matrix for" options={CONFIGS} value={cmIndex} onChange={setCmIndex} />
          <ConfusionMatrix
            cm={cmRow.confusion}
            negative="On time"
            positive="Late"
            caption={`Test confusion matrix: ${cmRow.model}`}
          />
        </div>
      </Card>

      <div className={styles.twoCol}>
        <Card
          eyebrow="Week 5 → Week 6"
          title="The leak that flattered the first shortlist"
          description={
            <>
              Week 5 used {ops.dataset.features_before_leak_fix} features, eight of which were Order Status columns that
              encode the delivery outcome. Removing them left {ops.dataset.features} pre-shipment features, and the
              honest scores dropped.
            </>
          }
          footer={
            <>
              <SourceTag id={ops.dataset.features_before_leak_fix_source} />
              <SourceTag id={ops.week5_models[0]?.source ?? ''} />
              <SourceTag id={ops.week5_models[0]?.cv.source ?? ''} />
              <SourceTag id={ops.week5_rbf.source} />
              <SourceTag id={report.operations_w5.source} />
            </>
          }
        >
          {w5rf && (
            <dl className={styles.leak}>
              <div>
                <dt>Random Forest F1</dt>
                <dd>
                  <s className="num">{dec(w5rf.f1)}</s> → <b className="num">{dec(baseline.f1)}</b>
                </dd>
              </div>
              <div>
                <dt>ROC-AUC</dt>
                <dd>
                  <s className="num">{dec(w5rf.roc_auc)}</s> → <b className="num">{dec(baseline.roc_auc)}</b>
                </dd>
              </div>
            </dl>
          )}
          <p className={styles.subhead}>Week 5 shortlist (pre-fix, test set, threshold 0.50)</p>
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <caption className="visually-hidden">Week 5 model comparison</caption>
              <thead>
                <tr>
                  <th scope="col">Model</th>
                  <th scope="col">Recall</th>
                  <th scope="col">F1</th>
                  <th scope="col">CV F1 (5-fold)</th>
                </tr>
              </thead>
              <tbody>
                {ops.week5_models.map((m) => (
                  <tr key={m.model} data-chosen={m.model === 'Random Forest' || undefined}>
                    <th scope="row">{m.model}</th>
                    <td>{dec(m.recall)}</td>
                    <td>{dec(m.f1)}</td>
                    <td>
                      {dec(m.cv.f1_mean)} <span className={styles.sd}>± {dec(m.cv.f1_sd)}</span>
                    </td>
                  </tr>
                ))}
                <tr>
                  <th scope="row">{ops.week5_rbf.model}</th>
                  <td>{dec(ops.week5_rbf.recall)}</td>
                  <td>{dec(ops.week5_rbf.f1)}</td>
                  <td className={styles.na}>not run</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className={styles.fine}>
            Majority-class baseline accuracy: {pct(ops.majority_baseline_accuracy)}. Random Forest led on F1, recall and
            both AUCs, and went forward to tuning.
          </p>
        </Card>

        <Card
          eyebrow="Signals"
          title="What drives late-delivery risk"
          description="Top Random Forest importances from Week 5. The leaking Order Status columns are not among them, but these come from the pre-fix model, so read them as direction, not exact weight."
          footer={<SourceTag id={ops.feature_importance.source} />}
        >
          <BarList
            caption="Random Forest feature importance, top 15"
            items={ops.feature_importance.items.map((f) => ({ label: f.feature, value: f.importance }))}
            format={(v) => v.toFixed(3)}
          />
        </Card>
      </div>

      <Card
        eyebrow="Hyperparameter search"
        title="How the Random Forest was tuned"
        footer={<SourceTag id={ops.tuning.source} />}
      >
        <div className={styles.tuning}>
          <dl className={styles.tuneFacts}>
            <div>
              <dt>Search</dt>
              <dd>RandomizedSearchCV · {ops.tuning.candidates} candidates × {ops.tuning.folds} folds</dd>
            </div>
            <div>
              <dt>Rows searched</dt>
              <dd>
                {int(ops.tuning.search_rows)} stratified sample of {int(ops.dataset.dev_rows)} development rows
              </dd>
            </div>
            <div>
              <dt>Best CV F1</dt>
              <dd className="num">{dec(ops.tuning.best_cv_f1, 4)}</dd>
            </div>
          </dl>
          <ul className={styles.params} role="list" aria-label="Best parameters">
            {Object.entries(ops.tuning.best_params).map(([k, v]) => (
              <li key={k}>
                <code>{k}</code>
                <span>{v}</span>
              </li>
            ))}
          </ul>
        </div>
        <Callout title="Why sampling was acceptable">
          <p>
            The search ran on a sample to keep 75 fits practical; the winning settings were then refit on all{' '}
            {int(ops.dataset.dev_rows)} development rows before the threshold sweep, and on the full training set before
            the single test evaluation.
          </p>
        </Callout>
      </Card>
    </div>
  )
}
