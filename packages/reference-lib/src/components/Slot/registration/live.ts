/**
 * `createLiveRegistration` builds the in-place container `useSlotRegistration`
 * registers once and never replaces: `slotId`, `element`, `meta`, and
 * `visibility` are live getters over the filler's latest options. Content
 * stays fresh without re-registering because a new React element every
 * render is expected, not a structural change worth a version bump.
 */
import type { SlotRegistration, UseSlotRegistrationOptions } from '../types'

export function createLiveRegistration<TMeta>(
  latest: { readonly current: UseSlotRegistrationOptions<TMeta> }
): SlotRegistration<TMeta> {
  return {
    get slotId() {
      return latest.current.slotId
    },
    get element() {
      return latest.current.element
    },
    get meta() {
      return latest.current.meta
    },
    get visibility() {
      return latest.current.visibility
    },
  } as SlotRegistration<TMeta>
}
