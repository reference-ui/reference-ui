/**
 * Nearest-enabled resolution: the tab a value falls back to when its
 * own tab is disabled, removed, or unknown. Self when enabled, else an
 * outward walk in tab order with ties going to the preceding tab, else
 * first-enabled. Pure over caller-supplied orders so removals can walk
 * pre-removal positions; unit-tested.
 */
export function nearestEnabledValue(
  fromValue: string,
  enabled: readonly string[],
  all: readonly string[]
): string | undefined {
  if (enabled.includes(fromValue)) return fromValue
  const idx = all.indexOf(fromValue)
  for (let d = 1; d <= all.length; d++) {
    const prev = idx === -1 ? undefined : all[idx - d]
    if (prev !== undefined && enabled.includes(prev)) return prev
    const next = idx === -1 ? undefined : all[idx + d]
    if (next !== undefined && enabled.includes(next)) return next
  }
  return enabled[0]
}
