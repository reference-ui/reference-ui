/**
 * Toast reduced-motion hook: live-reads the prefers-reduced-motion media
 * query so items and the host can zero transitions the moment the OS
 * setting flips. Defaults to the current query state for first paint.
 */
import * as React from 'react'

function getPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = React.useState(getPrefersReducedMotion)
  React.useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])
  return reduced
}
