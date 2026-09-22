import type { Outcomes } from '../lib/metrics'
import { int } from '../lib/format'
import styles from './OutcomeBars.module.css'

/**
 * What a cutoff does to 1,000 orders, split by what actually happened.
 * Colour marks only what the model flagged; the unflagged remainder is neutral.
 */
export function OutcomeBars({ o, volume = 1000 }: { o: Outcomes; volume?: number }) {
  const late = o.caught + o.missed
  const onTime = o.falseAlarms + o.cleared
  const rows = [
    {
      label: 'Actually late',
      total: late,
      flagged: { n: o.caught, name: 'caught', color: 'var(--series-1)' },
      rest: { n: o.missed, name: 'missed' },
    },
    {
      label: 'Actually on time',
      total: onTime,
      flagged: { n: o.falseAlarms, name: 'false alarms', color: 'var(--series-2)' },
      rest: { n: o.cleared, name: 'correctly cleared' },
    },
  ]
  return (
    <div className={styles.wrap}>
      {rows.map((r) => (
        <div key={r.label} className={styles.row}>
          <p className={styles.rowLabel}>
            {r.label} <span className="num">{int(r.total)}</span>
          </p>
          <div className={styles.bar} aria-hidden="true">
            <span
              className={styles.seg}
              style={{ flexGrow: r.flagged.n, background: r.flagged.color }}
            />
            <span className={styles.seg} data-rest style={{ flexGrow: r.rest.n }} />
          </div>
          <p className={styles.parts}>
            <span>
              <span className={styles.swatch} style={{ background: r.flagged.color }} aria-hidden="true" />
              <b className="num">{int(r.flagged.n)}</b> {r.flagged.name}
            </span>
            <span>
              <span className={styles.swatch} data-rest aria-hidden="true" />
              <b className="num">{int(r.rest.n)}</b> {r.rest.name}
            </span>
          </p>
        </div>
      ))}
      <p className="visually-hidden">
        Out of {volume} orders: {o.caught} late orders caught, {o.missed} missed, {o.falseAlarms} false alarms,{' '}
        {o.cleared} on-time orders correctly cleared.
      </p>
    </div>
  )
}
