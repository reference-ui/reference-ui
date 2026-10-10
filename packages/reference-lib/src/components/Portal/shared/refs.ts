/**
 * Shared shape guards with no better home. `isContainerRef` recognizes the
 * `{ current }` ref-object form of a Portal destination, shared by
 * `destination/resolve` (which reads the ref) and `hooks/use-destination`
 * (which watches it for late attachment). It deliberately accepts any
 * object carrying `current` — a `RefObject`, a `createRef` box, or a test
 * double — because Portal resolves destinations, not ref brands.
 */
import type { PortalContainer, PortalContainerRef } from '../types'

export function isContainerRef(
  value: PortalContainer | PortalContainerRef | (() => PortalContainer | null) | null | undefined,
): value is PortalContainerRef {
  return typeof value === 'object' && value !== null && 'current' in value
}
