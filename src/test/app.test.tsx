import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App, { CREDIT } from '../App'
import { operations, report } from '../data'

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
    expect(tabs).toHaveLength(6)
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
    const next = screen.getByRole('tab', { name: 'Data & EDA' })
    expect(next).toHaveFocus()
    expect(next).toHaveAttribute('tabindex', '0')
    expect(overview).toHaveAttribute('tabindex', '-1')
    await user.keyboard('{End}')
    expect(screen.getByRole('tab', { name: 'Methodology' })).toHaveAttribute('aria-selected', 'true')
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true')
    await user.keyboard('{ArrowLeft}')
    expect(screen.getByRole('tab', { name: 'Methodology' })).toHaveFocus()
  })

  it('opens a deep link directly', () => {
    go('#/timeline')
    render(<App />)
    expect(screen.getByRole('tab', { name: 'Timeline' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(report.timeline.length)
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

describe('financial layer', () => {
  it('shows the deployed Week 5 configuration and the documented matrices', async () => {
    const user = userEvent.setup()
    go('#/financial')
    render(<App />)
    const deployed = screen.getByText('deployed').closest('tr')
    expect(deployed).toHaveTextContent('XGB · Week 5 config (refit)')
    expect(deployed).toHaveTextContent('25/44')
    const [before, , calibrated] = report.financial_w6.matrices
    expect(screen.getByRole('table', { name: /Financial test confusion matrix: Before tuning/ })).toHaveTextContent(
      (before?.tn ?? 0).toLocaleString('en-US'),
    )
    await user.click(screen.getByRole('radio', { name: calibrated?.label ?? '' }))
    const table = screen.getByRole('table', { name: /Financial test confusion matrix: Tuned @ calibrated/ })
    expect(within(table).getByText(String(calibrated?.fp))).toBeInTheDocument()
    expect(within(table).getByText(String(calibrated?.tp))).toBeInTheDocument()
  })
})

describe('data and EDA', () => {
  it('renders the documented EDA figures', () => {
    go('#/data')
    render(<App />)
    expect(screen.getByRole('tab', { name: 'Data & EDA' })).toHaveAttribute('aria-selected', 'true')
    const modes = screen.getByRole('list', { name: 'Late-delivery rate by shipping mode' })
    expect(within(modes).getAllByRole('listitem')).toHaveLength(4)
    expect(modes).toHaveTextContent('95.3%')
    expect(screen.getByRole('table', { name: 'Distribution of shipping delays' })).toHaveTextContent('33.6%')
    expect(screen.getByRole('list', { name: 'Correlation with bankruptcy' })).toHaveTextContent('\u22120.315')
    expect(screen.getByText(/Verdict: not supported/)).toBeInTheDocument()
  })
})

describe('content rules', () => {
  it.each(['overview', 'data', 'financial', 'operations', 'timeline', 'lineage'])(
    '%s view has no placeholder or illustrative wording',
    (view) => {
      go(`#/${view}`)
      render(<App />)
      expect(document.body.textContent ?? '').not.toMatch(/illustrative|placeholder|fictional|not real|mock|sample case/i)
    },
  )
})
