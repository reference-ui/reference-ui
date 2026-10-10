import type * as React from 'react'

/**
 * Public Presence prop/state types. `PresenceProps` is the component contract
 * (`present` plus an optional `onExitComplete` edge); `PresenceState` is the
 * Radix-lifted lifecycle (`mounted` → `unmountSuspended` → `unmounted`);
 * `UsePresenceOptions` tunes the `usePresence` hook; the two context values
 * carry nested-descendant and sibling-part coordination down the tree. No JSX,
 * no logic — behavior lives in `hooks/` and the `exit/`, `nesting/`, and
 * `coordination/` domains.
 */

export interface PresenceProps {
  children?: React.ReactElement | null | false
  present: boolean
  /** Fires exactly once when content unmounts after a completed exit. Never on interrupted exits or initial mount. */
  onExitComplete?: () => void
}

export type PresenceState = 'mounted' | 'unmountSuspended' | 'unmounted'

export interface PresenceContextValue {
  registerDescendant: (id: string) => void
  unregisterDescendant: (id: string) => void
  onDescendantExitComplete: (id: string) => void
}

export interface PresenceCoordinatorContextValue {
  registerPart: (id: string) => void
  unregisterPart: (id: string) => void
  reportPartFinished: (id: string) => void
  subscribeToAllComplete: (cb: () => void) => () => void
  isCoordinatorActive: () => boolean
}

export interface UsePresenceOptions {
  hasChild?: boolean
  onExitComplete?: () => void
}
