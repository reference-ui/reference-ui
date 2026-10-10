/**
 * Process-wide registration ids for `useSlotRegistration`. One counter
 * serves every slot context because ids only need to be unique within the
 * single `SlotRoot` they register into, and a shared sequence guarantees
 * that even when fillers remount under `StrictMode` replay.
 */
let registrationCounter = 0

export function nextSlotRegistrationId(): string {
  return `slot-reg-${++registrationCounter}`
}
