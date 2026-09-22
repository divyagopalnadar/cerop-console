/**
 * Typed access to the figures extracted from the team's executed notebooks and
 * the Group 4 report by scripts/extract_data.py and scripts/report_facts.py.
 * Report values are re-verified against the report's PDF text on extraction.
 *
 * Every record carries a `source` id that resolves through `sourceById`.
 */
import crossLayerJson from './crossLayer.json'
import financialJson from './financial.json'
import operationsJson from './operations.json'
import reportJson from './report.json'
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
  }
  final_test: FinalTestRow[]
}

export interface FinancialData {
  dataset: { rows: number; columns: number; features: number; source: SourceId }
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
}

export interface CrossLayerData {
  separation: { gscpi: string; gscpi_source: SourceId; engineering_source: SourceId }
}

export interface Matrix {
  label: string
  threshold: number
  tn: number
  fp: number
  fn: number
  tp: number
}

export interface FinTestRow {
  row: string
  group: string
  threshold: number
  precision: number
  recall: number
  f1: number
  roc_auc: number
  pr_auc: number
  caught: number
  deployed?: boolean
}

export interface ReportData {
  project: {
    name: string
    group: string
    course: string
    university: string
    instructor: string
    term: string
    team: { name: string; role: string }[]
    source: SourceId
    roles_source: SourceId
  }
  financial_eda: {
    rows: number
    bankrupt: number
    healthy: number
    bankrupt_pct: number
    features: number
    source: SourceId
    correlates: { feature: string; r: number }[]
    correlates_source: SourceId
    sentinel: {
      total: number
      minor: number
      minor_rule: string
      borderline: { feature: string; pct: number; treatment: string }
      severe_rule: string
      severe: { feature: string; pct: number }[]
      source: SourceId
      severe_source: SourceId
    }
    engineered: { feature: string; formula: string }[]
    removed_feature: { feature: string; why: string }
    final_features: number
    engineered_source: SourceId
    removed_source: SourceId
    class_ratio: number
    class_ratio_source: SourceId
  }
  operations_eda: {
    rows: number
    features: number
    late_pct: number
    days_real_r: number
    source: SourceId
    shipping_mode: { mode: string; late_pct: number }[]
    other_dimensions: string
    shipping_mode_source: SourceId
    delay: { days: number; pct: number }[]
    delay_source: SourceId
    leakage_columns: string[]
    leakage_source: SourceId
    order_status: { columns_removed: number; zero_late: string[]; features_after: number; source: SourceId }
    after_artifact: number
    integration_source: SourceId
  }
  gscpi: {
    coverage: string
    records: number
    annual_r: number
    annual_n: number
    monthly_r: number
    monthly_n: number
    monthly_late_range: number[]
    supported: boolean
    bankruptcy_note: string
    source: SourceId
    records_source: SourceId
  }
  dbscan: { features: string[]; clusters: number; noise: number; source: SourceId }
  financial_w5: {
    n: number
    positives: number
    models: { model: string; accuracy: number; precision: number; recall: number; f1: number; roc_auc: number }[]
    equal_recall: { recall: number; caught: number; xgb_false_alarms: number; lr_false_alarms: number; fewer_pct: number }
    decision: string
    firm_recall_points: number
    source: SourceId
    decision_source: SourceId
  }
  operations_w5: { rf_cv_f1: number; rf_cv_sd: number; source: SourceId }
  financial_w6: {
    partition: { split: string; rows: number; bankrupt: number; use: string }[]
    search: { draws: number; folds: number; fits: number; scoring: string; space: number; coverage_pct: number }
    source: SourceId
    cv: { model: string; pr_auc: number; sd: number | null }[]
    params: { param: string; tuned: string; week5: string }[]
    cv_source: SourceId
    test: FinTestRow[]
    test_source: SourceId
    false_alarms: { rf_tuned: number; xgb_tuned_recall80: number }
    false_alarms_source: SourceId
    recall80_source: SourceId
    matrices: Matrix[]
    matrices_source: SourceId
    why: {
      spread: number
      fold_sd: number
      snr: number
      all_within_1sd: boolean
      positives_per_fold: number
      spw_cap: number
      class_ratio: number
      rerun_spw: number
      rerun_val_pr_auc: number
      baseline_val_pr_auc: number
      winner_val_pr_auc: number
    }
    why_source: SourceId
    bootstrap: { resamples: number; delta: number; ci: number[]; tuned_wins_pct: number; firms: number; of: number }
    bootstrap_source: SourceId
    decision: string
  }
  operations_w6: {
    validation_f1: number
    validation_precision: number
    validation_recall: number
    source: SourceId
    more_flagged: string
    more_flagged_source: SourceId
  }
  separation: { shared: string; source: SourceId; merge: string; merge_source: SourceId }
  protocol: { steps: { step: string; detail: string }[]; source: SourceId }
  deployment: { financial: string; operations: string; presentation: string; source: SourceId }
  timeline: { week: number; title: string; points: string[]; source: SourceId }[]
}

export const operations: OperationsData = operationsJson
export const financial: FinancialData = financialJson
export const crossLayer: CrossLayerData = crossLayerJson
export const report: ReportData = reportJson
export const sources: Source[] = sourcesJson

export const sourceById: ReadonlyMap<SourceId, Source> = new Map(sources.map((s) => [s.id, s]))

/** The deployed operations configuration: tuned Random Forest at the calibrated threshold. */
export const chosenOps: FinalTestRow = (() => {
  const row = operations.final_test.find((r) => r.threshold === operations.threshold.selected)
  if (!row) throw new Error('Calibrated operations result missing from data')
  return row
})()

/** The deployed financial configuration: the Week 5 XGBoost configuration, refit (Week 6, Table 3). */
export const deployedFin: FinTestRow = (() => {
  const row = report.financial_w6.test.find((r) => r.deployed)
  if (!row) throw new Error('Deployed financial row missing from data')
  return row
})()
