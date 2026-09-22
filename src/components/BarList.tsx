import styles from './BarList.module.css'

interface BarListProps {
  items: readonly { label: string; value: number; hint?: string; emphasis?: boolean }[]
  format: (v: number) => string
  caption: string
  /** Scale maximum; defaults to the largest value. */
  max?: number
  /** Optional reference rule, e.g. the overall rate. */
  reference?: { value: number; label: string }
}

/** Single-series horizontal bars with the value at each tip; a list, so it reads without the chart. */
export function BarList({ items, format, caption, max, reference }: BarListProps) {
  const top = max ?? Math.max(...items.map((i) => i.value))
  return (
    <div className={styles.wrap}>
      <ol className={styles.list} aria-label={caption}>
        {items.map((item) => (
          <li key={item.label} className={styles.item} data-emphasis={item.emphasis || undefined}>
            <span className={styles.label}>
              {item.label}
              {item.hint && <span className={styles.hint}>{item.hint}</span>}
            </span>
            <span className={styles.track}>
              <span className={styles.bar} style={{ width: `${(item.value / top) * 100}%` }} />
              <span className={styles.value}>{format(item.value)}</span>
              {reference && (
                <span className={styles.ref} style={{ left: `calc((100% - 48px) * ${reference.value / top})` }} aria-hidden="true" />
              )}
            </span>
          </li>
        ))}
      </ol>
      {reference && (
        <p className={styles.refNote}>
          <span className={styles.refKey} aria-hidden="true" /> {reference.label}
        </p>
      )}
    </div>
  )
}
