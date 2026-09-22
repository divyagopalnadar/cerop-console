import { PageHeader } from '../components/PageHeader'
import { SourceTag } from '../components/SourceTag'
import { report } from '../data'
import styles from './TimelineView.module.css'

export function TimelineView() {
  const { timeline, project } = report
  return (
    <div className={styles.stack}>
      <PageHeader
        eyebrow={`Timeline · ${project.term}`}
        title="What each week decided"
        lead={`${project.group}, ${project.course}, ${project.university}. Each week built on the one before; the report records the decisions, including the ones that reversed earlier work.`}
      />
      <ol className={styles.timeline} role="list">
        {timeline.map((w) => (
          <li key={w.week} className={styles.week} data-planned={w.title.includes('planned') || undefined}>
            <span className={styles.marker} aria-hidden="true">
              {w.week}
            </span>
            <div className={styles.body}>
              <h2 className={styles.title}>
                <span className={styles.wk}>Week {w.week}</span> {w.title}
              </h2>
              <ul className={styles.points} role="list">
                {w.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              <SourceTag id={w.source} />
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
