/**
 * ILLUSTRATIVE CASES: NOT REAL MODEL OUTPUT.
 *
 * None of the team notebooks print individual held-out predictions, so this
 * queue is a design demonstration. Company names, shipment ids, scores and
 * drivers are fictional. Feature names are real inputs of each layer (from the
 * Week 4 cleaning notebook and the Week 5 importance table), and the operations
 * cutoff is the real calibrated threshold; nothing else here is model output.
 */
import { operations } from './index'

export type Layer = 'FIN' | 'OPS'
export type Status = 'review' | 'watch' | 'cleared'

export interface Driver {
  feature: string
  /** Whether this input pushes the illustrative score up or down. */
  effect: 'raises' | 'lowers'
  note: string
}

export interface RiskCase {
  id: string
  layer: Layer
  name: string
  detail: string
  /** Counterparty this case belongs to; shipments point at a supplier. */
  counterparty: string
  score: number
  drivers: Driver[]
}

/** Real: the operations threshold chosen on the validation sweep. */
export const OPS_CUTOFF = operations.threshold.selected
/** Illustrative: the financial threshold is not recorded in the available outputs. */
export const FIN_CUTOFF_ILLUSTRATIVE = 0.5
/** Width of the "on watch" band below each cutoff (illustrative policy). */
export const WATCH_BAND = 0.1

export const cutoffFor = (layer: Layer): number =>
  layer === 'OPS' ? OPS_CUTOFF : FIN_CUTOFF_ILLUSTRATIVE

export function statusFor(c: Pick<RiskCase, 'layer' | 'score'>): Status {
  const cutoff = cutoffFor(c.layer)
  if (c.score >= cutoff) return 'review'
  if (c.score >= cutoff - WATCH_BAND) return 'watch'
  return 'cleared'
}

export const STATUS_LABEL: Record<Status, string> = {
  review: 'Needs review',
  watch: 'On watch',
  cleared: 'Cleared',
}

