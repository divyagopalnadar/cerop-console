import { sourceById, type SourceId } from '../data'
import { buildHash } from '../lib/routes'
import styles from './SourceTag.module.css'

const SHORT: Record<string, string> = {
  'AIT506_Week5_Operational_Model_Selection.ipynb': 'W5 ops selection',
  'AIT506_Week6_Operations_Model_Tuning.ipynb': 'W6 ops tuning',
  'Week4_CEROP_Pipeline_Integration_FIXED_v3.ipynb': 'W4 pipeline',
  'WEEK_4_—_Financial_Layer_Cleaning_(Taiwan_Bankruptcy_Dataset).ipynb': 'W4 fin cleaning',
  '[AIT506] Group 4 - CEROP.pdf': 'Group 4 report',
  'week6_operations_results/week6_operations_threshold_results.csv': 'W6 sweep CSV',
}

export function shortSource(file: string): string {
  return SHORT[file] ?? file
}

/** Compact provenance chip linking to the source's row in the lineage table. */
export function SourceTag({ id }: { id: SourceId }) {
  const src = sourceById.get(id)
  if (!src) throw new Error(`Unknown source id: ${id}`)
  const where = src.location
    .replace(/ \(In \[\d+\]\)/, '')
    .replace(/^written by .*?(cell \d+).*$/, 'saved by $1')
    .replace(/^.*\((pp?\. [\d-]+)\).*$/, '$1')
  return (
    <a
      className={styles.tag}
      href={buildHash('lineage', { src: id })}
      title={`${src.file} · ${src.location}\n${src.note}`}
      aria-label={`Source: ${src.file}, ${src.location}`}
    >
      <span className={styles.file}>{shortSource(src.file)}</span>
      <span className={styles.loc}>{where}</span>
    </a>
  )
}
