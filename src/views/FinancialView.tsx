import { Callout } from '../components/Callout'
import { Card } from '../components/Card'
import { ConfusionMatrix } from '../components/ConfusionMatrix'
import { PageHeader } from '../components/PageHeader'
import { SourceTag } from '../components/SourceTag'
import { StatGrid, StatTile } from '../components/StatTile'
import { crossLayer, financial } from '../data'
import { buildHash } from '../lib/routes'
import { dec, int, pct } from '../lib/format'
import { fromConfusion } from '../lib/metrics'
import styles from './FinancialView.module.css'

export function FinancialView() {
  const { dataset, cleaning, split, result, derived_confusion: cm } = financial
  const derived = fromConfusion(cm)
  const onePoint = 1 / result.test_positives
  const lift = result.pr_auc / dataset.positive_share

  const prep = [
    { label: 'Raw financial ratios', delta: null, count: dataset.features, source: dataset.source },
    {
      label: `Capped ${cleaning.capped_total} outlier-prone columns at the training 99th percentile (${cleaning.minor_capped} minor + 1 borderline)`,
      delta: 0,
      count: dataset.features,
      source: cleaning.source,
    },
    {
      label: `Dropped ${cleaning.severe_dropped} severely corrupted columns`,
      delta: -cleaning.severe_dropped,
      count: dataset.features - cleaning.severe_dropped,
      source: cleaning.source,
    },
    {
      label: 'Dropped one column of an exact-duplicate pair (verified max difference 0.0)',
      delta: -cleaning.duplicate_dropped,
      count: dataset.features - cleaning.severe_dropped - cleaning.duplicate_dropped,
      source: split.source,
    },
    {
      label: 'Replaced three ROA variants with one Profitability_Composite; added Compounding_Leverage_Risk',
      delta: split.features - (dataset.features - cleaning.severe_dropped - cleaning.duplicate_dropped),
      count: split.features,
      source: crossLayer.separation.engineering_source,
    },
  ]

  return (
    <div className={styles.stack}>
      <PageHeader
        eyebrow="Financial layer · Taiwanese Bankruptcy data"
        title="Counterparty financial distress"
        lead={
          <>
            An {result.model} classifier reads {dataset.features} financial ratios per company and flags the ones
            likely to go bankrupt. Only {pct(dataset.positive_share, 2)} of firms are bankrupt, so accuracy
            means little here: the question is how many of the rare failures the model catches, and at
            what cost in false alarms.
          </>
        }
      />

      <StatGrid label="Financial layer test results">
        <StatTile
          tone="accent"
          label="Bankrupt firms caught"
          value={`${result.caught} of ${result.test_positives}`}
          sub={`Recall ${dec(result.test_recall)} on the held-out split`}
          source={result.detail_source}
        />
        <StatTile label="Test F1" value={dec(result.test_f1)} sub={`${result.model}, baseline configuration`} source={result.source} />
        <StatTile
          label="PR-AUC"
          value={dec(result.pr_auc)}
          sub={`≈ ${lift.toFixed(0)}× the ${dec(dataset.positive_share)} a random ranking scores`}
          source={result.detail_source}
        />
        <StatTile
          label="Test firms"
          value={int(split.test_rows)}
          sub={`${int(split.train_rows)} for training · ${split.features} features`}
          source={split.source}
        />
      </StatGrid>

      <div className={styles.twoCol}>
        <Card
          eyebrow="Held-out test split"
          title="Confusion matrix (reconstructed)"
          description="Rebuilt from the reported results, because no notebook in the record prints it."
          footer={
            <>
              <SourceTag id={cm.source} />
              <SourceTag id={result.detail_source} />
              <SourceTag id={split.source} />
            </>
          }
        >
          <ConfusionMatrix
            cm={cm}
            negative="Healthy"
            positive="Bankrupt"
            caption={`Reconstructed financial-layer confusion matrix on ${int(split.test_rows)} test firms`}
          />
          <details className={styles.derivation}>
            <summary>How the four counts are pinned down</summary>
            <ol>
              <li>
                The final deck reports <b>{result.caught} of {result.test_positives}</b> at-risk firms caught, so TP ={' '}
                {cm.tp} and FN = {cm.fn}.
              </li>
              <li>
                F1 is reported as <b>{dec(result.test_f1)}</b>. With recall fixed at {cm.tp}/{result.test_positives}, only
                one false-positive count reproduces that F1 to three decimals: FP = {cm.fp} (precision{' '}
                {dec(derived.precision)}).
              </li>
              <li>
                The test split holds {int(split.test_rows)} firms, so TN = {int(split.test_rows)} − {result.test_positives} −{' '}
                {cm.fp} = {int(cm.tn)}.
              </li>
            </ol>
            <p>A unit test repeats this search and fails if the solution stops being unique.</p>
          </details>
        </Card>

        <Card
          eyebrow="Model choice"
          title="Why the team kept the baseline model"
          footer={<SourceTag id={result.source} />}
        >
          <dl className={styles.quote}>
            <div>
              <dt>Primary challenge</dt>
              <dd>{result.challenge}</dd>
            </div>
            <div>
              <dt>Selected strategy</dt>
              <dd>{result.strategy}</dd>
            </div>
          </dl>
          <div className={styles.prose}>
            <p>
              With {result.test_positives} bankrupt firms in the test split, each one moves recall by{' '}
              <b>{pct(onePoint)}</b>. A tuned model has to win by several firms before the gain can be told
              apart from which companies happened to land in the test set, and a search tuned against so few
              positives can easily fit noise in the validation folds instead of signal.
            </p>
            <p>
              The final deck records the decision, not the tuned scores, so the console shows no
              tuned-versus-untuned comparison for this layer. The operations layer, with thousands of
              positives, is where tuning and threshold calibration could be measured.
            </p>
          </div>
          <Callout title="Not in the record" tone="caution">
            <p>
              The executed financial model-selection notebook (XGBoost against Logistic Regression and the other
              candidates), the tuned scores and the financial cutoff aren't in the materials this console was
              built from. <a href={buildHash('lineage')}>See what's missing</a>.
            </p>
          </Callout>
        </Card>
      </div>

      <Card
        eyebrow="Leakage-safe preparation"
        title={`From ${dataset.features} ratios to ${split.features} model features`}
        description="Every threshold below is learned on the training split only and then applied unchanged to the test split."
      >
        <ol className={styles.prep} role="list">
          {prep.map((step, i) => (
            <li key={i}>
              <span className={styles.prepCount} aria-label={`${step.count} features`}>
                {step.count}
              </span>
              <span className={styles.prepDelta} data-sign={step.delta === null ? 'none' : step.delta < 0 ? 'neg' : step.delta > 0 ? 'pos' : 'zero'}>
                {step.delta === null ? 'start' : step.delta === 0 ? '±0' : step.delta > 0 ? `+${step.delta}` : `−${Math.abs(step.delta)}`}
              </span>
              <span className={styles.prepLabel}>{step.label}</span>
              <SourceTag id={step.source} />
            </li>
          ))}
        </ol>
      </Card>
    </div>
  )
}
