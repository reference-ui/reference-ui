/**
 * Menubar's dev diagnostic: a single console.error channel for structural
 * misuse (duplicate values, parts outside their parents). Silent in
 * production; every message names the offending part so the fix is local.
 */
import { isDevelopment } from '../../../core/env/dev'

export function devWarn(message: string) {
  if (isDevelopment()) {
    console.error(`Reference UI: ${message}`)
  }
}
