import styles from './DivergingBars.module.css'

interface DivergingBarsProps {
  items: readonly { label: string; value: number }[]
  /** Symmetric scale limit, e.g. 0.4 for correlations. */
  limit: number
  format: (v: number) => string
  caption: string
  negativeLabel: string
  positiveLabel: string
}

/**
 * Bars that grow left or right from a shared zero rule. Two opposite hues
 * (cool for negative, warm for positive), each value printed at its tip, and a
 * legend naming what each direction means.
 */
export function DivergingBars({ items, limit, format, caption, negativeLabel, positiveLabel }: DivergingBarsProps) {
  return (
    <div className={styles.wrap}>
      <ul className={styles.legend} aria-hidden="true">
        <li>
          <span className={styles.swatch} data-sign="neg" /> {negativeLabel}
        </li>
        <li>
          <span className={styles.swatch} data-sign="pos" /> {positiveLabel}
        </li>
      </ul>
      <ol className={styles.list} aria-label={caption}>
        {items.map((item) => {
          // Bars use at most 34% of each half, leaving room for the value label outside the tip.
          const pct = (Math.abs(item.value) / limit) * 34
          const neg = item.value < 0
          return (
            <li key={item.label} className={styles.item}>
              <span className={styles.label} title={item.label}>
                {item.label}
              </span>
              <span className={styles.track}>
                <span className={styles.zero} aria-hidden="true" />
                <span
                  className={styles.bar}
                  data-sign={neg ? 'neg' : 'pos'}
                  style={neg ? { right: '50%', width: `${pct}%` } : { left: '50%', width: `${pct}%` }}
                />
                <span
                  className={styles.value}
                  style={neg ? { right: `calc(50% + ${pct}% + 6px)` } : { left: `calc(50% + ${pct}% + 6px)` }}
                >
                  {format(item.value)}
                </span>
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
