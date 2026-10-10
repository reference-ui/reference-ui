/**
 * Combobox's source and popover registration: focus sources declare
 * input or trigger (exactly one; last-wins under the invariant, and a
 * Trigger source means select-only mode with no text authority), and
 * popovers declare their id (at most one). Zero sources diagnose on
 * every commit without one; duplicates diagnose at registration.
 */
import * as React from 'react'
import { comboboxDiagnostic } from '../shared/diagnostic'
import type { ComboboxSession } from './use-combobox-session'

export interface SourceRegistration {
  focusSource: 'input' | 'trigger' | null
  selectOnly: boolean
  registerFocusSource: (type: 'input' | 'trigger') => () => void
  registerPopover: (id?: string) => () => void
}

export function useSourceRegistration(session: ComboboxSession): SourceRegistration {
  const { focusSourcesRef, focusSourcesCountRef, popoverCountRef, setPopoverId } = session
  const [focusSource, setFocusSource] = React.useState<'input' | 'trigger' | null>(null)
  const selectOnly = focusSource === 'trigger'

  const registerFocusSource = React.useCallback((type: 'input' | 'trigger') => {
    focusSourcesRef.current.add(type)
    focusSourcesCountRef.current += 1
    if (focusSourcesCountRef.current > 1) {
      comboboxDiagnostic(
        'Combobox requires exactly one focus source (Input XOR Trigger). Detected multiple focus sources.'
      )
    }
    setFocusSource(type)
    return () => {
      focusSourcesRef.current.delete(type)
      focusSourcesCountRef.current -= 1
      const remaining = focusSourcesRef.current.values().next().value as
        | 'input'
        | 'trigger'
        | undefined
      setFocusSource(remaining ?? null)
    }
  }, [])

  const registerPopover = React.useCallback((id?: string) => {
    popoverCountRef.current += 1
    if (id) setPopoverId(id)
    if (popoverCountRef.current > 1) {
      comboboxDiagnostic('Combobox allows at most one Popover. Detected duplicate Popovers.')
    }
    return () => {
      popoverCountRef.current -= 1
    }
  }, [])

  React.useLayoutEffect(() => {
    if (focusSourcesCountRef.current === 0) {
      comboboxDiagnostic(
        'Combobox requires exactly one focus source (Input XOR Trigger). Detected 0 focus sources.'
      )
    }
  })

  return { focusSource, selectOnly, registerFocusSource, registerPopover }
}
