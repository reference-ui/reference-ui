/**
 * Presence public vocabulary: props, the mounted/suspended/unmounted
 * lifecycle states, both context values, and the kernel hook options.
 * The one type module every Presence domain imports from.
 */
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
  /** One element. It must pass its `ref` to a DOM node. */
  children?: React.ReactElement | null | false
  /** Required. Whether the child is shown. */
  present: boolean
  /** Called once when the child unmounts after a finished exit. Not called for an interrupted exit or on first mount. */
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
