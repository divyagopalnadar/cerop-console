import type { Confusion } from '../data'
import { int } from '../lib/format'
import styles from './ConfusionMatrix.module.css'

interface ConfusionMatrixProps {
  cm: Confusion
  negative: string
  positive: string
  caption: string
}

/**
 * 2x2 confusion matrix as a real table of the documented counts. Cell shading
 * is a single-hue ramp by the cell's share of its actual row; it only encodes
 * the printed counts, and no computed rate is shown.
 */
export function ConfusionMatrix({ cm, negative, positive, caption }: ConfusionMatrixProps) {
  const rows = [
    { actual: negative, cells: [cm.tn, cm.fp], kinds: ['Correctly cleared (TN)', 'False alarm (FP)'] },
    { actual: positive, cells: [cm.fn, cm.tp], kinds: ['Missed (FN)', 'Caught (TP)'] },
  ]
  return (
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
        {rows.map((row) => {
          const total = row.cells[0]! + row.cells[1]!
          return (
            <tr key={row.actual}>
              <th scope="row">{row.actual}</th>
              {row.cells.map((count, i) => (
                <td key={i} className={styles.cell} style={{ ['--share' as string]: (total ? count / total : 0).toFixed(3) }}>
                  <span className={styles.kind}>{row.kinds[i]}</span>
                  <span className={styles.count}>{int(count)}</span>
                </td>
              ))}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
