/**
 * Tabs' dev diagnostic: names the component, the bad value, and the
 * registered values so a typo'd controlled value or a mispairing points
 * at its fix. Silent in production; structural diagnostics stay warnings
 * (async anatomy resolving must never false-positive), duplicates throw.
 */
const globalProcess = (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process

export function warnTabs(message: string) {
  if (globalProcess?.env?.NODE_ENV === 'production') return
  console.error(`Reference UI: Tabs ${message}`)
}
