/**
 * Typed access to the figures extracted from the team's executed notebooks and
 * decks by scripts/extract_data.py. Nothing in this folder is hand-entered
 * except the illustrative case queue (cases.ts), which is labelled as such.
 *
 * Every record carries a `source` id that resolves through `sourceById`.
 */
import crossLayerJson from './crossLayer.json'
import financialJson from './financial.json'
import operationsJson from './operations.json'
import sourcesJson from './sources.json'

export type SourceId = string

export interface Source {
  id: SourceId
  file: string
  location: string
  note: string
}

export interface Confusion {
  tn: number
  fp: number
  fn: number
  tp: number
  source?: SourceId
}

export interface ClassifierMetrics {
  model: string
  accuracy: number
  precision: number
  recall: number
  f1: number
  roc_auc: number
  pr_auc: number
  confusion: Confusion
  source: SourceId
}

export interface Week5Model extends ClassifierMetrics {
  cv: {
    accuracy_mean: number
    accuracy_sd: number
    f1_mean: number
    f1_sd: number
    source: SourceId
  }
}

export interface FinalTestRow extends ClassifierMetrics {
  threshold: number
}

export interface SweepRow {
  threshold: number
  precision: number
  recall: number
  f1: number
}

export interface OperationsData {
  dataset: {
    train_rows: number
    test_rows: number
    features: number
    late_rate: number
    dev_rows: number
    validation_rows: number
    source: SourceId
    validation_source: SourceId
    class_counts: {
      train_on_time: number
      train_late: number
      test_on_time: number
      test_late: number
      source: SourceId
    }
    raw_rows: { original: number; after_artifact_removal: number; removed: number; source: SourceId }
    features_before_leak_fix: number
    features_before_leak_fix_source: SourceId
  }
  majority_baseline_accuracy: number
  week5_models: Week5Model[]
  week5_rbf: {
    model: string
    train_rows: number
    accuracy: number
    precision: number
    recall: number
    f1: number
    source: SourceId
  }
  feature_importance: {
    items: { feature: string; group: string; importance: number }[]
    source: SourceId
  }
  tuning: {
    search_rows: number
    folds: number
    candidates: number
    best_cv_f1: number
    best_params: Record<string, string>
    source: SourceId
  }
  threshold: {
    selected: number
    top5: SweepRow[]
    source: SourceId
    sweep: SweepRow[]
    sweep_source: SourceId
    validation_positives: number
    validation_positives_note: string
  }
  final_test: FinalTestRow[]
}

export interface FinancialData {
  dataset: {
    rows: number
    columns: number
    features: number
    positive_share: number
    source: SourceId
    positive_share_source: SourceId
  }
  cleaning: {
    minor_capped: number
    capped_total: number
    severe_dropped: number
    duplicate_dropped: number
    source: SourceId
  }
  split: {
    train_rows: number
    test_rows: number
    features: number
    duplicate_pair_max_diff: number
    source: SourceId
  }
  result: {
    model: string
    test_f1: number
    test_recall: number
    pr_auc: number
    caught: number
    test_positives: number
    challenge: string
    strategy: string
    source: SourceId
    detail_source: SourceId
  }
  derived_confusion: Confusion & { source: SourceId }
  team: { members: string[]; source: SourceId }
}

export interface CrossLayerData {
  separation: {
    separate: string
    imbalance: string
    gscpi: string
    source: SourceId
    gscpi_source: SourceId
    engineering_source: SourceId
  }
  playbook: { label: string; action: string }[]
  playbook_source: SourceId
  protocol: { step: string; detail: string }[]
  protocol_source: SourceId
}

export const operations: OperationsData = operationsJson
export const financial: FinancialData = financialJson
export const crossLayer: CrossLayerData = crossLayerJson
export const sources: Source[] = sourcesJson

export const sourceById: ReadonlyMap<SourceId, Source> = new Map(sources.map((s) => [s.id, s]))

/** The chosen operations configuration: tuned Random Forest at the calibrated threshold. */
export const chosenOps: FinalTestRow = (() => {
  const row = operations.final_test.find((r) => r.threshold === operations.threshold.selected)
  if (!row) throw new Error('Calibrated operations result missing from data')
  return row
})()

/** Figures a console like this would normally show that the available executed outputs do not contain. */
export const notInRecord: { item: string; why: string }[] = [
  {
    item: 'Financial model comparison (XGBoost vs. Logistic Regression and others)',
    why: 'No executed financial model-selection notebook was in the source set; only the final XGBoost result appears (team deck).',
  },
  {
    item: 'Financial tuned vs. untuned metrics, and metrics at equal recall',
    why: 'The final deck records that the team kept the baseline model, but the tuned numbers themselves were not in the materials.',
  },
  {
    item: 'Financial decision threshold and validation sweep',
    why: 'Not printed in any available output.',
  },
  {
    item: 'Per-case held-out predictions',
    why: 'No notebook prints individual predictions, so the case queue is illustrative.',
  },
  {
    item: 'Operations feature importances for the corrected (27-feature) model',
    why: 'Importances were only printed for the Week 5 model, before the leakage fix.',
  },
]
