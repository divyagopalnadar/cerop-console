import type { ReactNode } from 'react'
import styles from './Card.module.css'

interface CardProps {
  title: string
  eyebrow?: string
  description?: ReactNode
  actions?: ReactNode
  footer?: ReactNode
  children: ReactNode
  className?: string
  id?: string
}

export function Card({ title, eyebrow, description, actions, footer, children, className, id }: CardProps) {
  const headingId = id ? `${id}-title` : undefined
  return (
    <section className={[styles.card, className].filter(Boolean).join(' ')} aria-labelledby={headingId} id={id}>
      <header className={styles.header}>
        <div className={styles.titles}>
          {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
          <h2 className={styles.title} id={headingId}>
            {title}
          </h2>
          {description && <p className={styles.description}>{description}</p>}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </header>
      <div className={styles.body}>{children}</div>
      {footer && <footer className={styles.footer}>{footer}</footer>}
    </section>
  )
}
