/**
 * Tabs' dev diagnostic: names the component, the bad value, and the
 * registered values so a typo'd controlled value or a mispairing points
 * at its fix. Silent in production; structural diagnostics stay warnings
 * (async anatomy resolving must never false-positive), duplicates throw.
 */
import { isDevelopment } from '../../../core/env/dev'

export function warnTabs(message: string) {
  if (!isDevelopment()) return
  console.error(`Reference UI: Tabs ${message}`)
}
