import { Card } from '../components/Card'
import { Icon } from '../components/Icon'
import { PageHeader } from '../components/PageHeader'
import { SourceTag } from '../components/SourceTag'
import { chosenOps, crossLayer, deployedFin, financial, operations, report } from '../data'
import { dec, int, pct, thr } from '../lib/format'
import type { ViewId } from '../lib/routes'
import styles from './OverviewView.module.css'

export function OverviewView({ onNavigate }: { onNavigate: (v: ViewId) => void }) {
  const ops = operations
  const r = report
  const fin = r.financial_eda
  const opsBase = ops.final_test[1] ?? chosenOps

  return (
    <div className={styles.stack}>
      <PageHeader
        eyebrow="Overview · two layers, side by side"
        title="Will this counterparty fail, and will this order arrive late?"
        lead={
          <>
            CEROP scores cross-border suppliers on two separate questions: financial distress, from company
            ratios, and late delivery, from order and shipping data. This console presents the team's documented
            results. Each figure links to the notebook cell or report table it came from.
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
              {deployedFin.caught}
              <span className={styles.heroOf}> / {r.financial_w5.positives}</span>
            </p>
            <p className={styles.heroLabel}>
              bankrupt firms caught on the sealed test set by the deployed model: XGBoost at its Week 5 configuration
            </p>
          </div>
          <dl className={styles.facts}>
            <div>
              <dt>Test F1</dt>
              <dd className="num">{dec(deployedFin.f1)}</dd>
            </div>
            <div>
              <dt>PR-AUC</dt>
              <dd className="num">{dec(deployedFin.pr_auc)}</dd>
            </div>
            <div>
              <dt>Firms</dt>
              <dd className="num">{int(fin.rows)}</dd>
            </div>
            <div>
              <dt>Bankrupt</dt>
              <dd className="num">
                {fin.bankrupt_pct.toFixed(2)}% <span className={styles.muted}>{int(fin.bankrupt)} firms</span>
              </dd>
            </div>
          </dl>
          <footer className={styles.layerFoot}>
            <SourceTag id={r.financial_w6.test_source} />
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
              of late orders caught on the sealed test set ({int(chosenOps.confusion.tp)} of{' '}
              {int(ops.dataset.class_counts.test_late)}) by the deployed model: tuned Random Forest at the {thr(ops.threshold.selected)} cutoff
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

      <Card
        eyebrow="Deployment decision · Week 6"
        title="What ships, and why"
        description={r.deployment.presentation}
        footer={
          <>
            <SourceTag id={r.deployment.source} />
            <SourceTag id={r.operations_w6.more_flagged_source} />
          </>
        }
      >
        <div className={styles.deploy}>
          <section aria-labelledby="dep-fin">
            <p className={styles.depTag}>FIN</p>
            <h3 id="dep-fin" className={styles.depTitle}>{r.deployment.financial}</h3>
            <p className={styles.depBody}>
              Tuning did not transfer to the test set. The before/after difference in PR-AUC was{' '}
              {r.financial_w6.bootstrap.delta.toFixed(4)}, with a 95% bootstrap interval of [
              {r.financial_w6.bootstrap.ci[0]?.toFixed(4)}, +{r.financial_w6.bootstrap.ci[1]?.toFixed(4)}] that
              straddles zero. {r.financial_w6.decision}
            </p>
          </section>
          <section aria-labelledby="dep-ops">
            <p className={styles.depTag} data-ops>OPS</p>
            <h3 id="dep-ops" className={styles.depTitle}>{r.deployment.operations}</h3>
            <p className={styles.depBody}>
              Calibration cut missed late shipments from {int(opsBase.confusion.fn)} to {int(chosenOps.confusion.fn)}, so{' '}
              {r.operations_w6.more_flagged} more at-risk shipments were flagged for review, while false alarms rose from{' '}
              {int(opsBase.confusion.fp)} to {int(chosenOps.confusion.fp)}.
            </p>
          </section>
        </div>
      </Card>

      <Card
        eyebrow="Design decision"
        title="Why the two layers aren't merged"
        description={r.separation.merge}
        footer={<SourceTag id={r.separation.merge_source} />}
      >
        <ol className={styles.reasons} role="list">
          <li>
            <span className={styles.reasonN}>1</span>
            <div>
              <p className={styles.reasonT}>Different targets and features</p>
              <p className={styles.reasonB}>
                One row is a firm described by {fin.features} financial ratios; the other is an order line. In the
                team's words: “{r.separation.shared}”
              </p>
              <SourceTag id={r.separation.source} />
            </div>
          </li>
          <li>
            <span className={styles.reasonN}>2</span>
            <div>
              <p className={styles.reasonT}>Opposite class balance</p>
              <p className={styles.reasonB}>
                {fin.bankrupt_pct.toFixed(2)}% of firms are bankrupt, against {pct(ops.dataset.late_rate)} of orders
                arriving late. The team scored the financial search on average precision and the operations search on F1.
              </p>
              <span className={styles.tags}>
                <SourceTag id={fin.source} />
                <SourceTag id={ops.dataset.class_counts.source} />
                <SourceTag id={r.protocol.source} />
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
        eyebrow="Data at a glance"
        title="Three public datasets, split before anything is fitted"
        footer={
          <>
            <SourceTag id={financial.dataset.source} />
            <SourceTag id={financial.split.source} />
            <SourceTag id={ops.dataset.raw_rows.source} />
            <SourceTag id={ops.dataset.source} />
            <SourceTag id={r.gscpi.records_source} />
          </>
        }
      >
        <div className={styles.dataTable}>
          <table>
            <caption className="visually-hidden">Dataset summary</caption>
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
                <td className={styles.r}>{int(financial.dataset.rows)}</td>
                <td className={styles.r}>{int(financial.split.train_rows)}</td>
                <td className={styles.r}>{int(financial.split.test_rows)}</td>
                <td className={styles.r}>{financial.split.features}</td>
                <td className={styles.r}>{fin.bankrupt_pct.toFixed(2)}%</td>
              </tr>
              <tr>
                <th scope="row">Operations</th>
                <td>DataCo Smart Supply Chain</td>
                <td className={styles.r}>{int(ops.dataset.raw_rows.after_artifact_removal)}</td>
                <td className={styles.r}>{int(ops.dataset.train_rows)}</td>
                <td className={styles.r}>{int(ops.dataset.test_rows)}</td>
                <td className={styles.r}>{ops.dataset.features}</td>
                <td className={styles.r}>{pct(ops.dataset.late_rate, 2)}</td>
              </tr>
              <tr>
                <th scope="row">Macro context</th>
                <td>NY Fed GSCPI, {r.gscpi.coverage}</td>
                <td className={styles.r}>{r.gscpi.records} months</td>
                <td className={styles.r}>—</td>
                <td className={styles.r}>—</td>
                <td className={styles.r}>—</td>
                <td className={styles.r}>—</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className={styles.note}>
          Both splits are stratified 80/20. DataCo drops {int(ops.dataset.raw_rows.removed)} rows from a documented
          Nov–Dec 2017 collection artefact before splitting ({int(ops.dataset.raw_rows.original)} raw rows). GSCPI is
          joined to the operations layer by order month.
        </p>
      </Card>
    </div>
  )
}
