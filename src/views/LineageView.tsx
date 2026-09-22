import { useEffect, useRef } from 'react'
import { Card } from '../components/Card'
import { PageHeader } from '../components/PageHeader'
import { SourceTag } from '../components/SourceTag'
import { financial, operations, report, sources } from '../data'
import { USAGE } from '../data/usage'
import { int, thr } from '../lib/format'
import styles from './LineageView.module.css'

const ops = operations

const fin6 = report.financial_w6
const finCal = fin6.test.find((t) => t.row === 'XGB · tuned @ calibrated')

const PIPELINE = [
  {
    step: 'Split',
    body: `Stratified 80/20 split before anything is fitted. The test sets are sealed: ${int(financial.split.test_rows)} firms and ${int(ops.dataset.test_rows)} orders.`,
    source: financial.split.source,
  },
  {
    step: 'Fit on train only',
    body: 'Outlier caps, IQR bounds, encoders and scalers are learned from the training split and applied unchanged to the test split.',
    source: financial.cleaning.source,
  },
  {
    step: 'Tune on a validation split',
    body: `Financial: ${int(fin6.partition[0]?.rows ?? 0)} fit / ${int(fin6.partition[1]?.rows ?? 0)} validation rows, ${fin6.search.draws} × ${fin6.search.folds}-fold search on ${fin6.search.scoring}. Operations: ${int(ops.dataset.dev_rows)} / ${int(ops.dataset.validation_rows)} rows, ${ops.tuning.candidates} × ${ops.tuning.folds}-fold search on F1.`,
    source: fin6.source,
  },
  {
    step: 'Calibrate on validation',
    body: `Thresholds are chosen on validation data only: ${thr(ops.threshold.selected)} for operations, and ${finCal?.threshold.toFixed(3) ?? ''} for the tuned financial model, which was not adopted.`,
    source: ops.threshold.source,
  },
  {
    step: 'Open the test set once',
    body: 'Every configuration is scored once on the sealed test set, and nothing is re-tuned afterwards.',
    source: report.protocol.source,
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
        lead="The same protocol runs on both layers: split first, learn only from training data, tune and calibrate away from the test set, then open the test set once. Every figure in this console traces to a notebook cell, the saved sweep file or a page of the Group 4 report, listed below."
      />

      <Card eyebrow="Protocol" title="One pass, test set last" footer={<SourceTag id={report.protocol.source} />}>
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

      <Card
        eyebrow="Team"
        title={`${report.project.group} · ${report.project.course}`}
        description={`${report.project.university} · ${report.project.instructor} · ${report.project.term}`}
        footer={
          <>
            <SourceTag id={report.project.source} />
            <SourceTag id={report.project.roles_source} />
          </>
        }
      >
        <ul className={styles.team} role="list">
          {report.project.team.map((m) => (
            <li key={m.name}>
              <p className={styles.itemT}>{m.name}</p>
              <p className={styles.itemB}>{m.role}</p>
            </li>
          ))}
        </ul>
        <p className={styles.credits}>
          The modelling is the team's work. The charter assigns the decision-support dashboard to Divya Gopal, who
          designed and built this console.
        </p>
      </Card>
    </div>
  )
}
