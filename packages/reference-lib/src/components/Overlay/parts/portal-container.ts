import type { PortalProps } from '../../Portal'
import type { OverlayContextValue } from '../context'

/**
 * Shadow destination rule (FEATURES #1, decided AUTOMATIC).
 *
 * An explicit `Overlay.Portal container` always wins — including `null`,
 * which keeps Portal's historical default-to-body meaning. When the
 * container is omitted (`undefined`), the destination follows the trigger:
 * a trigger living in a ShadowRoot portals Backdrop and Content into that
 * root (`trigger.getRootNode()`); otherwise destination stays `undefined`
 * and Portal falls back to `document.body`.
 *
 * Composed inside/outside dismissal inside the shadow destination follows
 * the proven `OV-OUT-09` path; shadow+modal keeps the full `OV-ENV-03`
 * contract. Popover and Menu inherit the rule — they forward an omitted
 * container as `undefined`.
 */
export function resolvePortalContainer(
  context: OverlayContextValue
): PortalProps['container'] {
  if (context.portalContainer !== undefined) return context.portalContainer
  const trigger = context.triggerRef.current
  const root = trigger?.getRootNode?.() ?? null
  if (
    root !== null &&
    typeof ShadowRoot !== 'undefined' &&
    root instanceof ShadowRoot
  ) {
    return root
  }
  return undefined
}
