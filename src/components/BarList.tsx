import styles from './BarList.module.css'

interface BarListProps {
  items: readonly { label: string; value: number; hint?: string }[]
  format: (v: number) => string
  caption: string
}

/** Single-series horizontal bars with the value at each tip; a list, so it reads without the chart. */
export function BarList({ items, format, caption }: BarListProps) {
  const max = Math.max(...items.map((i) => i.value))
  return (
    <ol className={styles.list} aria-label={caption}>
      {items.map((item) => (
        <li key={item.label} className={styles.item}>
          <span className={styles.label}>
            {item.label}
            {item.hint && <span className={styles.hint}>{item.hint}</span>}
          </span>
          <span className={styles.track}>
            <span className={styles.bar} style={{ width: `${(item.value / max) * 100}%` }} />
            <span className={styles.value}>{format(item.value)}</span>
          </span>
        </li>
      ))}
    </ol>
  )
}
