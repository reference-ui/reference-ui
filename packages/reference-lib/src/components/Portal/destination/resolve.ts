/**
 * Pure destination math for Portal, with no React and no lifecycle.
 * `resolveContainer` maps every accepted `container` form — omitted, null,
 * ref object, resolver function, element, or fragment — onto a concrete
 * destination node or null, defaulting to `document.body` only for the
 * omitted and explicit-null forms. `destinationDocument` derives the owner
 * document of a resolved node so `scope/PortalScope` can stamp it into
 * `DocumentContext`. The realm-safe `nodeType` check (never `instanceof`
 * `Element`) is what lets same-origin iframe destinations pass.
 */
import type { PortalContainer, PortalProps } from '../types'
import { isContainerRef } from '../shared/refs'

export function resolveContainer(
  containerProp?: PortalProps['container'],
): PortalContainer | null {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null
  }

  // 1. Omitted or explicitly null -> default to document.body
  if (containerProp === undefined || containerProp === null) {
    return document.body
  }

  // 2. Ref object ({ current: ... })
  if (isContainerRef(containerProp)) {
    return containerProp.current
  }

  // 3. Resolver function (() => ...)
  if (typeof containerProp === 'function') {
    return containerProp()
  }

  // 4. Direct Element or DocumentFragment. Realm-safe nodeType check:
  // an element from an iframe document fails `instanceof` against this
  // realm's globals, so identity must come from the node itself (PT-ENV-04).
  const nodeType = (containerProp as Node).nodeType
  if (nodeType === 1 || nodeType === 11) {
    return containerProp as PortalContainer
  }

  return null
}

export function destinationDocument(node: PortalContainer): Document | null {
  if (node instanceof Document) {
    return node
  }
  return (node as Node).ownerDocument ?? null
}
