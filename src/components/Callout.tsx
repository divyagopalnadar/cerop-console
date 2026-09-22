import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'
import styles from './Callout.module.css'

interface CalloutProps {
  tone?: 'info' | 'caution'
  title: string
  children: ReactNode
  icon?: IconName
}

export function Callout({ tone = 'info', title, children, icon }: CalloutProps) {
  return (
    <aside className={styles.callout} data-tone={tone}>
      <Icon name={icon ?? (tone === 'caution' ? 'alert' : 'info')} size={16} className={styles.icon} />
      <div className={styles.content}>
        <p className={styles.title}>{title}</p>
        <div className={styles.body}>{children}</div>
      </div>
    </aside>
  )
}
