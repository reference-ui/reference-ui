/**
 * Want matchers for the atomic case helpers: whether a compile result carries a want with a given
 * prop, value and condition path, the site, harvest and per-prop slices of its wants, and each
 * prop's want verdicts by backing. Takes a `CompileResult` and returns a boolean, a want list or
 * verdict strings. Wants with `origin: 'harvest'` were minted
 * onto refused dynamic sinks, so the site slice leaves them out.
 */
import type { CompileResult } from '../../js/types.js'

function matchesWantValue(actual: unknown, expected: string | number | boolean): boolean {
  if (typeof expected === 'string') {
    return (actual as Record<string, string>)?.String === expected
  }
  if (typeof expected === 'number') {
    return (actual as Record<string, string>)?.Number === String(expected)
  }
  if (typeof expected === 'boolean') {
    return (actual as Record<string, boolean>)?.Bool === expected
  }
  return false
}

export function hasWant(
  result: CompileResult,
  prop: string,
  value: string | number | boolean,
  when: string[] = []
): boolean {
  return (result.wants ?? []).some(
    w =>
      w.prop === prop &&
      matchesWantValue(w.value, value) &&
      w.when.length === when.length &&
      w.when.every((cond, idx) => cond === when[idx])
  )
}

export function getWantsForProp(
  result: CompileResult,
  prop: string
): NonNullable<CompileResult['wants']> {
  return (result.wants ?? []).filter(w => w.prop === prop)
}

/** Wants minted by the site walk, excluding the harvest floor (`ATM-HARVEST-01`). */
export function siteWants(
  result: CompileResult
): NonNullable<CompileResult['wants']> {
  return (result.wants ?? []).filter(w => w.origin !== 'harvest')
}

/** Wants minted by harvest onto refused dynamic sinks (`ATM-HARVEST-01`). */
export function harvestWants(
  result: CompileResult
): NonNullable<CompileResult['wants']> {
  return (result.wants ?? []).filter(w => w.origin === 'harvest')
}

/**
 * Each want of `prop` as `<value> <backing>`, sorted: `own` for the compiling system, the systems
 * a non-own want backs under joined by `+`, or `unbacked` when nothing composed backs it.
 */
export function wantBackings(result: CompileResult, prop: string): string[] {
  return getWantsForProp(result, prop)
    .map(w => {
      const value = (w.value as { String: string }).String
      if (w.backing === undefined) {
        return `${value} own`
      }
      return `${value} ${w.backing.length > 0 ? w.backing.join('+') : 'unbacked'}`
    })
    .sort()
}
