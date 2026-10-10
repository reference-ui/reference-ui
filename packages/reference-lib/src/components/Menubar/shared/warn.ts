/**
 * Menubar's dev diagnostic: a single console.error channel for structural
 * misuse (duplicate values, parts outside their parents). Silent in
 * production; every message names the offending part so the fix is local.
 */
export function devWarn(message: string) {
  if (process.env.NODE_ENV !== 'production') {
    console.error(`Reference UI: ${message}`)
  }
}
