import * as React from 'react'
import type {
  PresenceContextValue,
  PresenceCoordinatorContextValue,
} from './types'

/**
 * Private subtree scoping for nested and coordinated exits. `PresenceContext`
 * links a parent `usePresence` to its descendant instances so the parent can
 * hold its own unmount until every registered descendant exit finishes;
 * `PresenceCoordinatorContext` (provided by Overlay via
 * `usePresenceCoordinator`) holds sibling parts such as Backdrop and Content
 * until the slowest part reports finished. Both default to `null`, meaning
 * "no parent / no coordinator — complete on my own effects alone".
 */

export const PresenceContext =
  React.createContext<PresenceContextValue | null>(null)

export const PresenceCoordinatorContext =
  React.createContext<PresenceCoordinatorContextValue | null>(null)