export const cases: RiskCase[] = [
  {
    id: 'FIN-0412',
    layer: 'FIN',
    name: 'Harbourline Components Ltd.',
    detail: 'Tier-1 supplier · electronics',
    counterparty: 'Harbourline Components Ltd.',
    score: 0.81,
    drivers: [
      { feature: 'Borrowing dependency', effect: 'raises', note: 'Heavy reliance on borrowed funds.' },
      { feature: 'Compounding_Leverage_Risk', effect: 'raises', note: 'Short-term liabilities and borrowing both elevated.' },
      { feature: 'Profitability_Composite', effect: 'raises', note: 'Averaged ROA well below peers.' },
    ],
  },
  {
    id: 'FIN-0388',
    layer: 'FIN',
    name: 'Kestrel Polymer Co.',
    detail: 'Tier-2 supplier · plastics',
    counterparty: 'Kestrel Polymer Co.',
    score: 0.63,
    drivers: [
      { feature: 'Debt ratio %', effect: 'raises', note: 'Debt is a large share of assets.' },
      { feature: 'Net worth/Assets', effect: 'raises', note: 'Thin equity cushion.' },
      { feature: 'Cash/Current Liability', effect: 'lowers', note: 'Cash still covers near-term bills.' },
    ],
  },
  {
    id: 'FIN-0271',
    layer: 'FIN',
    name: 'Sunmere Textiles',
    detail: 'Tier-2 supplier · apparel',
    counterparty: 'Sunmere Textiles',
    score: 0.44,
    drivers: [
      { feature: 'Current Liability to Assets', effect: 'raises', note: 'Near-term obligations climbing.' },
      { feature: 'Interest-bearing debt interest rate', effect: 'raises', note: 'Paying more to borrow.' },
      { feature: 'Profitability_Composite', effect: 'lowers', note: 'Still profitable on average.' },
    ],
  },
  {
    id: 'FIN-0199',
    layer: 'FIN',
    name: 'Northgate Fasteners',
    detail: 'Tier-1 supplier · hardware',
    counterparty: 'Northgate Fasteners',
    score: 0.42,
    drivers: [
      { feature: 'Borrowing dependency', effect: 'raises', note: 'Borrowing trending up.' },
      { feature: 'Quick Ratio', effect: 'lowers', note: 'Liquid assets cover current liabilities.' },
    ],
  },
  {
    id: 'FIN-0154',
    layer: 'FIN',
    name: 'Orchard Bay Packaging',
    detail: 'Tier-3 supplier · packaging',
    counterparty: 'Orchard Bay Packaging',
    score: 0.17,
    drivers: [
      { feature: 'Net worth/Assets', effect: 'lowers', note: 'Solid equity base.' },
      { feature: 'Debt ratio %', effect: 'lowers', note: 'Low leverage.' },
    ],
  },
  {
    id: 'FIN-0107',
    layer: 'FIN',
    name: 'Veld & Rowe Metals',
    detail: 'Tier-1 supplier · castings',
    counterparty: 'Veld & Rowe Metals',
    score: 0.09,
    drivers: [
      { feature: 'Profitability_Composite', effect: 'lowers', note: 'Strong, stable returns on assets.' },
      { feature: 'Cash/Current Liability', effect: 'lowers', note: 'Ample cash coverage.' },
    ],
  },
  {
    id: 'FIN-0093',
    layer: 'FIN',
    name: 'Lumen Circuitry Co.',
    detail: 'Tier-2 supplier · PCBs',
    counterparty: 'Lumen Circuitry Co.',
    score: 0.55,
    drivers: [
      { feature: 'Compounding_Leverage_Risk', effect: 'raises', note: 'Leverage and short-term debt together.' },
      { feature: 'Interest-bearing debt interest rate', effect: 'raises', note: 'High borrowing cost.' },
      { feature: 'Quick Ratio', effect: 'lowers', note: 'Some liquidity headroom.' },
    ],
  },
  {
    id: 'SHP-24815',
    layer: 'OPS',
    name: 'Order 24815',
    detail: 'Standard Class · LATAM',
    counterparty: 'Harbourline Components Ltd.',
    score: 0.77,
    drivers: [
      { feature: 'Shipping Mode_Standard Class', effect: 'raises', note: 'Slowest service tier.' },
      { feature: 'Days for shipment (scheduled)', effect: 'raises', note: 'Long scheduled window.' },
      { feature: 'Order Region', effect: 'raises', note: 'Region with frequent delays.' },
    ],
  },
  {
    id: 'SHP-24790',
    layer: 'OPS',
    name: 'Order 24790',
    detail: 'First Class · Europe',
    counterparty: 'Kestrel Polymer Co.',
    score: 0.58,
    drivers: [
      { feature: 'Days for shipment (scheduled)', effect: 'raises', note: 'Tight promise for the lane.' },
      { feature: 'Order_Hour', effect: 'raises', note: 'Placed late in the day.' },
    ],
  },
  {
    id: 'SHP-24731',
    layer: 'OPS',
    name: 'Order 24731',
    detail: 'Second Class · Pacific Asia',
    counterparty: 'Lumen Circuitry Co.',
    score: 0.36,
    drivers: [
      { feature: 'GSCPI', effect: 'raises', note: 'Supply-chain pressure elevated that month.' },
      { feature: 'Order Region', effect: 'raises', note: 'Congested region.' },
      { feature: 'Order Item Discount Rate', effect: 'lowers', note: 'Routine order profile.' },
    ],
  },
  {
    id: 'SHP-24702',
    layer: 'OPS',
    name: 'Order 24702',
    detail: 'Standard Class · USCA',
    counterparty: 'Northgate Fasteners',
    score: 0.35,
    drivers: [
      { feature: 'Shipping Mode_Standard Class', effect: 'raises', note: 'Slowest service tier.' },
      { feature: 'Order_DayOfWeek', effect: 'lowers', note: 'Early-week order.' },
    ],
  },
  {
    id: 'SHP-24688',
    layer: 'OPS',
    name: 'Order 24688',
    detail: 'Same Day · Europe',
    counterparty: 'Veld & Rowe Metals',
    score: 0.31,
    drivers: [
      { feature: 'Days for shipment (scheduled)', effect: 'lowers', note: 'Same-day lane, short window.' },
      { feature: 'Order_Hour', effect: 'raises', note: 'Placed close to cut-off.' },
    ],
  },
  {
    id: 'SHP-24650',
    layer: 'OPS',
    name: 'Order 24650',
    detail: 'Standard Class · Africa',
    counterparty: 'Sunmere Textiles',
    score: 0.22,
    drivers: [
      { feature: 'Market', effect: 'lowers', note: 'Market with steady history.' },
      { feature: 'Category Name', effect: 'lowers', note: 'Low-variance product category.' },
    ],
  },
  {
    id: 'SHP-24611',
    layer: 'OPS',
    name: 'Order 24611',
    detail: 'Second Class · LATAM',
    counterparty: 'Orchard Bay Packaging',
    score: 0.41,
    drivers: [
      { feature: 'Order Country', effect: 'raises', note: 'Country with frequent customs holds.' },
      { feature: 'Benefit per order', effect: 'lowers', note: 'Standard margin order.' },
    ],
  },
  {
    id: 'SHP-24597',
    layer: 'OPS',
    name: 'Order 24597',
    detail: 'First Class · USCA',
    counterparty: 'Veld & Rowe Metals',
    score: 0.12,
    drivers: [
      { feature: 'Shipping Mode_Standard Class', effect: 'lowers', note: 'Premium service tier.' },
      { feature: 'GSCPI', effect: 'lowers', note: 'Calm supply-chain month.' },
    ],
  },
]

/** Counterparties with a financial case and at least one shipment both needing review. */
export function dualRiskCounterparties(list: readonly RiskCase[] = cases): Set<string> {
  const finReview = new Set(
    list.filter((c) => c.layer === 'FIN' && statusFor(c) === 'review').map((c) => c.counterparty),
  )
  const opsReview = new Set(
    list.filter((c) => c.layer === 'OPS' && statusFor(c) === 'review').map((c) => c.counterparty),
  )
  return new Set([...finReview].filter((c) => opsReview.has(c)))
}
