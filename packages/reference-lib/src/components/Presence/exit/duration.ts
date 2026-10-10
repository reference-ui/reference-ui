/**
 * CSS time-list parsing for exit-effect detection. `parseDuration` converts
 * one `animation-duration` / `transition-delay` token (`300ms`, `0.3s`) to
 * milliseconds so `effects.ts` can decide whether a declared effect actually
 * runs; blank and unparseable tokens are zero, because a duration the browser
 * cannot run is an exit Presence must not wait for.
 */

export function parseDuration(str: string): number {
  const trimmed = str.trim()
  if (!trimmed) return 0
  const val = parseFloat(trimmed)
  if (isNaN(val)) return 0
  return trimmed.endsWith('ms') ? val : val * 1000
}
