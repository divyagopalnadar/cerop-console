import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App, { CREDIT } from '../App'
import { operations } from '../data'
import { cases, statusFor } from '../data/cases'

function go(hash: string) {
  act(() => {
    window.location.hash = hash
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  })
}

describe('navigation', () => {
  it('renders the overview by default with an accessible tablist', () => {
    render(<App />)
    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(5)
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'tab-overview')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/counterparty fail/)
  })

  it('switches views on click and writes the hash', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('tab', { name: 'Financial layer' }))
    expect(window.location.hash).toBe('#/financial')
    expect(screen.getByRole('tab', { name: 'Financial layer' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Counterparty financial distress')
  })

  it('supports arrow, Home and End keys with a roving tabindex', async () => {
    const user = userEvent.setup()
    render(<App />)
    const overview = screen.getByRole('tab', { name: 'Overview' })
    overview.focus()
    await user.keyboard('{ArrowRight}')
    const fin = screen.getByRole('tab', { name: 'Financial layer' })
    expect(fin).toHaveFocus()
    expect(fin).toHaveAttribute('tabindex', '0')
    expect(overview).toHaveAttribute('tabindex', '-1')
    await user.keyboard('{End}')
    expect(screen.getByRole('tab', { name: 'Methodology' })).toHaveAttribute('aria-selected', 'true')
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true')
    await user.keyboard('{ArrowLeft}')
    expect(screen.getByRole('tab', { name: 'Methodology' })).toHaveFocus()
  })

  it('opens a deep link directly', () => {
    go('#/cases')
    render(<App />)
    expect(screen.getByRole('tab', { name: 'Case queue' })).toHaveAttribute('aria-selected', 'true')
  })

  it('source chips link to the lineage row and highlight it', () => {
    go('#/lineage?src=ops-w6-test')
    render(<App />)
    const row = document.getElementById('src-ops-w6-test')
    expect(row).toHaveAttribute('aria-current', 'true')
  })

  it('shows the team credit line in the footer', () => {
    render(<App />)
    expect(screen.getByText(CREDIT)).toBeInTheDocument()
    expect(CREDIT).toBe(
      'Team project · AIT 506 Machine Learning, Westcliff University · Console designed and built by Divya Gopal',
    )
  })
})

describe('theme', () => {
  it('applies and remembers an explicit choice, and clears it for system', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('radio', { name: 'Dark theme' }))
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem('cerop-theme')).toBe('dark')
    await user.click(screen.getByRole('radio', { name: 'Match system theme' }))
    expect(localStorage.getItem('cerop-theme')).toBeNull()
    expect(document.documentElement.dataset.theme).toBe('light')
  })
})

