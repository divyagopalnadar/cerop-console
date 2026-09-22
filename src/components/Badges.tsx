import type { Layer, Status } from '../data/cases'
import { STATUS_LABEL } from '../data/cases'
import { Icon } from './Icon'
import styles from './Badges.module.css'

const STATUS_ICON = { review: 'alert', watch: 'eye', cleared: 'check' } as const

/** Status always ships as icon + label, never colour alone. */
export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={styles.status} data-status={status}>
      <Icon name={STATUS_ICON[status]} size={13} />
      {STATUS_LABEL[status]}
    </span>
  )
}

export const LAYER_NAME: Record<Layer, string> = { FIN: 'Financial', OPS: 'Operations' }

export function LayerChip({ layer }: { layer: Layer }) {
  return (
    <span className={styles.layer} data-layer={layer} title={`${LAYER_NAME[layer]} layer`}>
      {layer}
    </span>
  )
}
