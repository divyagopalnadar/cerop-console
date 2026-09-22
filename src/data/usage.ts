import type { SourceId } from './index'

/**
 * Where each source's figures appear in the console. Kept next to the data so
 * the lineage table can answer "what did this cell feed?" A test asserts that
 * every extracted source is listed here and every key is a real source.
 */
export const USAGE: Record<SourceId, string[]> = {
  'fin-w4-shape': ['Financial: 6,819 firms, 95 ratios', 'Overview: dataset table'],
  'fin-w4-groups': ['Financial: 16 capped, 8 dropped columns'],
  'pipeline-fin-split': ['Financial: 5,455 / 1,364 split, 85 features', 'Financial: duplicate-pair check'],
  'pipeline-fin-functions': ['Financial: ROA composite and leverage feature'],
  'deck-pca-s1': ['Financial and Overview: 3.23% bankrupt'],
  'deck-final-s1': ['Methodology: team roster'],
  'deck-final-s3': ['Methodology: shared protocol'],
  'deck-final-s5': ['Financial: XGBoost F1 and recall, chosen strategy'],
  'deck-final-s6': ['Overview and Case queue: cross-layer playbook'],
  'deck-final-s7': ['Financial: PR-AUC, 25 of 44 caught', 'Overview: headline'],
  'deck-activity-s2': ['Overview: why the layers are separate'],
  'derived-fin-cm': ['Financial: reconstructed confusion matrix'],
  'pipeline-gscpi': ['Overview: GSCPI joins operations only'],
  'pipeline-ops-rows': ['Overview: 180,519 → 171,962 orders'],
  'ops-w5-shapes': ['Operations: 35 features before the leak fix'],
  'ops-w5-balance': ['Overview: class counts, majority baseline'],
  'ops-w5-comparison': ['Operations: Week 5 shortlist'],
  'ops-w5-confusion': ['Operations: Week 5 confusion counts (tests)'],
  'ops-w5-cv': ['Operations: 5-fold CV F1'],
  'ops-w5-rbf': ['Operations: RBF SVM check'],
  'ops-w5-importance': ['Operations: feature importance'],
  'ops-w6-shapes': ['Operations: 27 features, 54.82% late, split sizes'],
  'ops-w6-validation': ['Operations: 27,514-order validation split'],
  'ops-w6-search': ['Operations: RandomizedSearchCV settings and best params'],
  'ops-w6-threshold': ['Operations: chosen threshold 0.39, top five'],
  'ops-w6-sweep-csv': ['Operations: threshold explorer (81 rows)'],
  'ops-w6-test': ['Operations: final test table and confusion matrices', 'Overview: headline'],
}
