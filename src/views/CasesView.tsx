import { useDeferredValue, useId, useMemo, useState } from 'react'
import { LayerChip, LAYER_NAME, StatusBadge } from '../components/Badges'
import { Callout } from '../components/Callout'
import { Icon } from '../components/Icon'
import { PageHeader } from '../components/PageHeader'
import { Segmented } from '../components/Segmented'
import { SourceTag } from '../components/SourceTag'
import { crossLayer, operations } from '../data'
import {
  cases,
  cutoffFor,
  dualRiskCounterparties,
  FIN_CUTOFF_ILLUSTRATIVE,
  OPS_CUTOFF,
  STATUS_LABEL,
  statusFor,
  WATCH_BAND,
  type Layer,
  type RiskCase,
  type Status,
} from '../data/cases'
import { thr } from '../lib/format'
import styles from './CasesView.module.css'

type StatusFilter = Status | 'all'
type LayerFilter = Layer | 'all'
type SortKey = 'score' | 'name'

const STATUSES: Status[] = ['review', 'watch', 'cleared']

export function filterCases(
  list: readonly RiskCase[],
  { status, layer, query }: { status: StatusFilter; layer: LayerFilter; query: string },
): RiskCase[] {
  const q = query.trim().toLowerCase()
  return list.filter(
    (c) =>
      (status === 'all' || statusFor(c) === status) &&
      (layer === 'all' || c.layer === layer) &&
      (!q || [c.id, c.name, c.counterparty, c.detail].some((f) => f.toLowerCase().includes(q))),
  )
}

