import type { ReactNode } from 'react'
import styles from './PageHeader.module.css'

interface PageHeaderProps {
  eyebrow: string
  title: string
  lead: ReactNode
  aside?: ReactNode
}

export function PageHeader({ eyebrow, title, lead, aside }: PageHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.text}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.lead}>{lead}</p>
      </div>
      {aside && <div className={styles.aside}>{aside}</div>}
    </header>
  )
}
