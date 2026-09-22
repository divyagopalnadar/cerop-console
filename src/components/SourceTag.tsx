import { sourceById, type SourceId } from '../data'
import { buildHash } from '../lib/routes'
import styles from './SourceTag.module.css'

const SHORT: Record<string, string> = {
  'AIT506_Week5_Operational_Model_Selection.ipynb': 'W5 ops selection',
  'AIT506_Week6_Operations_Model_Tuning.ipynb': 'W6 ops tuning',
  'Week4_CEROP_Pipeline_Integration_FIXED_v3.ipynb': 'W4 pipeline',
  'WEEK_4_—_Financial_Layer_Cleaning_(Taiwan_Bankruptcy_Dataset).ipynb': 'W4 fin cleaning',
  'CEROP_Unified_Risk_Intelligence.pptx': 'Final deck',
  'CEROP_PCA_Class_Activity.pptx': 'PCA deck',
  'CEROP_Class_Activity_5_Slides_Final.pptx': 'Scoping deck',
  'week6_operations_results/week6_operations_threshold_results.csv': 'W6 sweep CSV',
  derived: 'Derived',
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
    .replace(/^from .*/, 'calc')
  return (
    <a
      className={styles.tag}
      href={buildHash('lineage', { src: id })}
      title={`${src.file} · ${src.location}\n${src.note}`}
      aria-label={`Source: ${src.file}, ${src.location}`}
      data-derived={src.file === 'derived' || undefined}
    >
      <span className={styles.file}>{shortSource(src.file)}</span>
      <span className={styles.loc}>{where}</span>
    </a>
  )
}
