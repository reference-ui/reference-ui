// Reference bridge logging: it takes build failures and emits the loud
// `[core] [ref]` line. Core has no log module — bare console with the
// `[core]` prefix is the house convention — so the bridge logs straight
// through it. Success is silent; only failures stay here, one per build.

const BADGE = '[core] [ref]'

export function logReferenceError(error: unknown): void {
  console.error(`${BADGE} Build failed:`, error)
}
