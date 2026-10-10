/**
 * Submenu intent state: the open/close timers, travel samples, and
 * keyboard-open flag one submenu level owns while mounted. Fresh
 * state per level, timers cleared on close and unmount so a rejected
 * open never fires late. Pure construction and clearing; unit-tested.
 */
import type { Point as IntentPoint, PointerSample as IntentSample } from '../intent/menu-intent'

export interface SubmenuIntentState {
  openTimer: ReturnType<typeof setTimeout> | null
  closeTimer: ReturnType<typeof setTimeout> | null
  leavePoint: IntentPoint | null
  prevSample: IntentSample | null
  keyboardOpen: boolean
  /** A close was requested for the current away episode; re-entry clears it. */
  closeRequested: boolean
}

export function freshIntentState(): SubmenuIntentState {
  return {
    openTimer: null,
    closeTimer: null,
    leavePoint: null,
    prevSample: null,
    keyboardOpen: false,
    closeRequested: false,
  }
}

export function clearIntentTimer(state: SubmenuIntentState, kind: 'openTimer' | 'closeTimer') {
  if (state[kind]) {
    clearTimeout(state[kind]!)
    state[kind] = null
  }
}
