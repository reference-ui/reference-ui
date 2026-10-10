/**
 * Toast hotkey hook: focuses the front toast when the host's chord
 * (Alt+T by default, false to suppress) fires. Records the currently
 * focused element as the outside origin first so blur-into-toast never
 * strands focus when the toast later dismisses.
 */
import * as React from 'react'
import { matchesHotkey } from '../toastQueue'
import { setLastOutsideFocus } from './use-outside-focus'

export function useToastHotkey(hotkey: readonly string[] | false) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!matchesHotkey(e, hotkey)) return
      const host = document.querySelector('[data-reference-toast-host]') as HTMLElement | null
      if (!host) return
      const front = host.querySelector<HTMLElement>('[data-reference-toast-id][data-front="true"]')
      if (!front) return
      e.preventDefault()
      const active = document.activeElement
      if (active instanceof HTMLElement && !front.contains(active)) {
        setLastOutsideFocus(active)
      }
      try {
        front.focus({ preventScroll: true, focusVisible: true } as FocusOptions)
      } catch {
        front.focus({ preventScroll: true })
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [hotkey])
}
