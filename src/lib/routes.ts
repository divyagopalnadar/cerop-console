export const VIEWS = [
  { id: 'overview', label: 'Overview' },
  { id: 'data', label: 'Data & EDA' },
  { id: 'financial', label: 'Financial layer' },
  { id: 'operations', label: 'Operations layer' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'lineage', label: 'Methodology' },
] as const

export type ViewId = (typeof VIEWS)[number]['id']

export interface Route {
  view: ViewId
  params: URLSearchParams
}

const isView = (v: string): v is ViewId => VIEWS.some((view) => view.id === v)

/** Parse "#/operations?t=0.45" into a route. Unknown or empty hashes fall back to the overview. */
export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#\/?/, '')
  const [path = '', query = ''] = raw.split('?')
  return { view: isView(path) ? path : 'overview', params: new URLSearchParams(query) }
}

export function buildHash(view: ViewId, params?: Record<string, string>): string {
  const query = params ? new URLSearchParams(params).toString() : ''
  return `#/${view}${query ? `?${query}` : ''}`
}
