import type { ReactNode } from 'react'
import type { SourceId } from '../data'
import { SourceTag } from './SourceTag'
import styles from './StatTile.module.css'

interface StatTileProps {
  label: string
  value: ReactNode
  sub?: ReactNode
  source?: SourceId
  tone?: 'default' | 'accent'
}

export function StatTile({ label, value, sub, source, tone = 'default' }: StatTileProps) {
  return (
    <div className={styles.tile} data-tone={tone}>
      <dt className={styles.label}>{label}</dt>
      <dd className={styles.value}>{value}</dd>
      {sub && <dd className={styles.sub}>{sub}</dd>}
      {source && (
        <dd className={styles.source}>
          <SourceTag id={source} />
        </dd>
      )}
    </div>
  )
}

export function StatGrid({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <dl className={styles.grid} aria-label={label}>
      {children}
    </dl>
  )
}
