/**
 * Toast mobile hook: live-reads the max-width media query so stacks swap
 * to viewport-spanning sheets below the breakpoint. The host passes the
 * reading into every position stack for offset and width selection.
 */
import * as React from 'react'
import { TOAST_MOBILE_BREAKPOINT } from '../toastQueue'

export function useIsMobile(breakpoint = TOAST_MOBILE_BREAKPOINT) {
  const [mobile, setMobile] = React.useState(false)
  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    const onChange = () => setMobile(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [breakpoint])
  return mobile
}
