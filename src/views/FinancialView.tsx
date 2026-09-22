import { useState } from 'react'
import { BarList } from '../components/BarList'
import { Card } from '../components/Card'
import { ConfusionMatrix } from '../components/ConfusionMatrix'
import { PageHeader } from '../components/PageHeader'
import { Segmented } from '../components/Segmented'
import { SourceTag } from '../components/SourceTag'
import { StatGrid, StatTile } from '../components/StatTile'
import { crossLayer, deployedFin, financial, report } from '../data'
import { dec, int } from '../lib/format'
import styles from './FinancialView.module.css'

const r = report
const w5 = r.financial_w5
const w6 = r.financial_w6
const eda = r.financial_eda
const rfTuned = w6.test.find((t) => t.row === 'RF · tuned')
const xgbR80 = w6.test.find((t) => t.row === 'XGB · tuned @ recall ≥ 80%')

const METRICS = ['accuracy', 'precision', 'recall', 'f1', 'roc_auc'] as const
const METRIC_LABEL: Record<(typeof METRICS)[number], string> = {
  accuracy: 'Accuracy',
  precision: 'Precision',
  recall: 'Recall',
  f1: 'F1',
  roc_auc: 'ROC-AUC',
}

export function FinancialView() {
  const [cm, setCm] = useState('0')
  const matrix = w6.matrices[Number(cm)] ?? w6.matrices[0]
  const best = (k: (typeof METRICS)[number]) => Math.max(...w5.models.map((m) => m[k]))

  return (
    <div className={styles.stack}>
      <PageHeader
        eyebrow="Financial layer · Taiwanese Bankruptcy data"
        title="Counterparty financial distress"
        lead={
          <>
            XGBoost reads {financial.split.features} cleaned financial ratios per company and flags the ones likely to go
            bankrupt. Only {eda.bankrupt_pct.toFixed(2)}% of firms are bankrupt, so the team judged models on recall,
            precision and PR-AUC, not accuracy. Tuning was tried in Week 6 and did not transfer, so the Week 5
            configuration ships.
          </>
        }
      />

      <StatGrid label="Deployed financial model, sealed test set">
        <StatTile
          tone="accent"
          label="Bankrupt firms caught"
          value={`${deployedFin.caught} of ${w5.positives}`}
          sub={`Recall ${dec(deployedFin.recall)} at threshold ${deployedFin.threshold.toFixed(2)}`}
          source={w6.test_source}
        />
        <StatTile label="Test F1" value={dec(deployedFin.f1)} sub={`Precision ${dec(deployedFin.precision)}`} source={w6.test_source} />
        <StatTile label="PR-AUC" value={dec(deployedFin.pr_auc)} sub={`ROC-AUC ${dec(deployedFin.roc_auc)}`} source={w6.test_source} />
        <StatTile
          label="Test firms"
          value={int(financial.split.test_rows)}
          sub={`One firm moves recall by about ${w5.firm_recall_points} points`}
          source={w5.decision_source}
        />
      </StatGrid>

      <Card
        eyebrow={`Week 5 · test set, n = ${int(w5.n)}, ${w5.positives} bankrupt`}
        title="Model selection: why XGBoost, and why accuracy misleads"
        description={w5.decision}
        footer={
          <>
            <SourceTag id={w5.source} />
            <SourceTag id={w5.decision_source} />
          </>
        }
      >
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <caption className="visually-hidden">Week 5 financial model comparison</caption>
            <thead>
              <tr>
                <th scope="col">Model</th>
                {METRICS.map((k) => (
                  <th key={k} scope="col">{METRIC_LABEL[k]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {w5.models.map((m) => (
                <tr key={m.model} data-chosen={m.model === 'XGBoost' || undefined}>
                  <th scope="row">{m.model}</th>
                  {METRICS.map((k) => (
                    <td key={k} data-best={m[k] === best(k) || undefined}>
                      {dec(m[k])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={styles.tableNote}>Bold marks the best value in each column. Every model used class weighting.</p>
        <div className={styles.equal}>
          <p className={styles.equalHead}>
            Held to the same {(w5.equal_recall.recall * 100).toFixed(1)}% recall ({w5.equal_recall.caught} of {w5.positives} caught)
          </p>
          <BarList
            caption="False alarms at equal recall"
            items={[
              { label: 'XGBoost', value: w5.equal_recall.xgb_false_alarms, emphasis: true, hint: 'false alarms' },
              { label: 'Logistic Regression', value: w5.equal_recall.lr_false_alarms, hint: 'false alarms' },
            ]}
            format={(v) => String(v)}
          />
          <p className={styles.equalNote}>
            {w5.equal_recall.fewer_pct}% fewer unnecessary reviews for identical detection. Logistic Regression's higher
            default-threshold recall is a threshold artefact, not better separation.
          </p>
        </div>
      </Card>

      <div className={styles.twoCol}>
        <Card
          eyebrow="Week 6 · protocol"
          title="Tuning without touching the test set"
          description={`RandomizedSearchCV: ${w6.search.draws} draws × ${w6.search.folds} folds = ${w6.search.fits} fits, scored on ${w6.search.scoring}, over a ${int(w6.search.space)}-combination space (${w6.search.coverage_pct}% covered).`}
          footer={<SourceTag id={w6.source} />}
        >
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <caption className="visually-hidden">Week 6 data partition</caption>
              <thead>
                <tr>
                  <th scope="col">Split</th>
                  <th scope="col">Rows</th>
                  <th scope="col">Bankrupt</th>
                  <th scope="col">Used for</th>
                </tr>
              </thead>
              <tbody>
                {w6.partition.map((p) => (
                  <tr key={p.split}>
                    <th scope="row">{p.split}</th>
                    <td>{int(p.rows)}</td>
                    <td>{p.bankrupt}</td>
                    <td className={styles.left}>{p.use}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card
          eyebrow="Week 6 · search result"
          title="The search looked like it worked"
          description="Cross-validated PR-AUC on the tuning split. The winner beat the Week 5 configuration in cross-validation."
          footer={<SourceTag id={w6.cv_source} />}
        >
          <dl className={styles.cv}>
            {w6.cv.map((c) => (
              <div key={c.model}>
                <dt>{c.model}</dt>
                <dd>
                  <b className="num">{c.pr_auc.toFixed(4)}</b>
                  {c.sd !== null && <span>SD {c.sd.toFixed(4)}</span>}
                </dd>
              </div>
            ))}
          </dl>
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <caption className="visually-hidden">XGBoost parameters, tuned and Week 5</caption>
              <thead>
                <tr>
                  <th scope="col">Parameter</th>
                  <th scope="col">Tuned</th>
                  <th scope="col">Week 5</th>
                </tr>
              </thead>
              <tbody>
                {w6.params.map((p) => (
                  <tr key={p.param}>
                    <th scope="row">
                      <code>{p.param}</code>
                    </th>
                    <td>{p.tuned}</td>
                    <td data-best={p.param === 'scale_pos_weight' || undefined}>{p.week5}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card
        eyebrow={`Week 6 · sealed test set, ${w5.positives} bankrupt firms`}
        title="On the test set, nothing beat the Week 5 configuration"
        description={`Tuned Random Forest caught more firms (${rfTuned?.caught ?? ''} of ${w5.positives}) but raised ${w6.false_alarms.rf_tuned} false alarms; the recall-targeted XGBoost threshold caught ${xgbR80?.caught ?? ''} at ${w6.false_alarms.xgb_tuned_recall80}.`}
        footer={
          <>
            <SourceTag id={w6.test_source} />
            <SourceTag id={w6.false_alarms_source} />
            <SourceTag id={w6.recall80_source} />
          </>
        }
      >
        <div className={styles.testGrid}>
          <div className={styles.tableScroll}>
            <table className={styles.table} data-wide>
              <caption className="visually-hidden">Week 6 financial test-set results</caption>
              <thead>
                <tr>
                  <th scope="col">Configuration</th>
                  <th scope="col">Threshold</th>
                  <th scope="col">Precision</th>
                  <th scope="col">Recall</th>
                  <th scope="col">F1</th>
                  <th scope="col">ROC-AUC</th>
                  <th scope="col">PR-AUC</th>
                  <th scope="col">Caught</th>
                </tr>
              </thead>
              <tbody>
                {w6.test.map((t) => (
                  <tr key={t.row} data-chosen={t.deployed || undefined}>
                    <th scope="row">
                      {t.row}
                      {t.deployed && <span className={styles.deployed}>deployed</span>}
                    </th>
                    <td>{t.threshold.toFixed(3)}</td>
                    <td>{dec(t.precision)}</td>
                    <td>{dec(t.recall)}</td>
                    <td>{dec(t.f1)}</td>
                    <td>{dec(t.roc_auc)}</td>
                    <td>{dec(t.pr_auc)}</td>
                    <td>
                      {t.caught}/{w5.positives}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className={styles.cmBlock}>
          <Segmented
            label="Confusion matrix (Week 6, Figure 5)"
            options={w6.matrices.map((m, i) => ({ value: String(i), label: m.label }))}
            value={cm}
            onChange={setCm}
          />
          {matrix && (
            <ConfusionMatrix
              cm={matrix}
              negative="Healthy"
              positive="Bankrupt"
              caption={`Financial test confusion matrix: ${matrix.label}, threshold ${matrix.threshold.toFixed(3)}`}
            />
          )}
          <SourceTag id={w6.matrices_source} />
        </div>
      </Card>

      <div className={styles.twoCol}>
        <Card
          eyebrow="Week 6 · diagnosis"
          title="Why tuning did not transfer"
          footer={<SourceTag id={w6.why_source} />}
        >
          <ul className={styles.why} role="list">
            <li>
              <b>The ranking was smaller than its own noise.</b> The best-to-worst spread across all {w6.search.draws}{' '}
              configurations was {w6.why.spread.toFixed(4)} PR-AUC, against a mean fold-to-fold SD of{' '}
              {w6.why.fold_sd.toFixed(4)}: a signal-to-noise ratio of {w6.why.snr.toFixed(2)}. All {w6.search.draws} sat
              within one SD of the winner.
            </li>
            <li>
              <b>Too few positives per fold.</b> About {w6.why.positives_per_fold} bankrupt firms per fold, so picking the
              maximum of {w6.search.draws} noisy estimates rewarded lucky folds: the winner's curse.
            </li>
            <li>
              <b>The grid could not reach the baseline.</b> It capped <code>scale_pos_weight</code> at {w6.why.spw_cap}{' '}
              while the class ratio was {w6.why.class_ratio.toFixed(1)}. A diagnostic rerun with that axis widened picked{' '}
              {w6.why.rerun_spw} and reached validation PR-AUC {w6.why.rerun_val_pr_auc.toFixed(4)}, against{' '}
              {w6.why.baseline_val_pr_auc.toFixed(4)} for the baseline and {w6.why.winner_val_pr_auc.toFixed(4)} for the
              original winner.
            </li>
          </ul>
        </Card>

        <Card
          eyebrow="Week 6 · how much is real?"
          title="The difference is indistinguishable from zero"
          description={`Paired bootstrap over the test set, ${int(w6.bootstrap.resamples)} resamples.`}
          footer={<SourceTag id={w6.bootstrap_source} />}
        >
          <dl className={styles.boot}>
            <div>
              <dt>ΔPR-AUC, tuned − Week 5</dt>
              <dd className="num">{w6.bootstrap.delta.toFixed(4)}</dd>
            </div>
            <div>
              <dt>95% interval</dt>
              <dd className="num">
                [{w6.bootstrap.ci[0]?.toFixed(4)}, +{w6.bootstrap.ci[1]?.toFixed(4)}]
              </dd>
            </div>
            <div>
              <dt>Tuned wins</dt>
              <dd className="num">{w6.bootstrap.tuned_wins_pct}% of resamples</dd>
            </div>
            <div>
              <dt>In firms</dt>
              <dd className="num">
                {w6.bootstrap.firms} of {w6.bootstrap.of}
              </dd>
            </div>
          </dl>
          <p className={styles.decision}>
            <b>Decision.</b> {w6.decision}
          </p>
          <SourceTag id={r.deployment.source} />
        </Card>
      </div>

      <Card
        eyebrow="Leakage-safe preparation · Week 4"
        title={`From ${financial.dataset.features} ratios to ${financial.split.features} model features`}
        description="Every threshold is learned on the training split only and then applied unchanged to the test split."
      >
        <ol className={styles.prep} role="list">
          <li>
            <span className={styles.prepLabel}>
              Capped {financial.cleaning.capped_total} outlier-prone columns at the training 99th percentile (
              {financial.cleaning.minor_capped} minor + 1 borderline)
            </span>
            <SourceTag id={financial.cleaning.source} />
          </li>
          <li>
            <span className={styles.prepLabel}>Dropped the {financial.cleaning.severe_dropped} severely corrupted columns</span>
            <SourceTag id={financial.cleaning.source} />
          </li>
          <li>
            <span className={styles.prepLabel}>
              Dropped one column of an exact-duplicate pair (verified maximum difference {financial.split.duplicate_pair_max_diff.toFixed(1)})
            </span>
            <SourceTag id={financial.split.source} />
          </li>
          <li>
            <span className={styles.prepLabel}>
              Replaced the three ROA variants with Profitability_Composite and added Compounding_Leverage_Risk
            </span>
            <SourceTag id={crossLayer.separation.engineering_source} />
          </li>
          <li>
            <span className={styles.prepLabel}>
              Result: {financial.split.features} features, {int(financial.split.train_rows)} training and{' '}
              {int(financial.split.test_rows)} test firms
            </span>
            <SourceTag id={financial.split.source} />
          </li>
        </ol>
      </Card>
    </div>
  )
}