export function CasesView() {
  const [status, setStatus] = useState<StatusFilter>('all')
  const [layer, setLayer] = useState<LayerFilter>('all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('score')
  const [open, setOpen] = useState<Set<string>>(() => new Set())
  const deferredQuery = useDeferredValue(query)
  const searchId = useId()
  const sortId = useId()

  const dual = useMemo(() => dualRiskCounterparties(cases), [])
  const scoped = useMemo(() => filterCases(cases, { status: 'all', layer, query: deferredQuery }), [layer, deferredQuery])
  const visible = useMemo(() => {
    const list = filterCases(scoped, { status, layer: 'all', query: '' })
    return list.sort((a, b) => (sort === 'score' ? b.score - a.score : a.name.localeCompare(b.name)))
  }, [scoped, status, sort])

  const counts = Object.fromEntries(STATUSES.map((s) => [s, scoped.filter((c) => statusFor(c) === s).length])) as Record<Status, number>
  const statusOptions = [
    { value: 'all' as const, label: `All ${scoped.length}` },
    ...STATUSES.map((s) => ({ value: s, label: `${STATUS_LABEL[s]} ${counts[s]}` })),
  ]
  const playbook = (label: string) => crossLayer.playbook.find((p) => p.label === label)?.action

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <div className={styles.stack}>
      <PageHeader
        eyebrow="Case queue · triage"
        title="Who needs a look today"
        lead="A working queue for a risk analyst: both layers in one list, sorted by score, with the reasons a case was flagged one click away."
      />

      <Callout tone="caution" title="Illustrative cases: not real model output">
        <p>
          The team's notebooks don't print individual predictions, so every company, order, score and driver
          below is fictional. The feature names are real model inputs, and the operations cutoff (
          {thr(OPS_CUTOFF)}) is the one the team calibrated. The financial cutoff ({thr(FIN_CUTOFF_ILLUSTRATIVE)}) and the{' '}
          {thr(WATCH_BAND)}-wide watch band are illustrative.
        </p>
      </Callout>

      <section className={styles.panel} aria-labelledby="queue-title">
        <h2 id="queue-title" className="visually-hidden">
          Case list
        </h2>
        <div className={styles.toolbar}>
          <div className={styles.search}>
            <label htmlFor={searchId} className="visually-hidden">
              Search cases
            </label>
            <Icon name="search" size={15} className={styles.searchIcon} />
            <input
              id={searchId}
              type="search"
              placeholder="Search company, order or ID"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
            />
          </div>
          <Segmented
            label="Layer"
            hideLabel
            options={[
              { value: 'all', label: 'Both layers' },
              { value: 'FIN', label: 'Financial' },
              { value: 'OPS', label: 'Operations' },
            ]}
            value={layer}
            onChange={setLayer}
          />
          <div className={styles.sort}>
            <label htmlFor={sortId}>Sort</label>
            <select id={sortId} value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
              <option value="score">Highest score</option>
              <option value="name">Name A–Z</option>
            </select>
          </div>
        </div>
        <div className={styles.statusRow}>
          <Segmented label="Status" hideLabel options={statusOptions} value={status} onChange={setStatus} />
        </div>

        <output className="visually-hidden" aria-live="polite">
          {visible.length} {visible.length === 1 ? 'case' : 'cases'} shown
        </output>

        {visible.length === 0 ? (
          <div className={styles.empty}>
            <p>No cases match these filters.</p>
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setStatus('all')
                setLayer('all')
              }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <ul className={styles.list} role="list" aria-label="Cases">
            {visible.map((c) => {
              const st = statusFor(c)
              const isOpen = open.has(c.id)
              const isDual = dual.has(c.counterparty) && st === 'review'
              const cutoff = cutoffFor(c.layer)
              const panelId = `why-${c.id}`
              return (
                <li key={c.id} className={styles.item} data-status={st}>
                  <div className={styles.row}>
                    <LayerChip layer={c.layer} />
                    <div className={styles.who}>
                      <p className={styles.name}>
                        {c.name}
                        <span className={styles.id}>{c.id}</span>
                      </p>
                      <p className={styles.detail}>
                        {c.detail}
                        {c.layer === 'OPS' && <> · supplier {c.counterparty}</>}
                      </p>
                    </div>
                    <div className={styles.score} title={`Score ${c.score.toFixed(2)} against a ${thr(cutoff)} cutoff`}>
                      <span className={styles.scoreNum}>{c.score.toFixed(2)}</span>
                      <span className={styles.meter} aria-hidden="true">
                        <span className={styles.meterFill} style={{ width: `${c.score * 100}%` }} />
                        <span className={styles.meterCut} style={{ left: `${cutoff * 100}%` }} />
                      </span>
                      <span className="visually-hidden">
                        Illustrative score {c.score.toFixed(2)}, cutoff {thr(cutoff)}
                      </span>
                    </div>
                    <div className={styles.badges}>
                      <StatusBadge status={st} />
                      {isDual && <span className={styles.dual}>Dual risk</span>}
                    </div>
                    <button
                      type="button"
                      className={styles.why}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => toggle(c.id)}
                      aria-label={`Why ${c.name}`}
                    >
                      Why
                      <Icon name="chevron" size={14} className={styles.chev} />
                    </button>
                  </div>
                  <div id={panelId} className={styles.drawer} hidden={!isOpen}>
                    <p className={styles.drawerHead}>Top contributing inputs (illustrative)</p>
                    <ul className={styles.drivers} role="list">
                      {c.drivers.map((d) => (
                        <li key={d.feature}>
                          <span className={styles.effect} data-effect={d.effect}>
                            <Icon name={d.effect === 'raises' ? 'arrowUp' : 'arrowDown'} size={13} />
                            {d.effect === 'raises' ? 'Raises risk' : 'Lowers risk'}
                          </span>
                          <code className={styles.feature}>{d.feature}</code>
                          <span className={styles.note}>{d.note}</span>
                        </li>
                      ))}
                    </ul>
                    <p className={styles.action}>
                      <b>Playbook · </b>
                      {isDual
                        ? playbook('High Dual Risk')
                        : st === 'review'
                          ? playbook(c.layer === 'FIN' ? 'Financial Only' : 'Operational Only')
                          : st === 'watch'
                            ? `Within ${thr(WATCH_BAND)} of the ${LAYER_NAME[c.layer].toLowerCase()} cutoff: re-score when new data lands.`
                            : 'No action; stays in routine monitoring.'}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
        <footer className={styles.foot}>
          <span>Playbook actions from</span>
          <SourceTag id={crossLayer.playbook_source} />
          <span>Operations cutoff from</span>
          <SourceTag id={operations.threshold.source} />
        </footer>
      </section>
    </div>
  )
}
