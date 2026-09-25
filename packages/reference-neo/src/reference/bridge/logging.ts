// Reference bridge logging: it takes build milestones and emits `[neo] [ref]`
// console lines. Neo has no log module — bare console with the `[neo]` prefix
// is the house convention — so the bridge logs straight through it. Warnings
// ride the unified one-line summary, not this badge; only the built line and
// the loud failure stay here, one per build.

const BADGE = '[neo] [ref]'

function formatElapsed(durationMs: number): string {
  return `${(durationMs / 1000).toFixed(durationMs >= 10_000 ? 1 : 2)}s`
}

export function logReferenceBuilt(durationMs: number): void {
  console.info(`${BADGE} Built reference in ${formatElapsed(durationMs)}`)
}

export function logReferenceError(error: unknown): void {
  console.error(`${BADGE} Build failed:`, error)
}
