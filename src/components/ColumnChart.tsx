import { useElementWidth } from '../hooks/useElementWidth'
import styles from './ColumnChart.module.css'

export interface Column {
  label: string
  value: number
  /** Index into `series`; colour follows the series, never the rank. */
  series: number
}

interface ColumnChartProps {
  columns: readonly Column[]
  series: readonly { label: string; color: string }[]
  format: (v: number) => string
  caption: string
  xTitle: string
}

const M = { top: 22, right: 8, bottom: 40, left: 8 }

/**
 * Vertical columns from one baseline: bars ≤ 24px wide with 4px rounded caps,
 * every value labelled on its cap (so there is nothing hover-only), a legend
 * for the series, and a visually hidden table twin for screen readers.
 */
export function ColumnChart({ columns, series, format, caption, xTitle }: ColumnChartProps) {
  const { ref, width } = useElementWidth<HTMLDivElement>()
  const height = 220
  const iw = width - M.left - M.right
  const ih = height - M.top - M.bottom
  const max = Math.max(...columns.map((c) => c.value))
  const band = iw / columns.length
  const bw = Math.min(24 * 1.6, band * 0.56)
  return (
    <figure className={styles.figure}>
      {series.length > 1 && (
        <ul className={styles.legend} aria-hidden="true">
          {series.map((s) => (
            <li key={s.label}>
              <span className={styles.swatch} style={{ background: s.color }} />
              {s.label}
            </li>
          ))}
        </ul>
      )}
      <div ref={ref} className={styles.plot}>
        <svg width={width} height={height} aria-hidden="true">
          <line className={styles.baseline} x1={M.left} x2={M.left + iw} y1={M.top + ih} y2={M.top + ih} />
          {columns.map((c, i) => {
            const h = (c.value / max) * ih
            const x = M.left + band * i + (band - bw) / 2
            const y = M.top + ih - h
            const r = Math.min(4, h / 2)
            const color = series[c.series]?.color ?? 'var(--series-1)'
            return (
              <g key={c.label}>
                <path
                  d={`M${x},${M.top + ih} V${y + r} Q${x},${y} ${x + r},${y} H${x + bw - r} Q${x + bw},${y} ${x + bw},${y + r} V${M.top + ih} Z`}
                  fill={color}
                />
                <text className={styles.value} x={x + bw / 2} y={y - 6} textAnchor="middle">
                  {format(c.value)}
                </text>
                <text className={styles.tick} x={x + bw / 2} y={M.top + ih + 18} textAnchor="middle">
                  {c.label}
                </text>
              </g>
            )
          })}
          <text className={styles.axisTitle} x={M.left + iw / 2} y={height - 4} textAnchor="middle">
            {xTitle}
          </text>
        </svg>
      </div>
      <table className="visually-hidden">
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">{xTitle}</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          {columns.map((c) => (
            <tr key={c.label}>
              <th scope="row">{c.label}</th>
              <td>{format(c.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
