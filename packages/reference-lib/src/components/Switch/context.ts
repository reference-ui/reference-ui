/**
 * Switch's private subtree scoping: the checked/disabled pair the root
 * resolves, read by every thumb so authored and default thumbs paint the
 * same state. Never exported from the index — the context is an internal
 * wire between the root and its compound part, defaulting to unchecked
 * and enabled when no provider is above.
 */
import * as React from 'react'

interface SwitchContextValue {
  checked: boolean
  disabled: boolean
}

export const SwitchContext = React.createContext<SwitchContextValue | null>(null)

export function useSwitchContext(): SwitchContextValue {
  return React.useContext(SwitchContext) ?? { checked: false, disabled: false }
}
