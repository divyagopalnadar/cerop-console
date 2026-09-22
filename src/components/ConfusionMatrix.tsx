import type { Confusion } from '../data'
import { int, pct } from '../lib/format'
import { fromConfusion } from '../lib/metrics'
import styles from './ConfusionMatrix.module.css'

interface ConfusionMatrixProps {
  cm: Confusion
  negative: string
  positive: string
  caption: string
}

/**
 * 2x2 confusion matrix as a real table. Each cell is shaded by its share of the
 * actual row (a single-hue sequential ramp), and every count and rate is printed,
 * so colour never carries a value on its own.
 */
export function ConfusionMatrix({ cm, negative, positive, caption }: ConfusionMatrixProps) {
  const m = fromConfusion(cm)
  const rows = [
    { actual: negative, cells: [cm.tn, cm.fp], total: cm.tn + cm.fp, kinds: ['Correctly cleared', 'False alarm'] },
    { actual: positive, cells: [cm.fn, cm.tp], total: cm.fn + cm.tp, kinds: ['Missed', 'Caught'] },
  ]
  return (
    <figure className={styles.figure}>
      <table className={styles.table}>
        <caption className="visually-hidden">{caption}</caption>
        <thead>
          <tr>
            <td className={styles.corner}>
              <span className={styles.axisY}>Actual</span>
              <span className={styles.axisX}>Predicted</span>
            </td>
            <th scope="col">{negative}</th>
            <th scope="col">{positive}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.actual}>
              <th scope="row">{row.actual}</th>
              {row.cells.map((count, i) => {
                const share = row.total === 0 ? 0 : count / row.total
                const correct = (row.actual === negative) === (i === 0)
                return (
                  <td
                    key={i}
                    className={styles.cell}
                    data-correct={correct}
                    style={{ ['--share' as string]: share.toFixed(3) }}
                  >
                    <span className={styles.kind}>{row.kinds[i]}</span>
                    <span className={styles.count}>{int(count)}</span>
                    <span className={styles.rate}>
                      {pct(share)} of {row.actual.toLowerCase()}
                    </span>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <figcaption className={styles.summary}>
        <span>
          n = <b className="num">{int(m.total)}</b>
        </span>
        <span>
          Precision <b className="num">{pct(m.precision)}</b>
        </span>
        <span>
          Recall <b className="num">{pct(m.recall)}</b>
        </span>
        <span>
          F1 <b className="num">{m.f1.toFixed(3)}</b>
        </span>
      </figcaption>
    </figure>
  )
}
