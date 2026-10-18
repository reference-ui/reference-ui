// Reference bridge logging: it takes build failures and emits the loud
// `[neo] [ref]` line. Neo has no log module — bare console with the
// `[neo]` prefix is the house convention — so the bridge logs straight
// through it. Success is silent; only failures stay here, one per build.

const BADGE = '[neo] [ref]'

export function logReferenceError(error: unknown): void {
  console.error(`${BADGE} Build failed:`, error)
}
