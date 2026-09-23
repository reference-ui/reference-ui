// Reference bridge logging: it takes build milestones and emits `[neo] [ref]`
// console lines. Neo has no log module — bare console with the `[neo]` prefix
// is the house convention — so the bridge logs straight through it. One line
// per level per build; the background phase stays quiet by shape, not by flag.

import type { ReferenceBuildComplete } from './events.ts'

const BADGE = '[neo] [ref]'

function formatElapsed(durationMs: number): string {
  return `${(durationMs / 1000).toFixed(durationMs >= 10_000 ? 1 : 2)}s`
}

export function logReferenceBuilt(durationMs: number): void {
  console.info(`${BADGE} Built reference in ${formatElapsed(durationMs)}`)
}

export function logReferenceWarning(message: string): void {
  console.warn(`${BADGE} ${message}`)
}

export function logReferenceCompleted(details: ReferenceBuildComplete): void {
  console.debug(`${BADGE} Reference build completed`, details)
}

export function logReferenceError(error: unknown): void {
  console.error(`${BADGE} Build failed:`, error)
}