describe('threshold explorer', () => {
  const row = (t: number) => operations.threshold.sweep.find((r) => r.threshold === t)

  it('starts at the calibrated threshold', () => {
    go('#/operations')
    render(<App />)
    expect(screen.getByTestId('threshold-value')).toHaveTextContent('0.39')
    expect(screen.getByTestId('metric-recall')).toHaveTextContent(row(0.39)?.recall.toFixed(3) ?? '')
  })

  it('moving the slider updates metrics, per-1,000 counts and the URL', () => {
    go('#/operations')
    render(<App />)
    const slider = screen.getByRole('slider', { name: /Decision threshold/ })
    fireEvent.change(slider, { target: { value: '0.6' } })
    const r = row(0.6)
    expect(screen.getByTestId('threshold-value')).toHaveTextContent('0.60')
    expect(screen.getByTestId('metric-precision')).toHaveTextContent(r?.precision.toFixed(3) ?? '')
    expect(slider).toHaveAttribute('aria-valuetext', expect.stringContaining('0.60'))
    expect(window.location.hash).toBe('#/operations?t=0.60')
    // Higher cutoff flags fewer orders than the chosen one.
    const caught = Number(screen.getByTestId('per-caught').textContent)
    const missed = Number(screen.getByTestId('per-missed').textContent)
    expect(caught + missed).toBe(548)
    expect(missed).toBeGreaterThan(89)
  })

  it('preset buttons jump to the default and chosen cutoffs', async () => {
    const user = userEvent.setup()
    go('#/operations?t=0.8')
    render(<App />)
    expect(screen.getByTestId('threshold-value')).toHaveTextContent('0.80')
    await user.click(screen.getByRole('button', { name: 'Default 0.50' }))
    expect(screen.getByTestId('threshold-value')).toHaveTextContent('0.50')
    await user.click(screen.getByRole('button', { name: /Chosen 0.39/ }))
    expect(screen.getByTestId('threshold-value')).toHaveTextContent('0.39')
    expect(screen.getByRole('button', { name: /Chosen 0.39/ })).toHaveAttribute('aria-pressed', 'true')
  })

  it('ignores garbage in the URL and clamps out-of-range values', () => {
    go('#/operations?t=abc')
    const { unmount } = render(<App />)
    expect(screen.getByTestId('threshold-value')).toHaveTextContent('0.39')
    unmount()
    go('#/operations?t=5')
    render(<App />)
    expect(screen.getByTestId('threshold-value')).toHaveTextContent('0.90')
  })

  it('switches the test confusion matrix between configurations', async () => {
    const user = userEvent.setup()
    go('#/operations')
    render(<App />)
    const base = operations.final_test[0]
    await user.click(screen.getByRole('radio', { name: 'Baseline · 0.50' }))
    expect(screen.getByRole('table', { name: /Test confusion matrix: Corrected Baseline RF/ })).toHaveTextContent(
      (base?.confusion.tp ?? 0).toLocaleString('en-US'),
    )
  })
})

describe('case queue', () => {
  const list = () => screen.getByRole('list', { name: 'Cases' })

  it('labels the queue as illustrative', () => {
    go('#/cases')
    render(<App />)
    expect(screen.getByText('Illustrative cases: not real model output')).toBeInTheDocument()
  })

  it('filters by status', async () => {
    const user = userEvent.setup()
    go('#/cases')
    render(<App />)
    const n = cases.filter((c) => statusFor(c) === 'review').length
    await user.click(screen.getByRole('radio', { name: `Needs review ${n}` }))
    expect(within(list()).getAllByRole('listitem').filter((li) => li.dataset.status)).toHaveLength(n)
    for (const li of within(list()).getAllByRole('listitem').filter((el) => el.dataset.status)) {
      expect(li.dataset.status).toBe('review')
    }
  })

  it('filters by layer and search, and shows an empty state that clears', async () => {
    const user = userEvent.setup()
    go('#/cases')
    render(<App />)
    await user.click(screen.getByRole('radio', { name: 'Operations' }))
    const opsCount = cases.filter((c) => c.layer === 'OPS').length
    expect(within(list()).getAllByRole('listitem').filter((el) => el.dataset.status)).toHaveLength(opsCount)

    await user.type(screen.getByRole('searchbox', { name: 'Search cases' }), 'kestrel')
    const rows = within(list()).getAllByRole('listitem').filter((el) => el.dataset.status)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toHaveTextContent('SHP-24790')

    await user.type(screen.getByRole('searchbox', { name: 'Search cases' }), 'zzz')
    expect(screen.getByText('No cases match these filters.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(within(list()).getAllByRole('listitem').filter((el) => el.dataset.status)).toHaveLength(cases.length)
  })

  it('expands the why panel with its drivers', async () => {
    const user = userEvent.setup()
    go('#/cases')
    render(<App />)
    const btn = screen.getByRole('button', { name: /Why Harbourline Components Ltd\./ })
    expect(btn).toHaveAttribute('aria-expanded', 'false')
    const panel = document.getElementById(btn.getAttribute('aria-controls') ?? '')
    expect(panel).not.toBeVisible()
    await user.click(btn)
    expect(btn).toHaveAttribute('aria-expanded', 'true')
    expect(panel).toBeVisible()
    expect(panel).toHaveTextContent('Borrowing dependency')
    expect(panel).toHaveTextContent('Immediate executive intervention')
  })
})
