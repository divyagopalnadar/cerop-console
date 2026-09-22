import { Card } from '../components/Card'
import { Icon } from '../components/Icon'
import { PageHeader } from '../components/PageHeader'
import { SourceTag } from '../components/SourceTag'
import { chosenOps, crossLayer, financial, operations } from '../data'
import { dec, int, pct, thr } from '../lib/format'
import type { ViewId } from '../lib/routes'
import styles from './OverviewView.module.css'

export function OverviewView({ onNavigate }: { onNavigate: (v: ViewId) => void }) {
  const fin = financial
  const ops = operations
  const imbalance = (1 - fin.dataset.positive_share) / fin.dataset.positive_share
  const noSkill = fin.dataset.positive_share

  return (
    <div className={styles.stack}>
      <PageHeader
        eyebrow="Overview · two layers, one console"
        title="Will this counterparty fail, and will this order arrive late?"
        lead={
          <>
            CEROP scores cross-border suppliers on two separate questions: financial distress, from
            company ratios, and late delivery, from order and shipping data. This console lays out
            what the team's models achieved on held-out data, and every figure links back to the
            notebook cell or slide it came from.
          </>
        }
      />

      <div className={styles.layers}>
        <article className={styles.layer} aria-labelledby="fin-title">
          <header className={styles.layerHead}>
            <span className={styles.layerTag}>FIN</span>
            <div>
              <h2 id="fin-title" className={styles.layerTitle}>Financial layer</h2>
              <p className={styles.layerQ}>Is this counterparty heading for bankruptcy?</p>
            </div>
          </header>
          <div className={styles.hero}>
            <p className={styles.heroValue}>
              {fin.result.caught}
              <span className={styles.heroOf}> / {fin.result.test_positives}</span>
            </p>
            <p className={styles.heroLabel}>
              bankrupt firms caught in the held-out test split ({fin.result.model})
            </p>
          </div>
          <dl className={styles.facts}>
            <div>
              <dt>Test F1</dt>
              <dd className="num">{dec(fin.result.test_f1)}</dd>
            </div>
            <div>
              <dt>PR-AUC</dt>
              <dd className="num">
                {dec(fin.result.pr_auc)} <span className={styles.muted}>vs {dec(noSkill)} chance</span>
              </dd>
            </div>
            <div>
              <dt>Firms</dt>
              <dd className="num">{int(fin.dataset.rows)}</dd>
            </div>
            <div>
              <dt>Bankrupt</dt>
              <dd className="num">
                {pct(fin.dataset.positive_share, 2)} <span className={styles.muted}>≈ 1 : {Math.round(imbalance)}</span>
              </dd>
            </div>
          </dl>
          <footer className={styles.layerFoot}>
            <SourceTag id={fin.result.detail_source} />
            <button type="button" className={styles.open} onClick={() => onNavigate('financial')}>
              Financial layer <Icon name="chevron" size={14} className={styles.chev} />
            </button>
          </footer>
        </article>

        <article className={styles.layer} aria-labelledby="ops-title">
          <header className={styles.layerHead}>
            <span className={styles.layerTag} data-ops>OPS</span>
            <div>
              <h2 id="ops-title" className={styles.layerTitle}>Operations layer</h2>
              <p className={styles.layerQ}>Will this order be delivered late?</p>
            </div>
          </header>
          <div className={styles.hero}>
            <p className={styles.heroValue}>{pct(chosenOps.recall)}</p>
            <p className={styles.heroLabel}>
              of late orders caught on the test set ({int(chosenOps.confusion.tp)} of{' '}
              {int(chosenOps.confusion.tp + chosenOps.confusion.fn)}), tuned Random Forest at the {thr(ops.threshold.selected)} cutoff
            </p>
          </div>
          <dl className={styles.facts}>
            <div>
              <dt>Test F1</dt>
              <dd className="num">{dec(chosenOps.f1)}</dd>
            </div>
            <div>
              <dt>ROC-AUC</dt>
              <dd className="num">{dec(chosenOps.roc_auc)}</dd>
            </div>
            <div>
              <dt>Orders</dt>
              <dd className="num">{int(ops.dataset.raw_rows.after_artifact_removal)}</dd>
            </div>
            <div>
              <dt>Late</dt>
              <dd className="num">{pct(ops.dataset.late_rate)}</dd>
            </div>
          </dl>
          <footer className={styles.layerFoot}>
            <SourceTag id={chosenOps.source} />
            <button type="button" className={styles.open} onClick={() => onNavigate('operations')}>
              Operations layer <Icon name="chevron" size={14} className={styles.chev} />
            </button>
          </footer>
        </article>
      </div>

      <div className={styles.twoCol}>
        <Card
          eyebrow="Design decision"
          title="Why the two layers aren't merged"
          description="They answer different questions about different things, so each gets its own model, metric and cutoff. They meet only at the decision step."
        >
          <ol className={styles.reasons} role="list">
            <li>
              <span className={styles.reasonN}>1</span>
              <div>
                <p className={styles.reasonT}>Different units, no shared key</p>
                <p className={styles.reasonB}>
                  One row is a company-year of {fin.dataset.features} financial ratios; the other is an order line.
                  In the team's words: “{crossLayer.separation.separate.replace('Separate datasets: ', '')}”
                </p>
                <SourceTag id={crossLayer.separation.source} />
              </div>
            </li>
            <li>
              <span className={styles.reasonN}>2</span>
              <div>
                <p className={styles.reasonT}>Opposite class balance</p>
                <p className={styles.reasonB}>
                  {pct(fin.dataset.positive_share, 2)} of firms are bankrupt, against {pct(ops.dataset.late_rate)} of
                  orders arriving late. Rare-event detection is judged on recall and PR-AUC; the near-balanced
                  delivery problem can use F1 and accuracy against a {pct(ops.majority_baseline_accuracy)} majority baseline.
                </p>
                <span className={styles.tags}>
                  <SourceTag id={fin.dataset.positive_share_source} />
                  <SourceTag id={ops.dataset.class_counts.source} />
                </span>
              </div>
            </li>
            <li>
              <span className={styles.reasonN}>3</span>
              <div>
                <p className={styles.reasonT}>Different context signals</p>
                <p className={styles.reasonB}>{crossLayer.separation.gscpi}</p>
                <SourceTag id={crossLayer.separation.gscpi_source} />
              </div>
            </li>
          </ol>
        </Card>

        <Card
          eyebrow="Decision step"
          title="Where the layers meet"
          description="Each layer flags on its own. The team's playbook decides what happens when one or both flag the same supplier."
          footer={<SourceTag id={crossLayer.playbook_source} />}
        >
          <ul className={styles.playbook} role="list">
            {crossLayer.playbook.map((p) => (
              <li key={p.label} data-kind={p.label}>
                <span className={styles.pbMarks} aria-hidden="true">
                  <span data-on={p.label !== 'Operational Only' || undefined}>FIN</span>
                  <span data-on={p.label !== 'Financial Only' || undefined}>OPS</span>
                </span>
                <div>
                  <p className={styles.pbLabel}>{p.label.replace('Only', 'only').replace('Dual Risk', 'dual risk')}</p>
                  <p className={styles.pbAction}>{p.action}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card
        eyebrow="Data at a glance"
        title="Two public datasets, split before anything is fitted"
        footer={
          <>
            <SourceTag id={fin.dataset.source} />
            <SourceTag id={fin.split.source} />
            <SourceTag id={ops.dataset.raw_rows.source} />
            <SourceTag id={ops.dataset.source} />
          </>
        }
      >
        <div className={styles.dataTable}>
          <table>
            <caption className="visually-hidden">Dataset summary for both layers</caption>
            <thead>
              <tr>
                <th scope="col">Layer</th>
                <th scope="col">Dataset</th>
                <th scope="col" className={styles.r}>Rows</th>
                <th scope="col" className={styles.r}>Train</th>
                <th scope="col" className={styles.r}>Test</th>
                <th scope="col" className={styles.r}>Model features</th>
                <th scope="col" className={styles.r}>Positive rate</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Financial</th>
                <td>Taiwanese Bankruptcy Prediction (UCI 572)</td>
                <td className={styles.r}>{int(fin.dataset.rows)}</td>
                <td className={styles.r}>{int(fin.split.train_rows)}</td>
                <td className={styles.r}>{int(fin.split.test_rows)}</td>
                <td className={styles.r}>{fin.split.features}</td>
                <td className={styles.r}>{pct(fin.dataset.positive_share, 2)}</td>
              </tr>
              <tr>
                <th scope="row">Operations</th>
                <td>DataCo Smart Supply Chain + NY Fed GSCPI</td>
                <td className={styles.r}>{int(ops.dataset.raw_rows.after_artifact_removal)}</td>
                <td className={styles.r}>{int(ops.dataset.train_rows)}</td>
                <td className={styles.r}>{int(ops.dataset.test_rows)}</td>
                <td className={styles.r}>{ops.dataset.features}</td>
                <td className={styles.r}>{pct(ops.dataset.late_rate, 2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className={styles.note}>
          Both splits are stratified 80/20 with a fixed seed. DataCo drops {int(ops.dataset.raw_rows.removed)} rows from a
          documented Nov–Dec 2017 collection artefact before splitting ({int(ops.dataset.raw_rows.original)} raw rows).
        </p>
      </Card>
    </div>
  )
}
