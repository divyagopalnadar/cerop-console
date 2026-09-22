import { useState, type PointerEvent } from 'react'
import type { SweepRow } from '../data'
import { useElementWidth } from '../hooks/useElementWidth'
import { dec, thr } from '../lib/format'
import { nearestRow } from '../lib/metrics'
import styles from './SweepChart.module.css'

const SERIES = [
  { key: 'precision', label: 'Precision', color: 'var(--series-1)' },
  { key: 'recall', label: 'Recall', color: 'var(--series-2)' },
  { key: 'f1', label: 'F1', color: 'var(--series-3)' },
] as const

interface SweepChartProps {
  sweep: readonly SweepRow[]
  value: number
  chosen: number
  onSelect: (threshold: number) => void
}

const M = { top: 22, right: 70, bottom: 34, left: 40 }

/**
 * Precision, recall and F1 across the validation threshold sweep. One shared
 * 0-1 axis, 2px lines, a crosshair that snaps to the nearest sweep step, and
 * reference rules for the default (0.50) and chosen cutoffs. The slider next to
 * the chart is the keyboard control; the table view carries every value.
 */
export function SweepChart({ sweep, value, chosen, onSelect }: SweepChartProps) {
  const { ref, width } = useElementWidth<HTMLDivElement>()
  const [hover, setHover] = useState<SweepRow | null>(null)
  const height = width < 480 ? 230 : 280
  const first = sweep[0]
  const last = sweep[sweep.length - 1]
  if (!first || !last) return null
  const x0 = first.threshold
  const x1 = last.threshold
  const iw = width - M.left - M.right
  const ih = height - M.top - M.bottom
  const x = (t: number) => M.left + ((t - x0) / (x1 - x0)) * iw
  const y = (v: number) => M.top + (1 - v) * ih

  const path = (key: (typeof SERIES)[number]['key']) =>
    sweep.map((r, i) => `${i ? 'L' : 'M'}${x(r.threshold).toFixed(1)},${y(r[key]).toFixed(1)}`).join('')

  const current = nearestRow(sweep, value)
  const onMove = (e: PointerEvent<SVGRectElement>) => {
    const box = e.currentTarget.getBoundingClientRect()
    const t = x0 + ((e.clientX - box.left) / box.width) * (x1 - x0)
    setHover(nearestRow(sweep, t))
  }

  const xTicks = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].filter((_, i) => width >= 480 || i % 2 === 0)
  const refs = [
    { t: 0.5, label: 'default 0.50' },
    { t: chosen, label: `chosen ${thr(chosen)}` },
  ]

  // End labels: sort by value and keep them at least 14px apart.
  const ends = SERIES.map((s) => ({ ...s, y: y(last[s.key]) })).sort((a, b) => a.y - b.y)
  for (let i = 1; i < ends.length; i++) {
    const prev = ends[i - 1]
    const cur = ends[i]
    if (prev && cur && cur.y - prev.y < 14) cur.y = prev.y + 14
  }

  const tip = hover
  const tipLeft = tip ? Math.min(Math.max(x(tip.threshold) + 12, 8), width - 160) : 0

  return (
    <div className={styles.wrap}>
      <ul className={styles.legend} aria-label="Series">
        {SERIES.map((s) => (
          <li key={s.key}>
            <span className={styles.key} style={{ background: s.color }} aria-hidden="true" />
            {s.label}
          </li>
        ))}
        <li className={styles.legendRef}>
          <span className={styles.refKey} aria-hidden="true" />
          Selected threshold
        </li>
      </ul>
      <div ref={ref} className={styles.plot}>
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={`Validation precision, recall and F1 for thresholds ${thr(x0)} to ${thr(x1)}. At ${thr(current.threshold)}: precision ${dec(current.precision)}, recall ${dec(current.recall)}, F1 ${dec(current.f1)}.`}
        >
          {[0, 0.25, 0.5, 0.75, 1].map((v) => (
            <g key={v}>
              <line className={v === 0 ? styles.baseline : styles.grid} x1={M.left} x2={M.left + iw} y1={y(v)} y2={y(v)} />
              <text className={styles.tick} x={M.left - 8} y={y(v)} dy="0.32em" textAnchor="end">
                {v === 0 ? '0' : v.toFixed(2)}
              </text>
            </g>
          ))}
          {xTicks.map((t) => (
            <text key={t} className={styles.tick} x={x(t)} y={M.top + ih + 20} textAnchor="middle">
              {t.toFixed(1)}
            </text>
          ))}
          <text className={styles.axisLabel} x={M.left + iw} y={height - 2} textAnchor="end">
            decision threshold →
          </text>

          {refs.map((r) => (
            <g key={r.label}>
              <line className={styles.refLine} x1={x(r.t)} x2={x(r.t)} y1={M.top} y2={M.top + ih} />
              <text
                className={styles.refLabel}
                x={x(r.t)}
                y={M.top - 8}
                textAnchor={r.t === chosen ? 'end' : 'start'}
                dx={r.t === chosen ? -3 : 3}
              >
                {r.label}
              </text>
            </g>
          ))}

          {SERIES.map((s) => (
            <path key={s.key} d={path(s.key)} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          ))}

          {ends.map((s) => (
            <text key={s.key} className={styles.endLabel} x={M.left + iw + 8} y={s.y} dy="0.32em">
              {s.label}
            </text>
          ))}

          <line className={styles.current} x1={x(current.threshold)} x2={x(current.threshold)} y1={M.top} y2={M.top + ih} />
          {SERIES.map((s) => (
            <circle
              key={s.key}
              cx={x(current.threshold)}
              cy={y(current[s.key])}
              r={4.5}
              fill={s.color}
              stroke="var(--surface)"
              strokeWidth={2}
            />
          ))}

          {hover && hover.threshold !== current.threshold && (
            <line className={styles.crosshair} x1={x(hover.threshold)} x2={x(hover.threshold)} y1={M.top} y2={M.top + ih} />
          )}

          <rect
            className={styles.hit}
            x={M.left}
            y={M.top}
            width={iw}
            height={ih}
            onPointerMove={onMove}
            onPointerDown={onMove}
            onPointerLeave={() => setHover(null)}
            onClick={() => hover && onSelect(hover.threshold)}
          />
        </svg>
        {tip && (
          <div className={styles.tooltip} style={{ left: tipLeft, top: M.top }} aria-hidden="true">
            <p className={styles.tipTitle}>Threshold {thr(tip.threshold)}</p>
            {SERIES.map((s) => (
              <p key={s.key} className={styles.tipRow}>
                <span className={styles.tipKey} style={{ background: s.color }} />
                <b>{dec(tip[s.key])}</b>
                <span>{s.label}</span>
              </p>
            ))}
            <p className={styles.tipHint}>Click to select</p>
          </div>
        )}
      </div>
    </div>
  )
}
