import { useCallback, useSyncExternalStore } from 'react'
import { buildHash, parseHash, type Route, type ViewId } from '../lib/routes'

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

const getHash = () => window.location.hash

/**
 * Hash-based routing so deep links survive GitHub Pages (no server rewrites).
 * `replace` updates the URL without adding a history entry, for state like a slider.
 */
export function useHashRoute() {
  const hash = useSyncExternalStore(subscribe, getHash, () => '')
  const route: Route = parseHash(hash)

  const navigate = useCallback(
    (view: ViewId, params?: Record<string, string>, opts?: { replace?: boolean }) => {
      const next = buildHash(view, params)
      if (next === window.location.hash) return
      if (opts?.replace) {
        history.replaceState(null, '', next)
        window.dispatchEvent(new HashChangeEvent('hashchange'))
      } else {
        window.location.hash = next
      }
    },
    [],
  )

  return { route, navigate }
}
