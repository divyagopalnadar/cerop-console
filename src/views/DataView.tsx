import { BarList } from '../components/BarList'
import { Card } from '../components/Card'
import { ColumnChart } from '../components/ColumnChart'
import { DivergingBars } from '../components/DivergingBars'
import { PageHeader } from '../components/PageHeader'
import { SourceTag } from '../components/SourceTag'
import { StatGrid, StatTile } from '../components/StatTile'
import { report } from '../data'
import { int } from '../lib/format'
import styles from './DataView.module.css'

const r = report
const fin = r.financial_eda
const ops = r.operations_eda
const signed = (v: number) => (v > 0 ? `+${v.toFixed(3)}` : `−${Math.abs(v).toFixed(3)}`)

export function DataView() {
  return (
    <div className={styles.stack}>
      <PageHeader
        eyebrow="Data & EDA · Weeks 3–4"
        title="What the data looked like before any model saw it"
        lead="The team's exploratory findings: what predicts bankruptcy, what drives late delivery, which columns could not be trusted, and a macro assumption that did not hold."
      />

      <StatGrid label="Dataset sizes">
        <StatTile label="Firms" value={int(fin.rows)} sub={`${int(fin.bankrupt)} bankrupt · ${int(fin.healthy)} not`} source={fin.source} />
        <StatTile label="Bankrupt share" value={`${fin.bankrupt_pct.toFixed(2)}%`} sub={`A ${fin.class_ratio.toFixed(1)} : 1 class ratio`} source={fin.class_ratio_source} />
        <StatTile label="DataCo order lines" value={int(ops.rows)} sub={`${ops.features} features · ${ops.late_pct}% late`} source={ops.source} />
        <StatTile label="GSCPI" value={`${r.gscpi.records} months`} sub={r.gscpi.coverage} source={r.gscpi.records_source} />
      </StatGrid>

      <div className={styles.twoCol}>
        <Card
          eyebrow="Operations · Week 3"
          title="Shipping mode is the strongest late-delivery signal"
          description={`Faster tiers were late more often, not less. ${ops.other_dimensions}`}
          footer={<SourceTag id={ops.shipping_mode_source} />}
        >
          <BarList
            caption="Late-delivery rate by shipping mode"
            items={ops.shipping_mode.map((m) => ({ label: m.mode, value: m.late_pct }))}
            max={100}
            format={(v) => `${v.toFixed(1)}%`}
            reference={{ value: ops.late_pct, label: `Overall late rate, ${ops.late_pct}%` }}
          />
        </Card>

        <Card
          eyebrow="Operations · Week 3"
          title="Most late orders miss by one or two days"
          description={`Delay in days, actual minus scheduled, as a share of all orders. The actual shipping days correlate with lateness at r ≈ ${ops.days_real_r.toFixed(2)}, and that column was later dropped as leakage.`}
          footer={
            <>
              <SourceTag id={ops.delay_source} />
              <SourceTag id={ops.source} />
            </>
          }
        >
          <ColumnChart
            caption="Distribution of shipping delays"
            xTitle="Delay (days, positive = late)"
            columns={ops.delay.map((d) => ({
              label: d.days > 0 ? `+${d.days}` : String(d.days),
              value: d.pct,
              series: d.days > 0 ? 1 : 0,
            }))}
            series={[
              { label: 'Early or on time', color: 'var(--series-1)' },
              { label: 'Late', color: 'var(--series-2)' },
            ]}
            format={(v) => `${v.toFixed(1)}%`}
          />
        </Card>
      </div>

      <div className={styles.twoCol}>
        <Card
          eyebrow="Financial · Week 3"
          title="Top correlates with bankruptcy"
          description="Pearson r with the Bankrupt? target. Profitability pulls risk down; leverage pushes it up."
          footer={<SourceTag id={fin.correlates_source} />}
        >
          <DivergingBars
            caption="Correlation with bankruptcy"
            items={fin.correlates.map((c) => ({ label: c.feature, value: c.r }))}
            limit={0.35}
            format={signed}
            negativeLabel="Lower risk (negative r)"
            positiveLabel="Higher risk (positive r)"
          />
        </Card>

        <Card
          eyebrow="Financial · Weeks 3–4"
          title={`${fin.sentinel.total} ratios held sentinel values in the billions`}
          description="Sentinel codes stood in for missing data, which is why the file first looked complete. The team tiered the columns by how many rows were affected."
          footer={
            <>
              <SourceTag id={fin.sentinel.source} />
              <SourceTag id={fin.sentinel.severe_source} />
            </>
          }
        >
          <dl className={styles.tiers}>
            <div>
              <dt>{fin.sentinel.minor} minor</dt>
              <dd>{fin.sentinel.minor_rule}</dd>
            </div>
            <div>
              <dt>1 borderline</dt>
              <dd>
                {fin.sentinel.borderline.feature}, {fin.sentinel.borderline.pct}% of rows; {fin.sentinel.borderline.treatment}
              </dd>
            </div>
            <div>
              <dt>{fin.sentinel.severe.length} severe</dt>
              <dd>{fin.sentinel.severe_rule}</dd>
            </div>
          </dl>
          <p className={styles.subhead}>Severe tier: share of rows affected</p>
          <BarList
            caption="Share of rows affected in the eight severe features"
            items={fin.sentinel.severe.map((s) => ({ label: s.feature, value: s.pct }))}
            max={100}
            format={(v) => `${v.toFixed(1)}%`}
          />
        </Card>
      </div>

      <div className={styles.twoCol}>
        <Card
          eyebrow="Assumption test · Week 3"
          title="GSCPI did not explain late deliveries"
          description="The team tested whether global supply-chain pressure tracks late-delivery rates before relying on it."
          footer={<SourceTag id={r.gscpi.source} />}
        >
          <dl className={styles.gscpi}>
            <div>
              <dt>Annual correlation</dt>
              <dd>
                <b className="num">r = {r.gscpi.annual_r.toFixed(2)}</b>
                <span>only {r.gscpi.annual_n} yearly observations</span>
              </dd>
            </div>
            <div>
              <dt>Monthly correlation</dt>
              <dd>
                <b className="num">r = {r.gscpi.monthly_r.toFixed(2)}</b>
                <span>{r.gscpi.monthly_n} aligned months</span>
              </dd>
            </div>
            <div>
              <dt>Monthly late rate</dt>
              <dd>
                <b className="num">
                  {r.gscpi.monthly_late_range[0]}–{r.gscpi.monthly_late_range[1]}%
                </b>
                <span>a narrow band</span>
              </dd>
            </div>
          </dl>
          <p className={styles.verdict}>
            <b>Verdict: not supported.</b> {r.gscpi.bankruptcy_note}
          </p>
        </Card>

        <Card
          eyebrow="Anomaly component · Week 4"
          title="DBSCAN flagged a handful of unusual orders"
          description={`Density-based clustering on ${r.dbscan.features.length} order-value features, alongside the two classifiers.`}
          footer={<SourceTag id={r.dbscan.source} />}
        >
          <dl className={styles.dbscan}>
            <div>
              <dt>Clusters</dt>
              <dd className="num">{r.dbscan.clusters}</dd>
            </div>
            <div>
              <dt>Noise (anomalous) transactions</dt>
              <dd className="num">{r.dbscan.noise}</dd>
            </div>
          </dl>
          <p className={styles.subhead}>Features</p>
          <ul className={styles.chips} role="list">
            {r.dbscan.features.map((f) => (
              <li key={f}>
                <code>{f}</code>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card
        eyebrow="Preparation · Weeks 4–6"
        title="Cleaning and leakage decisions"
        footer={
          <>
            <SourceTag id={ops.leakage_source} />
            <SourceTag id={ops.order_status.source} />
            <SourceTag id={fin.engineered_source} />
            <SourceTag id={fin.removed_source} />
          </>
        }
      >
        <div className={styles.prep}>
          <section aria-labelledby="prep-ops">
            <h3 id="prep-ops" className={styles.prepTitle}>Operations</h3>
            <ul role="list">
              <li>
                Dropped the leakage columns {ops.leakage_columns.join(', ')}: each reveals the delivery outcome.
              </li>
              <li>
                In Week 6 the team found that Order Status also leaked: {ops.order_status.zero_late.join(' and ')} orders
                had a 0% late rate because they never shipped. All {ops.order_status.columns_removed} Order Status
                columns were removed, leaving {ops.order_status.features_after} features.
              </li>
            </ul>
          </section>
          <section aria-labelledby="prep-fin">
            <h3 id="prep-fin" className={styles.prepTitle}>Financial</h3>
            <ul role="list">
              {fin.engineered.map((e) => (
                <li key={e.feature}>
                  <code>{e.feature}</code>: {e.formula}.
                </li>
              ))}
              <li>
                <code>{fin.removed_feature.feature}</code>: {fin.removed_feature.why}
              </li>
              <li>Final financial feature count: {fin.final_features}.</li>
            </ul>
          </section>
        </div>
      </Card>
    </div>
  )
}
